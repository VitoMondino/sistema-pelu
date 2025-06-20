const db = require('../db');

// Obtener todos los productos del stock
async function getAllStock(req, res, next) {
  try {
    const rows = await db.query('SELECT id, nombre_producto, cantidad, precio_unitario, precio_venta FROM stock');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Obtener un producto del stock por ID
async function getStockById(req, res, next) {
  const { id } = req.params;
  try {
    const rows = await db.query('SELECT id, nombre_producto, cantidad, precio_unitario, precio_venta FROM stock WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en stock' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// Crear un nuevo producto en el stock
async function createStock(req, res, next) {
  const { nombre_producto, cantidad, precio_unitario, precio_venta } = req.body;

  if (!nombre_producto || cantidad === undefined || precio_unitario === undefined || precio_venta === undefined) {
    return res.status(400).json({ message: 'Nombre del producto, cantidad, precio unitario y precio de venta son requeridos.' });
  }
  if (isNaN(parseInt(cantidad)) || parseInt(cantidad) < 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un número entero no negativo.' });
  }
  if (isNaN(parseFloat(precio_unitario)) || parseFloat(precio_unitario) < 0) {
    return res.status(400).json({ message: 'El precio unitario debe ser un número positivo.' });
  }
  if (isNaN(parseFloat(precio_venta)) || parseFloat(precio_venta) < 0) {
    return res.status(400).json({ message: 'El precio de venta debe ser un número positivo.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO stock (nombre_producto, cantidad, precio_unitario, precio_venta) VALUES (?, ?, ?, ?)',
      [nombre_producto, cantidad, precio_unitario, precio_venta]
    );
    res.status(201).json({ message: 'Producto agregado al stock con éxito!', id: result.insertId, nombre_producto, cantidad, precio_unitario, precio_venta });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El nombre del producto ya existe en el stock.' });
    }
    next(error);
  }
}

// Actualizar un producto del stock
async function updateStock(req, res, next) {
  const { id } = req.params;
  const { nombre_producto, cantidad, precio_unitario, precio_venta } = req.body;

  // Validar que al menos un campo esté presente
  if (nombre_producto === undefined && cantidad === undefined && precio_unitario === undefined && precio_venta === undefined) {
    return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar (nombre_producto, cantidad, precio_unitario, precio_venta).' });
  }

  // Validaciones si los campos están presentes
  if (cantidad !== undefined && (isNaN(parseInt(cantidad)) || parseInt(cantidad) < 0)) {
    return res.status(400).json({ message: 'La cantidad debe ser un número entero no negativo.' });
  }
  if (precio_unitario !== undefined && (isNaN(parseFloat(precio_unitario)) || parseFloat(precio_unitario) < 0)) {
    return res.status(400).json({ message: 'El precio unitario debe ser un número positivo.' });
  }
  if (precio_venta !== undefined && (isNaN(parseFloat(precio_venta)) || parseFloat(precio_venta) < 0)) {
    return res.status(400).json({ message: 'El precio de venta debe ser un número positivo.' });
  }


  try {
    // Obtener el producto actual para actualizar solo los campos proporcionados
    const currentStockRows = await db.query('SELECT * FROM stock WHERE id = ?', [id]);
    if (currentStockRows.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado en stock para actualizar' });
    }
    const currentStock = currentStockRows[0];

    const final_nombre_producto = nombre_producto !== undefined ? nombre_producto : currentStock.nombre_producto;
    const final_cantidad = cantidad !== undefined ? parseInt(cantidad) : currentStock.cantidad;
    const final_precio_unitario = precio_unitario !== undefined ? parseFloat(precio_unitario) : currentStock.precio_unitario;
    const final_precio_venta = precio_venta !== undefined ? parseFloat(precio_venta) : currentStock.precio_venta;


    const result = await db.query(
      'UPDATE stock SET nombre_producto = ?, cantidad = ?, precio_unitario = ?, precio_venta = ? WHERE id = ?',
      [final_nombre_producto, final_cantidad, final_precio_unitario, final_precio_venta, id]
    );

    if (result.affectedRows === 0 && (
        currentStock.nombre_producto !== final_nombre_producto ||
        currentStock.cantidad !== final_cantidad ||
        currentStock.precio_unitario !== final_precio_unitario ||
        currentStock.precio_venta !== final_precio_venta
    )) {
         // Esto podría pasar si el ID es válido pero por alguna razón la DB no actualiza (muy raro si el ID existe)
        return res.status(404).json({ message: 'Producto no encontrado en stock para actualizar, o ningún dato cambió.' });
    }
     if (result.affectedRows === 0 &&
        currentStock.nombre_producto === final_nombre_producto &&
        currentStock.cantidad === final_cantidad &&
        currentStock.precio_unitario.toFixed(2) === final_precio_unitario.toFixed(2) && // Comparar con precisión
        currentStock.precio_venta.toFixed(2) === final_precio_venta.toFixed(2)
    ) {
        // Si no se afectaron filas pero los datos son iguales, es un éxito "sin cambios"
         return res.json({ message: 'Producto en stock sin cambios necesarios.', id, nombre_producto: final_nombre_producto, cantidad: final_cantidad, precio_unitario: final_precio_unitario, precio_venta: final_precio_venta });
    }


    res.json({ message: 'Producto en stock actualizado con éxito!', id, nombre_producto: final_nombre_producto, cantidad: final_cantidad, precio_unitario: final_precio_unitario, precio_venta: final_precio_venta });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El nombre del producto ya existe para otro item en el stock.' });
    }
    next(error);
  }
}

// Eliminar un producto del stock
async function deleteStock(req, res, next) {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM stock WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en stock para eliminar' });
    }
    res.json({ message: 'Producto eliminado del stock con éxito' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllStock,
  getStockById,
  createStock,
  updateStock,
  deleteStock,
};
