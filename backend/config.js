module.exports = {
  db: {
    host: process.env.DB_HOST || 'mysql.railway.internal',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mnImCLKFaTTSvifYXwrO1DZgWizTkBcL',
    database: process.env.DB_NAME || 'sistema-pelu', // Nombre exacto de tu captura
    port: Number(process.env.DB_PORT) || 3306,
    
    // Configuración para red interna de Railway
    timezone: '+00:00',
    dateStrings: true,
    connectTimeout: 30000,
    ssl: false // No es necesario dentro de Railway
  },
  server: {
    port: process.env.PORT || 8080,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};