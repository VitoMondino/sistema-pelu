module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', // Cambia esto por tu usuario de MySQL
    password: process.env.DB_PASSWORD || '', // Cambia esto por tu contraseña de MySQL
    database: process.env.DB_NAME || 'peluqueria_db',
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt_secret: process.env.JWT_SECRET || 'tu_super_secreto_jwt_muy_largo_y_dificil_de_adivinar_12345!', // Cambia esto en producción
  // En un futuro, aquí irían las credenciales de la API de WhatsApp
  whatsapp: {
    // Ejemplo:
    // apiKey: process.env.WHATSAPP_API_KEY || 'tu_api_key',
    // senderId: process.env.WHATSAPP_SENDER_ID || 'tu_sender_id'
  }
};
