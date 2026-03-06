module.exports = {
  db: {
    host: process.env.DB_HOST || 'mysql-production-8860.up.railway.app',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mnImCLKFaTTSvifYXwrO1DZgWizTkBcL',
    database: process.env.DB_NAME || 'sistema-pelu',
    port: Number(process.env.DB_PORT) || 59742,
    
    // Configuración para evitar PROTOCOL_CONNECTION_LOST
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 20000,
    
    // IMPORTANTE: SSL con rejectUnauthorized en false es vital para dominios .up.railway.app
    ssl: {
      rejectUnauthorized: false
    }
  },
  server: {
    port: process.env.PORT || 8080,
  }
};