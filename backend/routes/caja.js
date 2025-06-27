// routes/cajaRoutes.js
const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');

// 1. ABRIR CAJA
// POST /api/caja/abrir
router.post('/abrir', cajaController.abrirCaja);

// 2. CERRAR CAJA
// POST /api/caja/cerrar
router.post('/cerrar', cajaController.cerrarCaja);

// 3. REGISTRAR MOVIMIENTO DE CAJA
// POST /api/caja/movimiento
router.post('/movimiento', cajaController.registrarMovimiento);

// 4. OBTENER CAJA ACTUAL
// GET /api/caja/actual
router.get('/actual', cajaController.obtenerCajaActual);

// 5. OBTENER RESUMEN DE CAJA CERRADA
// GET /api/caja/resumen/:caja_id
router.get('/resumen/:caja_id', cajaController.obtenerResumenCaja);

// 6. REPORTE POR FECHAS
// GET /api/caja/reporte?fecha_desde=2024-01-01&fecha_hasta=2024-01-31&tipo_movimiento=cobro_cliente&usuario_id=1
router.get('/reporte', cajaController.generarReporte);

// 7. OBTENER CATEGORÍAS DE GASTOS
// GET /api/caja/categorias-gastos
router.get('/categorias-gastos', cajaController.obtenerCategoriasGastos);

// 8. HISTORIAL DE CAJAS
// GET /api/caja/historial?page=1&limit=10
router.get('/historial', cajaController.obtenerHistorial);

module.exports = router;