module.exports = {
  db: {
    host: process.env.DB_HOST || 'mysql-production-8860.up.railway.app',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mnImCLKFaTTSvifYXwrO1DZgWizTkBcL',
    database: process.env.DB_NAME || 'sistema-pelu',
    port: Number(process.env.DB_PORT) || 3306,
    
    // Al usar el host público, a veces Railway requiere SSL o mayor tiempo de espera
    connectTimeout: 60000,
    ssl: {
      rejectUnauthorized: false // Permite la conexión segura de Railway
    }
  },
  server: {
    port: process.env.PORT || 8080,
  }
};