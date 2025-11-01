const express = require('express');
const cors = require('cors'); // Instalaremos cors más adelante
const config = require('./config');
// Rutas (se crearán más adelante)
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const servicioRoutes = require('./routes/servicios');
const turnoRoutes = require('./routes/turnos');
const stockRoutes = require('./routes/stock');
const cajaRoutes = require('./routes/caja');
const asistenciaRoutes = require('./routes/asistencia');
// ...existing code...
// Nota: se eliminó require('./routes/movimientosStock') porque no existe el archivo

const app = express();

// Middlewares
app.use(cors()); // Permitir solicitudes desde el frontend
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Rutas base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Peluquería MVsalonUrbano' });
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/stock', stockRoutes); // stockRoutes ya expone GET /movimientos
app.use('/api/caja', cajaRoutes);
app.use('/api/asistencias', asistenciaRoutes);

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
// ...existing code...