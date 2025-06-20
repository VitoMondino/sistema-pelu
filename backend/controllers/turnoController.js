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
        // Aseguramos que la fecha_hora se devuelva en un formato estándar ISO para facilitar el manejo en el frontend
        fecha_hora: new Date(row.fecha_hora).toISOString()
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
        fecha_hora: new Date(rows[0].fecha_hora).toISOString()
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

  // Validar formato de fecha_hora (debería ser ISO 8601 o similar que MySQL entienda)
  const fechaTurno = new Date(fecha_hora);
  if (isNaN(fechaTurno.getTime())) {
      return res.status(400).json({ message: 'Formato de fecha_hora inválido.' });
  }

  // Validar que el estado sea uno de los permitidos
  const estadosPermitidos = ['Pendiente', 'Realizado', 'Cancelado'];
  if (estado && !estadosPermitidos.includes(estado)) {
      return res.status(400).json({ message: `Estado inválido. Permitidos: ${estadosPermitidos.join(', ')}` });
  }

  try {
    // Verificar que el cliente y el servicio existan
    const cliente = await db.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
    if (cliente.length === 0) return res.status(404).json({ message: 'Cliente no encontrado.' });

    const servicio = await db.query('SELECT id FROM servicios WHERE id = ?', [servicio_id]);
    if (servicio.length === 0) return res.status(404).json({ message: 'Servicio no encontrado.' });

    // Verificar si ya existe un turno para el mismo cliente y servicio en la misma fecha y hora (opcional, depende de la lógica de negocio)
    // const existingTurno = await db.query(
    //   'SELECT id FROM turnos WHERE cliente_id = ? AND servicio_id = ? AND fecha_hora = ? AND estado != "Cancelado"',
    //   [cliente_id, servicio_id, fechaTurno.toISOString().slice(0, 19).replace('T', ' ')]
    // );
    // if (existingTurno.length > 0) {
    //   return res.status(409).json({ message: 'Ya existe un turno para este cliente y servicio en la fecha y hora especificadas.' });
    // }


    const result = await db.query(
      'INSERT INTO turnos (cliente_id, servicio_id, fecha_hora, estado) VALUES (?, ?, ?, ?)',
      // MySQL espera 'YYYY-MM-DD HH:MM:SS'
      [cliente_id, servicio_id, fechaTurno.toISOString().slice(0, 19).replace('T', ' '), estado || 'Pendiente']
    );
    res.status(201).json({
        message: 'Turno agendado con éxito!',
        id: result.insertId,
        cliente_id,
        servicio_id,
        fecha_hora: fechaTurno.toISOString(), // Devolver ISO para consistencia
        estado: estado || 'Pendiente'
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar un turno (ej. cambiar estado, fecha/hora)
async function updateTurno(req, res, next) {
  const { id } = req.params;
  const { cliente_id, servicio_id, fecha_hora, estado } = req.body;

  // Validaciones básicas
  if (!cliente_id && !servicio_id && !fecha_hora && !estado) {
    return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar.' });
  }

  let fechaTurnoISO;
  if (fecha_hora) {
    const parsedDate = new Date(fecha_hora);
    if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Formato de fecha_hora inválido.' });
    }
    fechaTurnoISO = parsedDate.toISOString().slice(0, 19).replace('T', ' ');
  }

  const estadosPermitidos = ['Pendiente', 'Realizado', 'Cancelado'];
  if (estado && !estadosPermitidos.includes(estado)) {
      return res.status(400).json({ message: `Estado inválido. Permitidos: ${estadosPermitidos.join(', ')}` });
  }

  try {
    // Obtener el turno actual para no sobreescribir campos no enviados
    const currentTurnoRows = await db.query('SELECT * FROM turnos WHERE id = ?', [id]);
    if (currentTurnoRows.length === 0) {
      return res.status(404).json({ message: 'Turno no encontrado para actualizar' });
    }
    const currentTurno = currentTurnoRows[0];

    // Verificar que el cliente y el servicio existan si se actualizan
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
    const final_fecha_hora = fechaTurnoISO || currentTurno.fecha_hora;
    const final_estado = estado || currentTurno.estado;


    const result = await db.query(
      'UPDATE turnos SET cliente_id = ?, servicio_id = ?, fecha_hora = ?, estado = ? WHERE id = ?',
      [final_cliente_id, final_servicio_id, final_fecha_hora, final_estado, id]
    );

    if (result.affectedRows === 0) {
      // Esto no debería pasar si la verificación anterior tuvo éxito, pero por si acaso.
      return res.status(404).json({ message: 'Turno no encontrado para actualizar o ningún dato cambió' });
    }
    res.json({
        message: 'Turno actualizado con éxito!',
        id,
        cliente_id: final_cliente_id,
        servicio_id: final_servicio_id,
        fecha_hora: new Date(final_fecha_hora).toISOString(),
        estado: final_estado
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar un turno (generalmente se marca como cancelado en lugar de borrar)
// Si se desea borrar físicamente:
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
  deleteTurno, // O podría ser cancelTurno si la lógica de negocio prefiere no borrar
};
