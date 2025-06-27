const db = require('../db');

// Obtener todos los clientes
async function getAllClientes(req, res, next) {
  try {
    const rows = await db.query(`
      SELECT 
        id, 
        nombre, 
        apellido, 
        telefono, 
        DATE_FORMAT(fecha_cumpleanos, "%Y-%m-%d") as fecha_cumpleanos, 
        notas 
      FROM clientes
    `);

    // ⬇⬇⬇ Aquí está el cambio importante
    res.json({
      success: true,
      data: {
        clientes: rows
      }
    });
  } catch (error) {
    next(error);
  }
}

// Obtener un cliente por ID
async function getClienteById(req, res, next) {
  const { id } = req.params;
  try {
    const rows = await db.query(`
      SELECT id, nombre, apellido, telefono, DATE_FORMAT(fecha_cumpleanos, "%Y-%m-%d") as fecha_cumpleanos, notas 
      FROM clientes 
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Crear un nuevo cliente
async function createCliente(req, res, next) {
  const { nombre, apellido, telefono, fecha_cumpleanos, notas } = req.body;

  if (!nombre || !apellido || !telefono) {
    return res.status(400).json({ message: 'Nombre, apellido y teléfono son requeridos.' });
  }

  try {
    let fechaFormateada = null;
    if (fecha_cumpleanos?.trim()) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha_cumpleanos)) {
        return res.status(400).json({ message: 'La fecha debe tener formato YYYY-MM-DD' });
      }
      fechaFormateada = fecha_cumpleanos;
    }

    const result = await db.query(
      'INSERT INTO clientes (nombre, apellido, telefono, fecha_cumpleanos, notas) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, telefono, fechaFormateada, notas || null]
    );

    const clienteCreado = {
      id: result.insertId,
      nombre,
      apellido,
      telefono,
      fecha_cumpleanos: fechaFormateada,
      notas: notas || null
    };

    res.status(201).json({ message: 'Cliente creado con éxito!', ...clienteCreado });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El número de teléfono ya está registrado.' });
    }
    next(error);
  }
}

// Actualizar un cliente
async function updateCliente(req, res, next) {
  const { id } = req.params;
  const { nombre, apellido, telefono, fecha_cumpleanos, notas } = req.body;

  if (!nombre || !apellido || !telefono) {
    return res.status(400).json({ message: 'Nombre, apellido y teléfono son requeridos.' });
  }

  try {
    let fechaFormateada = null;
    if (fecha_cumpleanos?.trim()) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha_cumpleanos)) {
        return res.status(400).json({ message: 'La fecha debe tener formato YYYY-MM-DD' });
      }
      fechaFormateada = fecha_cumpleanos;
    }

    const result = await db.query(
      'UPDATE clientes SET nombre = ?, apellido = ?, telefono = ?, fecha_cumpleanos = ?, notas = ? WHERE id = ?',
      [nombre, apellido, telefono, fechaFormateada, notas || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado para actualizar' });
    }

    const clienteActualizado = {
      id: parseInt(id),
      nombre,
      apellido,
      telefono,
      fecha_cumpleanos: fechaFormateada,
      notas: notas || null
    };

    res.json({ message: 'Cliente actualizado con éxito!', ...clienteActualizado });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El número de teléfono ya está registrado para otro cliente.' });
    }
    next(error);
  }
}

// Eliminar un cliente
async function deleteCliente(req, res, next) {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM clientes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado para eliminar' });
    }
    res.json({ message: 'Cliente eliminado con éxito' });
  } catch (error) {
    next(error);
  }
}

// Obtener historial de servicios de un cliente por ID de cliente
async function getHistorialServiciosByClienteId(req, res, next) {
  const { id } = req.params;
  try {
    const cliente = await db.query('SELECT id FROM clientes WHERE id = ?', [id]);
    if (cliente.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const query = `
      SELECT
        t.id as turno_id,
        DATE_FORMAT(t.fecha_hora, '%Y-%m-%d %H:%i:%s') as fecha_hora,
        t.estado as estado_turno,
        s.id as servicio_id,
        s.nombre_servicio,
        s.precio as precio_servicio
      FROM turnos t
      JOIN servicios s ON t.servicio_id = s.id
      WHERE t.cliente_id = ?
      ORDER BY t.fecha_hora DESC
    `;
    const historial = await db.query(query, [id]);

    res.json(historial);
  } catch (error) {
    next(error);
  }
}

// Obtener clientes con cumpleaños próximos
async function getProximosCumpleanos(req, res, next) {
  const diasAdelanto = parseInt(req.query.dias) || 7;
  
  try {
    const query = `
      SELECT 
        id, nombre, apellido, telefono, 
        DATE_FORMAT(fecha_cumpleanos, "%Y-%m-%d") as fecha_cumpleanos
      FROM clientes 
      WHERE fecha_cumpleanos IS NOT NULL
      ORDER BY nombre, apellido
    `;

    const todosLosClientes = await db.query(query);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(hoy.getDate() + diasAdelanto);

    const clientesFiltrados = todosLosClientes.filter(cliente => {
      if (!cliente.fecha_cumpleanos) return false;

      const [year, month, day] = cliente.fecha_cumpleanos.split('-').map(Number);
      let proximoCumple = new Date(hoy.getFullYear(), month - 1, day);
      proximoCumple.setHours(0, 0, 0, 0);

      if (proximoCumple < hoy) {
        proximoCumple.setFullYear(hoy.getFullYear() + 1);
      }

      return proximoCumple >= hoy && proximoCumple <= fechaLimite;
    });

    res.json(clientesFiltrados);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getProximosCumpleanos,
  getHistorialServiciosByClienteId,
};
