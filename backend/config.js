module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'Tunumero200105',
    database: process.env.DB_NAME || 'peluqueria_db',
    port: Number(process.env.DB_PORT) || 3306, // Forzamos a número
    // CONFIGURACIONES CRÍTICAS
    timezone: '+00:00',
    dateStrings: true,
    ssl: {
      rejectUnauthorized: false // Ahora sí está dentro de db
    },
    connectTimeout: 20000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};