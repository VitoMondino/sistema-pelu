const db = require('../db');

// Obtener todos los productos del stock
async function getAllStock(req, res, next) {
  try {
    const rows = await db.query(
      'SELECT id, nombre_producto, cantidad, precio_unitario, precio_venta, stock_minimo FROM stock'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// Obtener un producto del stock por ID
async function getStockById(req, res, next) {
  const { id } = req.params;
  try {
    const rows = await db.query(
      'SELECT id, nombre_producto, cantidad, precio_unitario, precio_venta, stock_minimo FROM stock WHERE id = ?',
      [id]
    );
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
  const { nombre_producto, cantidad, precio_unitario, precio_venta, stock_minimo } = req.body;

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
  if (stock_minimo !== undefined && (isNaN(parseInt(stock_minimo)) || parseInt(stock_minimo) < 0)) {
    return res.status(400).json({ message: 'El stock mínimo debe ser un número entero no negativo.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO stock (nombre_producto, cantidad, precio_unitario, precio_venta, stock_minimo) VALUES (?, ?, ?, ?, ?)',
      [nombre_producto, cantidad, precio_unitario, precio_venta, stock_minimo || 0]
    );

    res.status(201).json({
      message: 'Producto agregado al stock con éxito!',
      id: result.insertId,
      nombre_producto,
      cantidad,
      precio_unitario,
      precio_venta,
      stock_minimo: stock_minimo || 0,
    });
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
  const { nombre_producto, cantidad, precio_unitario, precio_venta, stock_minimo, ajuste_cantidad } = req.body;

  if (
    nombre_producto === undefined &&
    cantidad === undefined &&
    precio_unitario === undefined &&
    precio_venta === undefined &&
    stock_minimo === undefined &&
    ajuste_cantidad === undefined
  ) {
    return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar.' });
  }

  if (cantidad !== undefined && (isNaN(parseInt(cantidad)) || parseInt(cantidad) < 0) && ajuste_cantidad === undefined) {
    return res.status(400).json({ message: 'La cantidad debe ser un número entero no negativo.' });
  }
  if (ajuste_cantidad !== undefined && isNaN(parseInt(ajuste_cantidad))) {
    return res.status(400).json({ message: 'El ajuste de cantidad debe ser un número entero.' });
  }
  if (precio_unitario !== undefined && (isNaN(parseFloat(precio_unitario)) || parseFloat(precio_unitario) < 0)) {
    return res.status(400).json({ message: 'El precio unitario debe ser un número positivo.' });
  }
  if (precio_venta !== undefined && (isNaN(parseFloat(precio_venta)) || parseFloat(precio_venta) < 0)) {
    return res.status(400).json({ message: 'El precio de venta debe ser un número positivo.' });
  }
  if (stock_minimo !== undefined && (isNaN(parseInt(stock_minimo)) || parseInt(stock_minimo) < 0)) {
    return res.status(400).json({ message: 'El stock mínimo debe ser un número entero no negativo.' });
  }

  try {
    const currentStockRows = await db.query('SELECT * FROM stock WHERE id = ?', [id]);
    if (currentStockRows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en stock para actualizar' });
    }

    const currentStock = currentStockRows[0];

    let final_cantidad = currentStock.cantidad;
    if (ajuste_cantidad !== undefined) {
      final_cantidad = currentStock.cantidad + parseInt(ajuste_cantidad);
      if (final_cantidad < 0) {
        return res.status(400).json({ message: 'El ajuste resultaría en cantidad negativa.' });
      }
    } else if (cantidad !== undefined) {
      final_cantidad = parseInt(cantidad);
    }

    const final_nombre_producto = nombre_producto !== undefined ? nombre_producto : currentStock.nombre_producto;
    const final_precio_unitario = precio_unitario !== undefined ? parseFloat(precio_unitario) : currentStock.precio_unitario;
    const final_precio_venta = precio_venta !== undefined ? parseFloat(precio_venta) : currentStock.precio_venta;
    const final_stock_minimo = stock_minimo !== undefined ? parseInt(stock_minimo) : currentStock.stock_minimo;

    const result = await db.query(
      'UPDATE stock SET nombre_producto = ?, cantidad = ?, precio_unitario = ?, precio_venta = ?, stock_minimo = ? WHERE id = ?',
      [final_nombre_producto, final_cantidad, final_precio_unitario, final_precio_venta, final_stock_minimo, id]
    );

    if (ajuste_cantidad !== undefined && parseInt(ajuste_cantidad) !== 0) {
      const tipo_mov = parseInt(ajuste_cantidad) > 0 ? 'ajuste_positivo' : 'ajuste_negativo';
      await db.query(
        'INSERT INTO movimientos_stock (producto_id, tipo_movimiento, cantidad_movida, motivo) VALUES (?, ?, ?, ?)',
        [id, tipo_mov, parseInt(ajuste_cantidad), 'Ajuste rápido desde lista']
      );
    }

    if (result.affectedRows > 0) {
      return res.json({
        message: 'Producto en stock actualizado con éxito!',
        id,
        nombre_producto: final_nombre_producto,
        cantidad: final_cantidad,
        precio_unitario: final_precio_unitario,
        precio_venta: final_precio_venta,
        stock_minimo: final_stock_minimo,
      });
    } else {
      return res.status(500).json({ message: 'No se pudo actualizar el producto o no hubo cambios.' });
    }
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

// Crear un nuevo movimiento de stock
async function createMovimientoStock(req, res, next) {
  const { producto_id, tipo_movimiento, cantidad_movida, motivo, precio_unitario_movimiento, turno_id } = req.body;

  if (!producto_id || !tipo_movimiento || cantidad_movida === undefined) {
    return res.status(400).json({ message: 'ID de producto, tipo de movimiento y cantidad movida son requeridos.' });
  }

  const cantidadNum = parseInt(cantidad_movida);
  if (isNaN(cantidadNum)) {
    return res.status(400).json({ message: 'La cantidad movida debe ser un número.' });
  }

  const tiposValidos = [
    'entrada_manual',
    'salida_manual',
    'ajuste_positivo',
    'ajuste_negativo',
    'venta',
    'venta_anulada',
    'uso_interno',
    'compra_proveedor',
    'devolucion_proveedor',
  ];
  if (!tiposValidos.includes(tipo_movimiento)) {
    return res.status(400).json({ message: `Tipo de movimiento inválido. Válidos: ${tiposValidos.join(', ')}` });
  }

  try {
    const productoRows = await db.query('SELECT cantidad FROM stock WHERE id = ?', [producto_id]);
    if (productoRows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    const cantidadActual = productoRows[0].cantidad;
    let nuevaCantidad = cantidadActual;
    let cantidadRealMovidaEnTabla = cantidadNum;

    if (['entrada_manual', 'ajuste_positivo', 'compra_proveedor', 'venta_anulada'].includes(tipo_movimiento)) {
      if (cantidadNum <= 0) return res.status(400).json({ message: 'La cantidad debe ser positiva para este tipo de movimiento.' });
      nuevaCantidad += cantidadNum;
    } else if (['salida_manual', 'ajuste_negativo', 'venta', 'uso_interno', 'devolucion_proveedor'].includes(tipo_movimiento)) {
      if (cantidadNum <= 0) return res.status(400).json({ message: 'La cantidad debe ser positiva para este tipo de movimiento.' });
      if (cantidadActual < cantidadNum) return res.status(400).json({ message: 'No hay suficiente stock para este movimiento.' });

      nuevaCantidad -= cantidadNum;
      cantidadRealMovidaEnTabla = -cantidadNum;
    }

    await db.query('UPDATE stock SET cantidad = ? WHERE id = ?', [nuevaCantidad, producto_id]);
    const movimientoResult = await db.query(
      'INSERT INTO movimientos_stock (producto_id, tipo_movimiento, cantidad_movida, motivo, precio_unitario_movimiento, turno_id) VALUES (?, ?, ?, ?, ?, ?)',
      [producto_id, tipo_movimiento, cantidadRealMovidaEnTabla, motivo || null, precio_unitario_movimiento || null, turno_id || null]
    );

    res.status(201).json({ message: 'Movimiento de stock registrado!', movimientoId: movimientoResult.insertId, producto_id, nuevaCantidad });
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
  createMovimientoStock,
};
