const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const controller = require('../controllers/asistenciaController');

router.use(authenticateToken); // proteger endpoints

router.get('/', controller.getAllAsistencias); // listado
router.get('/:clienteId', controller.getAsistenciaByCliente);
router.post('/:clienteId/check', controller.marcarAsistencia); // marcar un corte
router.post('/:clienteId/reset', controller.resetAsistencia);   // reiniciar contador manualmente

module.exports = router;