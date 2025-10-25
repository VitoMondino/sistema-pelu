const db = require('../db');

// Obtener todos los turnos con información de cliente y servicio
async function getAllTurnos(req, res, next) {
  try {
    const query = `
      SELECT
        t.id,
        t.fecha_hora,
        t.estado,
        t.turno_fijo,
        t.dia_semana,
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
      fecha_hora: row.fecha_hora
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
        t.turno_fijo,
        t.dia_semana,
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
      fecha_hora: rows[0].fecha_hora
    });
  } catch (error) {
    next(error);
  }
}

// Agendar un nuevo turno (soporta turnos fijos)
async function createTurno(req, res, next) {
  const { cliente_id, servicio_id, fecha_hora, estado, turno_fijo, dia_semana } = req.body;

  if (!cliente_id || !servicio_id || !fecha_hora) {
    return res.status(400).json({ message: 'Cliente, servicio y fecha/hora son requeridos.' });
  }

  const fechaHoraRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!fechaHoraRegex.test(fecha_hora)) {
    return res.status(400).json({ message: 'Formato de fecha_hora inválido. Debe ser YYYY-MM-DD HH:mm:ss' });
  }

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

    // Si es turno fijo, crear varios turnos
    if (turno_fijo && dia_semana) {
      const turnos = [];
      let fecha = new Date(fecha_hora.replace(' ', 'T'));
      for (let i = 0; i < 12; i++) { // 12 semanas
        turnos.push([
          cliente_id,
          servicio_id,
          fecha.toISOString().slice(0, 19).replace('T', ' '),
          estado || 'Pendiente',
          1, // turno_fijo true
          dia_semana
        ]);
        fecha.setDate(fecha.getDate() + 7);
      }
      await db.query(
        'INSERT INTO turnos (cliente_id, servicio_id, fecha_hora, estado, turno_fijo, dia_semana) VALUES ?',
        [turnos]
      );
      return res.status(201).json({ message: 'Turnos fijos agendados con éxito!' });
    } else {
      // Turno normal
      const result = await db.query(
        'INSERT INTO turnos (cliente_id, servicio_id, fecha_hora, estado, turno_fijo, dia_semana) VALUES (?, ?, ?, ?, ?, ?)',
        [cliente_id, servicio_id, fecha_hora, estado || 'Pendiente', 0, null]
      );
      res.status(201).json({
        message: 'Turno agendado con éxito!',
        id: result.insertId,
        cliente_id,
        servicio_id,
        fecha_hora,
        estado: estado || 'Pendiente',
        turno_fijo: false,
        dia_semana: null
      });
    }
  } catch (error) {
    next(error);
  }
}

// Actualizar un turno
async function updateTurno(req, res, next) {
  const { id } = req.params;
  const { cliente_id, servicio_id, fecha_hora, estado, turno_fijo, dia_semana } = req.body;

  if (!cliente_id && !servicio_id && !fecha_hora && !estado && turno_fijo === undefined && dia_semana === undefined) {
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
    const final_turno_fijo = turno_fijo !== undefined ? turno_fijo : currentTurno.turno_fijo;
    const final_dia_semana = dia_semana !== undefined ? dia_semana : currentTurno.dia_semana;

    const result = await db.query(
      'UPDATE turnos SET cliente_id = ?, servicio_id = ?, fecha_hora = ?, estado = ?, turno_fijo = ?, dia_semana = ? WHERE id = ?',
      [final_cliente_id, final_servicio_id, final_fecha_hora, final_estado, final_turno_fijo, final_dia_semana, id]
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
      estado: final_estado,
      turno_fijo: final_turno_fijo,
      dia_semana: final_dia_semana
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar turno
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