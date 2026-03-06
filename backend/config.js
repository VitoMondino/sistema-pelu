module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Tunumero200105',
    database: process.env.DB_NAME || 'sistema-pelu',
    port: Number(process.env.DB_PORT) || 3306,
    
    // Configuraciones de red interna
    timezone: '+00:00',
    dateStrings: true,
    connectTimeout: 30000,
    ssl: false // IMPORTANTE: En red interna NO uses SSL
  },
  server: {
    port: process.env.PORT || 8080,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};