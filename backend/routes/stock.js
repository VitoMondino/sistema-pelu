const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authenticateToken = require('../middleware/authMiddleware');

// Todas las rutas de stock requieren autenticación
router.use(authenticateToken);

// GET /api/stock - Obtener todos los productos del stock
router.get('/', stockController.getAllStock);

// GET /api/stock/:id - Obtener un producto del stock por ID
router.get('/:id', stockController.getStockById);

// POST /api/stock - Crear un nuevo producto en el stock
router.post('/', stockController.createStock);

// PUT /api/stock/:id - Actualizar un producto del stock
router.put('/:id', stockController.updateStock);

// DELETE /api/stock/:id - Eliminar un producto del stock
router.delete('/:id', stockController.deleteStock);

module.exports = router;
