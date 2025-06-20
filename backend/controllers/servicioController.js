const db = require('../db');

// Obtener todos los servicios
async function getAllServicios(req, res, next) {
  try {
    const rows = await db.query('SELECT id, nombre_servicio, precio FROM servicios');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Obtener un servicio por ID
async function getServicioById(req, res, next) {
  const { id } = req.params;
  try {
    const rows = await db.query('SELECT id, nombre_servicio, precio FROM servicios WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Crear un nuevo servicio
async function createServicio(req, res, next) {
  const { nombre_servicio, precio } = req.body;
  if (!nombre_servicio || precio === undefined) {
    return res.status(400).json({ message: 'Nombre del servicio y precio son requeridos.' });
  }
  if (isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
    return res.status(400).json({ message: 'El precio debe ser un número positivo.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO servicios (nombre_servicio, precio) VALUES (?, ?)',
      [nombre_servicio, precio]
    );
    res.status(201).json({ message: 'Servicio creado con éxito!', id: result.insertId, nombre_servicio, precio });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El nombre del servicio ya existe.' });
    }
    next(error);
  }
}

// Actualizar un servicio
async function updateServicio(req, res, next) {
  const { id } = req.params;
  const { nombre_servicio, precio } = req.body;

  if (!nombre_servicio || precio === undefined) {
    return res.status(400).json({ message: 'Nombre del servicio y precio son requeridos.' });
  }
  if (isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
    return res.status(400).json({ message: 'El precio debe ser un número positivo.' });
  }

  try {
    const result = await db.query(
      'UPDATE servicios SET nombre_servicio = ?, precio = ? WHERE id = ?',
      [nombre_servicio, precio, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado para actualizar' });
    }
    res.json({ message: 'Servicio actualizado con éxito!', id, nombre_servicio, precio });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El nombre del servicio ya existe para otro servicio.' });
    }
    next(error);
  }
}

// Eliminar un servicio
async function deleteServicio(req, res, next) {
  const { id } = req.params;
  try {
    // Verificar si hay turnos asociados a este servicio
    const turnosAsociados = await db.query('SELECT COUNT(*) as count FROM turnos WHERE servicio_id = ?', [id]);
    if (turnosAsociados[0].count > 0) {
      return res.status(400).json({ message: 'No se puede eliminar el servicio porque tiene turnos asociados. Por favor, cancele o reasigne los turnos primero.' });
    }

    const result = await db.query('DELETE FROM servicios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado para eliminar' });
    }
    res.json({ message: 'Servicio eliminado con éxito' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio,
};
