module.exports = {
  // Prioridad a la URL completa (si la usas en Railway)
  dbUrl: process.env.DATABASE_URL, 
  
  db: {
    // Railway inyecta estas variables automáticamente si las vinculas
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'Tunumero200105',
    database: process.env.DB_NAME || 'railway', // En Railway suele ser 'railway'
    port: Number(process.env.DB_PORT) || 3306,
    
    // Configuraciones de compatibilidad de datos
    timezone: '+00:00',
    dateStrings: true,
    connectTimeout: 20000,
    
    /* Lógica de SSL: 
       1. Si estamos en Local (localhost), es false.
       2. Si estamos en Railway (red interna), no es necesario (false).
       3. Solo se activa si detecta un Host externo (como el proxy de Railway).
    */
    ssl: (process.env.DB_HOST && !process.env.DB_HOST.includes('internal')) 
          ? { rejectUnauthorized: false } 
          : false
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt_secret: process.env.JWT_SECRET || 'Tunumero200105+',
};