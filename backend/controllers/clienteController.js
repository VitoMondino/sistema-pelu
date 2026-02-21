const db = require('../db');

// Función auxiliar para formatear fechas sin problemas de zona horaria
function formatearFechaSoloFecha(fecha) {
  if (!fecha) return null;
  
  // Si ya es una cadena en formato YYYY-MM-DD, devolverla tal cual
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha;
  }
  
  // Si es un objeto Date o timestamp
  if (fecha instanceof Date) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Obtener todos los clientes
async function getAllClientes(req, res, next) {
  try {
    const q = (req.query.q || '').trim();

    let rows;
    if (q) {
      const like = `%${q}%`;
      rows = await db.query(`
        SELECT id, nombre, apellido, telefono, fecha_cumpleanos, notas
        FROM clientes
        WHERE nombre LIKE ? OR apellido LIKE ?
        ORDER BY nombre, apellido
        LIMIT 50
      `, [like, like]);
    } else {
      rows = await db.query(`
        SELECT 
          id, 
          nombre, 
          apellido, 
          telefono, 
          fecha_cumpleanos, 
          notas 
        FROM clientes
        ORDER BY nombre, apellido
      `);
    }

    // Formatear las fechas manualmente para evitar problemas de zona horaria
    const clientesFormateados = rows.map(cliente => ({
      ...cliente,
      fecha_cumpleanos: formatearFechaSoloFecha(cliente.fecha_cumpleanos)
    }));

    res.json({
      success: true,
      data: {
        clientes: clientesFormateados
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
      SELECT id, nombre, apellido, telefono, fecha_cumpleanos, notas 
      FROM clientes 
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const cliente = {
      ...rows[0],
      fecha_cumpleanos: formatearFechaSoloFecha(rows[0].fecha_cumpleanos)
    };

    res.json(cliente);
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

// Obtener clientes con cumpleaños próximos (corrigiendo desfase de zona horaria)
async function getProximosCumpleanos(req, res, next) {
  const diasAdelanto = parseInt(req.query.dias) || 7;
  
  try {
    const query = `
      SELECT 
        id, nombre, apellido, telefono, 
        fecha_cumpleanos
      FROM clientes 
      WHERE fecha_cumpleanos IS NOT NULL
      ORDER BY nombre, apellido
    `;

    const todosLosClientes = await db.query(query);

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);  // Normalizamos hoy a UTC midnight

    // Fecha límite también en UTC
    const fechaLimite = new Date(hoy);
    fechaLimite.setUTCDate(hoy.getUTCDate() + diasAdelanto);

    const clientesFiltrados = todosLosClientes.map(cliente => ({
      ...cliente,
      fecha_cumpleanos: formatearFechaSoloFecha(cliente.fecha_cumpleanos)
    })).filter(cliente => {
      if (!cliente.fecha_cumpleanos) return false;

      const [year, month, day] = cliente.fecha_cumpleanos.split('-').map(Number);

      // Construimos la fecha del próximo cumpleaños en UTC para este año
      let proximoCumple = new Date(Date.UTC(hoy.getUTCFullYear(), month - 1, day));

      // Si ya pasó, incrementamos el año
      if (proximoCumple < hoy) {
        proximoCumple = new Date(Date.UTC(hoy.getUTCFullYear() + 1, month - 1, day));
      }

      // Comparar en UTC
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