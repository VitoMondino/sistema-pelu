module.exports = {
  db: {
    // Lee las variables de la captura image_708db7.png
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Tunumero200105',
    database: process.env.DB_NAME || 'railway', 
    port: Number(process.env.DB_PORT) || 3306,
    
    // Configuración para Railway interno
    timezone: '+00:00',
    dateStrings: true,
    connectTimeout: 30000,
    ssl: false // IMPORTANTE: Sin SSL para mysql.railway.internal
  },
  server: {
    port: process.env.PORT || 8080,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};