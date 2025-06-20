const express = require('express');
const cors = require('cors'); // Instalaremos cors más adelante
const config = require('./config');
// Rutas (se crearán más adelante)
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const servicioRoutes = require('./routes/servicios');
const turnoRoutes = require('./routes/turnos');
const stockRoutes = require('./routes/stock');
const whatsappService = require('./services/whatsappService');

const app = express();

const whatsappRoutes = require('./routes/whatsappRoutes'); // Importar rutas de WhatsApp
const schedulerService = require('./services/schedulerService'); // Importar scheduler

// Inicializar WhatsApp Client al arrancar el servidor
whatsappService.initializeWhatsAppClient();

// Iniciar tareas programadas
schedulerService.iniciarTareasProgramadas();

// Middlewares
app.use(cors()); // Permitir solicitudes desde el frontend
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Rutas base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Peluquería MVsalonUrbano' });
});

// Usar rutas (se habilitarán más adelante)
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/whatsapp', whatsappRoutes); // Usar rutas de WhatsApp

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
