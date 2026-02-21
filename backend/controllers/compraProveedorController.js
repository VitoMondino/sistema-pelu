const db = require('../db');

const compraProveedorController = {
  // Obtener compras de un proveedor
  getByProveedor: async (req, res) => {
    const proveedorId = req.params.id;
    try {
      const rows = await db.query(
        'SELECT id, proveedor_id, DATE_FORMAT(fecha, "%Y-%m-%d") as fecha, descripcion, monto FROM compras_proveedores WHERE proveedor_id = ? ORDER BY fecha DESC',
        [proveedorId]
      );
      res.json({ data: rows });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener compras', error: error.message });
    }
  },

  // Crear compra para un proveedor
  createForProveedor: async (req, res) => {
    const proveedorId = req.params.id;
    const { fecha, descripcion, monto } = req.body;

    if (!fecha || !monto) {
      return res.status(400).json({ message: 'Fecha y monto son requeridos' });
    }

    try {
      const result = await db.query(
        'INSERT INTO compras_proveedores (proveedor_id, fecha, descripcion, monto) VALUES (?, ?, ?, ?)',
        [proveedorId, fecha, descripcion || null, monto]
      );
      res.status(201).json({ message: 'Compra registrada', data: { id: result.insertId } });
    } catch (error) {
      res.status(500).json({ message: 'Error al crear compra', error: error.message });
    }
  },

  // Actualizar compra por id
  update: async (req, res) => {
    const compraId = req.params.id;
    const { fecha, descripcion, monto } = req.body;
    if (!fecha || !monto) {
      return res.status(400).json({ message: 'Fecha y monto son requeridos' });
    }
    try {
      const result = await db.query(
        'UPDATE compras_proveedores SET fecha = ?, descripcion = ?, monto = ? WHERE id = ?',
        [fecha, descripcion || null, monto, compraId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Compra no encontrada' });
      res.json({ message: 'Compra actualizada' });
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar compra', error: error.message });
    }
  },

  // Eliminar compra
  delete: async (req, res) => {
    const compraId = req.params.id;
    try {
      const result = await db.query('DELETE FROM compras_proveedores WHERE id = ?', [compraId]);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Compra no encontrada' });
      res.json({ message: 'Compra eliminada' });
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar compra', error: error.message });
    }
  }
};

module.exports = compraProveedorController;
