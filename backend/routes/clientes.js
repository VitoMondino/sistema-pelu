const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const authenticateToken = require('../middleware/authMiddleware');

// Todas las rutas de clientes requieren autenticación
router.use(authenticateToken);

// GET /api/clientes - Obtener todos los clientes
router.get('/', clienteController.getAllClientes);

// GET /api/clientes/proximos-cumpleanos - Obtener clientes con cumpleaños próximos
router.get('/proximos-cumpleanos', clienteController.getProximosCumpleanos);

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', clienteController.getClienteById);

// GET /api/clientes/:id/historial-servicios - Obtener historial de servicios de un cliente
router.get('/:id/historial-servicios', clienteController.getHistorialServiciosByClienteId);

// POST /api/clientes - Crear un nuevo cliente
router.post('/', clienteController.createCliente);

// PUT /api/clientes/:id - Actualizar un cliente
router.put('/:id', clienteController.updateCliente);

// DELETE /api/clientes/:id - Eliminar un cliente
router.delete('/:id', clienteController.deleteCliente);

module.exports = router;
