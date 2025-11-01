// ...existing code...
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authenticateToken = require('../middleware/authMiddleware');

// Todas las rutas de stock requieren autenticación
router.use(authenticateToken);

// Rutas específicas primero (evitan conflictos con '/:id')

// GET /api/stock - Obtener todos los productos del stock
router.get('/', stockController.getAllStock);

// GET /api/stock/movimientos - Obtener todos los movimientos de stock
router.get('/movimientos', stockController.getMovimientosStock);

// POST /api/stock/movimiento - Crear un nuevo movimiento de stock manual/detallado
router.post('/movimiento', stockController.createMovimientoStock);

// POST /api/stock - Crear un nuevo producto en el stock
router.post('/', stockController.createStock);

// Rutas con :id después
// GET /api/stock/:id - Obtener un producto del stock por ID
router.get('/:id', stockController.getStockById);

// PUT /api/stock/:id - Actualizar un producto del stock (incluye ajuste rápido de cantidad)
router.put('/:id', stockController.updateStock);

// DELETE /api/stock/:id - Eliminar un producto del stock
router.delete('/:id', stockController.deleteStock);

module.exports = router;