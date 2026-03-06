module.exports = {
  db: {
    host: process.env.DB_HOST || 'mysql-production-8860.up.railway.app',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mnImCLKFaTTSvifYXwrO1DZgWizTkBcL',
    database: process.env.DB_NAME || 'sistema-pelu',
    port: Number(process.env.DB_PORT) || 59742,
    
    // Configuración de túnel público
    connectTimeout: 60000,
    acquireTimeout: 60000,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: {
      rejectUnauthorized: false
    }
  },
  server: {
    port: process.env.PORT || 8080,
  }
};