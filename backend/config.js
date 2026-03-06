module.exports = {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    
    // Configuración para Red Interna de Railway
    connectTimeout: 30000, 
    ssl: false // DENTRO de Railway, SSL debe ser false para evitar conflictos de DNS
  },
  server: {
    port: process.env.PORT || 8080,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};