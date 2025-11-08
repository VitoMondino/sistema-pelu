const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Obtener todos los proveedores
router.get('/', proveedorController.getAll);

// Obtener un proveedor específico
router.get('/:id', proveedorController.getById);

// Crear nuevo proveedor
router.post('/', proveedorController.create);

// Actualizar proveedor existente
router.put('/:id', proveedorController.update);

// Eliminar proveedor
router.delete('/:id', proveedorController.delete);

// Cambiar estado activo/inactivo del proveedor
router.patch('/:id/toggle-activo', proveedorController.toggleActivo);

module.exports = router;