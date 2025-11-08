module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', // Cambia esto por usuario de MySQL
    password: process.env.DB_PASSWORD || 'Tunumero200105', // Cambiar esto por contraseña de MySQL
    database: process.env.DB_NAME || 'peluqueria_db',
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+', // Cambiar esto en producción
  // En un futuro, aquí irían las credenciales de la API de WhatsApp
  whatsapp: {
    // Ejemplo:
    // apiKey: process.env.WHATSAPP_API_KEY || 'tu_api_key',
    // senderId: process.env.WHATSAPP_SENDER_ID || 'tu_sender_id'
  }
};
