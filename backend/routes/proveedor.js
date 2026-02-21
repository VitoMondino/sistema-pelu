const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const compraProveedorController = require('../controllers/compraProveedorController');
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

// Compras del proveedor (historial estructurado)
router.get('/:id/compras', compraProveedorController.getByProveedor);
router.post('/:id/compras', compraProveedorController.createForProveedor);
router.put('/compras/:id', compraProveedorController.update);
router.delete('/compras/:id', compraProveedorController.delete);

module.exports = router;