const db = require('../db');

// Obtener todas las asistencias (mapa cliente_id -> registro)
async function getAllAsistencias(req, res, next) {
  try {
    const rows = await db.query('SELECT * FROM asistencias');
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function getAsistenciaByCliente(req, res, next) {
  const { clienteId } = req.params;
  try {
    const rows = await db.query('SELECT * FROM asistencias WHERE cliente_id = ?', [clienteId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No existe registro de asistencia para este cliente' });
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// Marcar un corte (incrementa contador hasta 4, si llega a 4 se registra y se resetea a 0)
async function marcarAsistencia(req, res, next) {
  const { clienteId } = req.params;
  const usuarioId = req.user?.id || null;
  try {
    // Asegurar que exista fila en asistencias para el cliente
    let rows = await db.query('SELECT * FROM asistencias WHERE cliente_id = ?', [clienteId]);
    if (rows.length === 0) {
      // crear registro inicial
      await db.query('INSERT INTO asistencias (cliente_id, contador, ciclo_inicio) VALUES (?, 0, CURDATE())', [clienteId]);
      rows = await db.query('SELECT * FROM asistencias WHERE cliente_id = ?', [clienteId]);
    }
    const asistencia = rows[0];
    let nuevoContador = asistencia.contador + 1;

    // Insertar historial de marcado
    await db.query('INSERT INTO asistencias_historial (asistencia_id, usuario_id, accion) VALUES (?, ?, ?)', [asistencia.id, usuarioId, 'marcado']);

    if (nuevoContador >= 4) {
      // completar ciclo: registrar evento de reseteo en historial y resetear a 0 y actualizar ciclo_inicio
      await db.query('UPDATE asistencias SET contador = 0, ciclo_inicio = CURDATE(), updated_at = NOW() WHERE id = ?', [asistencia.id]);
      await db.query('INSERT INTO asistencias_historial (asistencia_id, usuario_id, accion) VALUES (?, ?, ?)', [asistencia.id, usuarioId, 'reseteado']);
      return res.json({ message: 'Se completaron 4 cortes. Contador reiniciado a 0.', contador: 0 });
    } else {
      await db.query('UPDATE asistencias SET contador = ? WHERE id = ?', [nuevoContador, asistencia.id]);
      return res.json({ message: 'Asistencia marcada.', contador: nuevoContador });
    }
  } catch (err) {
    next(err);
  }
}

async function resetAsistencia(req, res, next) {
  const { clienteId } = req.params;
  const usuarioId = req.user?.id || null;
  try {
    const rows = await db.query('SELECT * FROM asistencias WHERE cliente_id = ?', [clienteId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Registro de asistencia no encontrado para este cliente' });
    }
    const asistencia = rows[0];
    await db.query('UPDATE asistencias SET contador = 0, ciclo_inicio = CURDATE(), updated_at = NOW() WHERE id = ?', [asistencia.id]);
    await db.query('INSERT INTO asistencias_historial (asistencia_id, usuario_id, accion) VALUES (?, ?, ?)', [asistencia.id, usuarioId, 'reseteado']);
    res.json({ message: 'Contador reiniciado a 0.', contador: 0 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllAsistencias,
  getAsistenciaByCliente,
  marcarAsistencia,
  resetAsistencia
};