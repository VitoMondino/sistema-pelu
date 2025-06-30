const db = require('../db');

// Obtener todos los turnos con información de cliente y servicio
async function getAllTurnos(req, res, next) {
  try {
    const query = `
      SELECT
        t.id,
        t.fecha_hora,
        t.estado,
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.telefono as cliente_telefono,
        s.id as servicio_id,
        s.nombre_servicio as servicio_nombre,
        s.precio as servicio_precio
      FROM turnos t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN servicios s ON t.servicio_id = s.id
      ORDER BY t.fecha_hora DESC
    `;
    const rows = await db.query(query);
    res.json(rows.map(row => ({
      ...row,
      // Devolvemos fecha_hora en string tal cual, o convertí si querés formato ISO
      fecha_hora: row.fecha_hora // puedes cambiar a new Date(row.fecha_hora).toISOString() si prefieres
    })));
  } catch (error) {
    next(error);
  }
}

// Obtener un turno por ID
async function getTurnoById(req, res, next) {
  const { id } = req.params;
  try {
    const query = `
      SELECT
        t.id,
        t.fecha_hora,
        t.estado,
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.telefono as cliente_telefono,
        s.id as servicio_id,
        s.nombre_servicio as servicio_nombre,
        s.precio as servicio_precio
      FROM turnos t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN servicios s ON t.servicio_id = s.id
      WHERE t.id = ?
    `;
    const rows = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    res.json({
      ...rows[0],
      fecha_hora: rows[0].fecha_hora // o new Date(rows[0].fecha_hora).toISOString() si querés ISO
    });
  } catch (error) {
    next(error);
  }
}

// Agendar un nuevo turno
async function createTurno(req, res, next) {
  const { cliente_id, servicio_id, fecha_hora, estado } = req.body;

  if (!cliente_id || !servicio_id || !fecha_hora) {
    return res.status(400).json({ message: 'Cliente, servicio y fecha/hora son requeridos.' });
  }

  // Validar que fecha_hora venga en formato YYYY-MM-DD HH:mm:ss
  const fechaHoraRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!fechaHoraRegex.test(fecha_hora)) {
    return res.status(400).json({ message: 'Formato de fecha_hora inválido. Debe ser YYYY-MM-DD HH:mm:ss' });
  }

  // Validar estado
  const estadosPermitidos = ['Pendiente', 'Realizado', 'Cancelado'];
  if (estado && !estadosPermitidos.includes(estado)) {
    return res.status(400).json({ message: `Estado inválido. Permitidos: ${estadosPermitidos.join(', ')}` });
  }

  try {
    // Validar cliente y servicio
    const cliente = await db.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
    if (cliente.length === 0) return res.status(404).json({ message: 'Cliente no encontrado.' });

    const servicio = await db.query('SELECT id FROM servicios WHERE id = ?', [servicio_id]);
    if (servicio.length === 0) return res.status(404).json({ message: 'Servicio no encontrado.' });

    const result = await db.query(
      'INSERT INTO turnos (cliente_id, servicio_id, fecha_hora, estado) VALUES (?, ?, ?, ?)',
      [cliente_id, servicio_id, fecha_hora, estado || 'Pendiente']
    );

    res.status(201).json({
      message: 'Turno agendado con éxito!',
      id: result.insertId,
      cliente_id,
      servicio_id,
      fecha_hora, // Enviamos tal cual para que frontend lo use
      estado: estado || 'Pendiente'
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar un turno
async function updateTurno(req, res, next) {
  const { id } = req.params;
  const { cliente_id, servicio_id, fecha_hora, estado } = req.body;

  if (!cliente_id && !servicio_id && !fecha_hora && !estado) {
    return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar.' });
  }

  let fechaHoraValidada;
  if (fecha_hora) {
    const fechaHoraRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!fechaHoraRegex.test(fecha_hora)) {
      return res.status(400).json({ message: 'Formato de fecha_hora inválido. Debe ser YYYY-MM-DD HH:mm:ss' });
    }
    fechaHoraValidada = fecha_hora;
  }

  const estadosPermitidos = ['Pendiente', 'Realizado', 'Cancelado'];
  if (estado && !estadosPermitidos.includes(estado)) {
    return res.status(400).json({ message: `Estado inválido. Permitidos: ${estadosPermitidos.join(', ')}` });
  }

  try {
    // Obtener turno actual
    const currentTurnoRows = await db.query('SELECT * FROM turnos WHERE id = ?', [id]);
    if (currentTurnoRows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado para actualizar' });
    }
    const currentTurno = currentTurnoRows[0];

    // Validar cliente y servicio si se actualizan
    if (cliente_id) {
      const cliente = await db.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
      if (cliente.length === 0) return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    if (servicio_id) {
      const servicio = await db.query('SELECT id FROM servicios WHERE id = ?', [servicio_id]);
      if (servicio.length === 0) return res.status(404).json({ message: 'Servicio no encontrado.' });
    }

    const final_cliente_id = cliente_id || currentTurno.cliente_id;
    const final_servicio_id = servicio_id || currentTurno.servicio_id;
    const final_fecha_hora = fechaHoraValidada || currentTurno.fecha_hora;
    const final_estado = estado || currentTurno.estado;

    const result = await db.query(
      'UPDATE turnos SET cliente_id = ?, servicio_id = ?, fecha_hora = ?, estado = ? WHERE id = ?',
      [final_cliente_id, final_servicio_id, final_fecha_hora, final_estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Turno no encontrado para actualizar o ningún dato cambió' });
    }

    res.json({
      message: 'Turno actualizado con éxito!',
      id,
      cliente_id: final_cliente_id,
      servicio_id: final_servicio_id,
      fecha_hora: final_fecha_hora,
      estado: final_estado
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar turno (opcional)
async function deleteTurno(req, res, next) {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM turnos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Turno no encontrado para eliminar' });
    }
    res.json({ message: 'Turno eliminado con éxito' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTurnos,
  getTurnoById,
  createTurno,
  updateTurno,
  deleteTurno,
};
