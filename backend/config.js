module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'Tunumero200105',
    database: process.env.DB_NAME || 'peluqueria_db',
    port: process.env.DB_PORT || 3306,
    // CONFIGURACIONES CRÍTICAS PARA FECHAS 
    timezone: '+00:00',      // Fuerza MySQL a trabajar en UTC
    dateStrings: true,       // Devuelve fechas como strings, NO como objetos Date
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
  // --- AGREGA ESTAS LÍNEAS ---
  ssl: {
    rejectUnauthorized: false // Permite la conexión segura de Railway
  },
  connectTimeout: 20000, // 20 segundos para intentar conectar
};