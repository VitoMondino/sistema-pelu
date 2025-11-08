const express = require('express');
const cors = require('cors'); 
const config = require('./config');

const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const servicioRoutes = require('./routes/servicios');
const turnoRoutes = require('./routes/turnos');
const stockRoutes = require('./routes/stock');
const cajaRoutes = require('./routes/caja');
const asistenciaRoutes = require('./routes/asistencia');
//const movimientoStockRoutes = require('./routes/movimientosStock');
const proveedorRoutes = require('./routes/proveedor');



const app = express();

// Middlewares
app.use(cors()); // Permitir solicitudes desde el frontend
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Rutas base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a Peluquería MV Salon Urbano' });
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/stock', stockRoutes); // stockRoutes ya expone GET /movimientos
app.use('/api/caja', cajaRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/proveedores', proveedorRoutes);
//app.use('/api/movimientos-stock', movimientoStockRoutes);

// No montar rutas inexistentes para evitar ReferenceError / MODULE_NOT_FOUND
// Si más adelante creas routes/movimientosStock.js puedes requerirla y montarla aquí.

// Middleware para manejo de errores (simple por ahora)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message || 'Algo salió mal!' });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
