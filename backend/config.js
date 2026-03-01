module.exports = {
  // Prioridad a la URL completa para producción
  dbUrl: process.env.DATABASE_URL, 
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'Tunumero200105',
    database: process.env.DB_NAME || 'sistema-pelu',
    port: Number(process.env.DB_PORT) || 3306,
    
    // Configuraciones de compatibilidad
    timezone: '+00:00',
    dateStrings: true,
    connectTimeout: 20000,
    
    // SSL obligatorio para conectar Render -> Railway
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};