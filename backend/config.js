module.exports = {
  db: {
    host: process.env.DB_HOST || 'mysql.railway.internal',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mnImCLKFaTTSvifYXwrO1DZgWizTkBcL',
    database: process.env.DB_NAME || 'sistema-pelu',
    port: Number(process.env.DB_PORT) || 3306,
    ssl: false, // Desactivado para red interna
    connectTimeout: 20000 // Aumentamos el tiempo por si el DNS interno tarda
  },
  server: {
    port: process.env.PORT || 8080
  }
};