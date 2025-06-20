const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const authenticateToken = require('../middleware/authMiddleware');

// Todas las rutas de servicios requieren autenticación
router.use(authenticateToken);

// GET /api/servicios - Obtener todos los servicios
router.get('/', servicioController.getAllServicios);

// GET /api/servicios/:id - Obtener un servicio por ID
router.get('/:id', servicioController.getServicioById);

// POST /api/servicios - Crear un nuevo servicio
router.post('/', servicioController.createServicio);

// PUT /api/servicios/:id - Actualizar un servicio
router.put('/:id', servicioController.updateServicio);

// DELETE /api/servicios/:id - Eliminar un servicio
router.delete('/:id', servicioController.deleteServicio);

module.exports = router;
