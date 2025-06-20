const db = require('../db');

// Obtener todos los clientes
async function getAllClientes(req, res, next) {
  try {
    const rows = await db.query('SELECT id, nombre, apellido, telefono, DATE_FORMAT(fecha_cumpleanos, "%Y-%m-%d") as fecha_cumpleanos FROM clientes');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Obtener un cliente por ID
async function getClienteById(req, res, next) {
  const { id } = req.params;
  try {
    const rows = await db.query('SELECT id, nombre, apellido, telefono, DATE_FORMAT(fecha_cumpleanos, "%Y-%m-%d") as fecha_cumpleanos FROM clientes WHERE id = ?', [id]);
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
  const { nombre, apellido, telefono, fecha_cumpleanos } = req.body;
  if (!nombre || !apellido || !telefono) {
    return res.status(400).json({ message: 'Nombre, apellido y teléfono son requeridos.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO clientes (nombre, apellido, telefono, fecha_cumpleanos) VALUES (?, ?, ?, ?)',
      [nombre, apellido, telefono, fecha_cumpleanos || null]
    );
    res.status(201).json({ message: 'Cliente creado con éxito!', id: result.insertId, nombre, apellido, telefono, fecha_cumpleanos });
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
  const { nombre, apellido, telefono, fecha_cumpleanos } = req.body;

  if (!nombre || !apellido || !telefono) {
    return res.status(400).json({ message: 'Nombre, apellido y teléfono son requeridos.' });
  }

  try {
    const result = await db.query(
      'UPDATE clientes SET nombre = ?, apellido = ?, telefono = ?, fecha_cumpleanos = ? WHERE id = ?',
      [nombre, apellido, telefono, fecha_cumpleanos || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado para actualizar' });
    }
    res.json({ message: 'Cliente actualizado con éxito!', id, nombre, apellido, telefono, fecha_cumpleanos });
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
    // Considerar errores de FK si hay turnos asociados que no permiten el borrado en cascada (aunque lo definimos)
    next(error);
  }
}

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getProximosCumpleanos, // Nueva función exportada
};

// Obtener clientes con cumpleaños próximos (ej. en los próximos 7 días)
async function getProximosCumpleanos(req, res, next) {
  const diasAdelanto = req.query.dias || 7; // Por defecto 7 días, configurable por query param
  try {
    const query = `
      SELECT id, nombre, apellido, telefono, DATE_FORMAT(fecha_cumpleanos, "%Y-%m-%d") as fecha_cumpleanos
      FROM clientes
      WHERE fecha_cumpleanos IS NOT NULL
        AND (
          (MONTH(fecha_cumpleanos) = MONTH(CURDATE()) AND DAY(fecha_cumpleanos) >= DAY(CURDATE()) AND DAY(fecha_cumpleanos) <= DAY(CURDATE() + INTERVAL ? DAY))
          OR
          (MONTH(fecha_cumpleanos) = MONTH(CURDATE() + INTERVAL ? DAY) AND DAY(fecha_cumpleanos) <= DAY(CURDATE() + INTERVAL ? DAY))
          OR
          (MONTH(CURDATE()) < MONTH(CURDATE() + INTERVAL ? DAY) AND MONTH(fecha_cumpleanos) > MONTH(CURDATE()) AND MONTH(fecha_cumpleanos) < MONTH(CURDATE() + INTERVAL ? DAY) )
        )
      ORDER BY MONTH(fecha_cumpleanos), DAY(fecha_cumpleanos)
    `;
    // Esta query es compleja para manejar cruces de año y mes correctamente.
    // Una forma más simple y robusta si la base de datos lo soporta o usando lógica en la aplicación:
    // 1. Obtener todos los clientes con fecha_cumpleanos.
    // 2. En la aplicación, calcular para cada uno si su próximo cumpleaños cae en el rango deseado.
    // Por simplicidad y para mantenerlo en SQL, la query anterior es un intento.
    // MySQL puede tener dificultades con DAY(CURDATE() + INTERVAL X DAY) si cruza el mes.
    // Vamos a simplificar la lógica extrayendo el día y mes y comparando:

    const query_simplificada = `
      SELECT id, nombre, apellido, telefono, DATE_FORMAT(fecha_cumpleanos, "%m-%d") as cumple_mes_dia, fecha_cumpleanos
      FROM clientes
      WHERE fecha_cumpleanos IS NOT NULL
      ORDER BY cumple_mes_dia;
    `;
    const todosLosClientesConCumple = await db.query(query_simplificada);

    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + parseInt(diasAdelanto));

    const clientesFiltrados = todosLosClientesConCumple.filter(cliente => {
      if (!cliente.fecha_cumpleanos) return false;
      const cumple = new Date(cliente.fecha_cumpleanos);
      // Ajustar el año del cumpleaños al año actual o siguiente para la comparación
      let proximoCumple = new Date(hoy.getFullYear(), cumple.getMonth(), cumple.getDate());

      if (proximoCumple < hoy) { // Si el cumpleaños de este año ya pasó
        proximoCumple.setFullYear(hoy.getFullYear() + 1); // Considerar el del próximo año
      }
      // El cumpleaños debe estar entre hoy (inclusive) y la fecha límite (inclusive)
      return proximoCumple >= hoy && proximoCumple <= fechaLimite;
    }).map(c => ({ // Devolver el formato original de fecha_cumpleanos
        id: c.id,
        nombre: c.nombre,
        apellido: c.apellido,
        telefono: c.telefono,
        fecha_cumpleanos: new Date(c.fecha_cumpleanos).toISOString().split('T')[0] // Formato YYYY-MM-DD
    }));

    res.json(clientesFiltrados);
  } catch (error) {
    next(error);
  }
}
