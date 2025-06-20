const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turnoController');
const authenticateToken = require('../middleware/authMiddleware');

// Todas las rutas de turnos requieren autenticación
router.use(authenticateToken);

// GET /api/turnos - Obtener todos los turnos
router.get('/', turnoController.getAllTurnos);

// GET /api/turnos/:id - Obtener un turno por ID
router.get('/:id', turnoController.getTurnoById);

// POST /api/turnos - Agendar un nuevo turno
router.post('/', turnoController.createTurno);

// PUT /api/turnos/:id - Actualizar un turno
router.put('/:id', turnoController.updateTurno);

// DELETE /api/turnos/:id - Eliminar un turno (o podría ser PUT para cancelar)
router.delete('/:id', turnoController.deleteTurno);

module.exports = router;
