const db = require('../db');

const proveedorController = {
  // Obtener todos los proveedores
  getAll: async (req, res) => {
    try {
      const proveedores = await db.query(
        'SELECT * FROM proveedores ORDER BY nombre'
      );
      res.json({ data: proveedores });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al obtener proveedores', 
        error: error.message 
      });
    }
  },

  // Obtener un proveedor por ID
  getById: async (req, res) => {
    try {
      const proveedor = await db.query(
        'SELECT * FROM proveedores WHERE id = ?',
        [req.params.id]
      );
      
      if (proveedor.length === 0) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      
      res.json({ data: proveedor[0] });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al obtener el proveedor', 
        error: error.message 
      });
    }
  },

  // Crear nuevo proveedor
  create: async (req, res) => {
    try {
      const { nombre, apellido, telefono, email, ubicacion, historial_compras } = req.body;
      
      if (!nombre || !apellido || !telefono) {
        return res.status(400).json({ 
          message: 'Los campos nombre, apellido y teléfono son obligatorios' 
        });
      }
      
      const result = await db.query(
        'INSERT INTO proveedores (nombre, apellido, telefono, email, ubicacion, activo, historial_compras) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          nombre.trim(), 
          apellido.trim(), 
          telefono.trim(), 
          email ? email.trim() : null, 
          ubicacion ? ubicacion.trim() : null, 
          1,
          historial_compras ? historial_compras.trim() : null
        ]
      );
      
      res.status(201).json({
        message: 'Proveedor creado exitosamente',
        data: { id: result.insertId }
      });
      
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al crear proveedor', 
        error: error.message,
        sqlMessage: error.sqlMessage,
        code: error.code
      });
    }
  },

  // Actualizar proveedor
  update: async (req, res) => {
    try {
      const { nombre, apellido, telefono, email, ubicacion, activo, historial_compras } = req.body;
      
      if (!nombre || !apellido || !telefono) {
        return res.status(400).json({ 
          message: 'Los campos nombre, apellido y teléfono son obligatorios' 
        });
      }
      
      const result = await db.query(
        'UPDATE proveedores SET nombre = ?, apellido = ?, telefono = ?, email = ?, ubicacion = ?, activo = ?, historial_compras = ? WHERE id = ?',
        [
          nombre.trim(), 
          apellido.trim(), 
          telefono.trim(), 
          email ? email.trim() : null, 
          ubicacion ? ubicacion.trim() : null, 
          activo !== undefined ? (activo ? 1 : 0) : 1, 
          historial_compras ? historial_compras.trim() : null, 
          req.params.id
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }

      res.json({ message: 'Proveedor actualizado exitosamente' });
      
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al actualizar proveedor', 
        error: error.message,
        sqlMessage: error.sqlMessage
      });
    }
  },

  // Eliminar proveedor
  delete: async (req, res) => {
    try {
      const result = await db.query(
        'DELETE FROM proveedores WHERE id = ?',
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }

      res.json({ message: 'Proveedor eliminado exitosamente' });
      
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al eliminar proveedor', 
        error: error.message 
      });
    }
  },

  // Cambiar estado activo/inactivo
  toggleActivo: async (req, res) => {
    try {
      const result = await db.query(
        'UPDATE proveedores SET activo = NOT activo WHERE id = ?',
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }

      res.json({ message: 'Estado del proveedor actualizado exitosamente' });
      
    } catch (error) {
      res.status(500).json({ 
        message: 'Error al actualizar estado del proveedor', 
        error: error.message 
      });
    }
  }
};

module.exports = proveedorController;
