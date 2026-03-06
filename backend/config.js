module.exports = {
  db: {
    // Si la variable falla, usará el string directo
    host: process.env.DB_HOST || 'mysql.railway.internal',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mnImCLKFaTTSvifYXwrO1DZgWizTkBcL',
    database: process.env.DB_NAME || 'sistema-pelu',
    port: Number(process.env.DB_PORT) || 3306,
    ssl: false 
  },
  server: {
    port: process.env.PORT || 8080,
  }
};