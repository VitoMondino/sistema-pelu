module.exports = {
  db: {
    // Toma los datos de la captura de Render
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'Tunumero200105', 
    database: process.env.DB_NAME || 'sistema-pelu', 
    port: Number(process.env.DB_PORT) || 3306,
    
    // CONFIGURACIONES CRÍTICAS (Dentro de db para que funcionen)
    timezone: '+00:00',
    dateStrings: true,
    connectTimeout: 20000,
    
    // SSL se activa automáticamente solo si estamos en la nube
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};