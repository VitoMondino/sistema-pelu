const mysql = require('mysql2/promise');
const config = require('./config');

// Forzamos un objeto de configuración limpio
const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000, // 20 segundos
  ssl: {
    rejectUnauthorized: false
  }
});

(async function testConnection() {
  try {
    console.log(`⏳ Intentando conectar a: ${config.db.host}:${config.db.port}...`);
    const connection = await pool.getConnection();
    console.log('✅ CONEXIÓN EXITOSA: El puente con la DB está abierto.');
    connection.release();
  } catch (err) {
    console.error('❌ ERROR REAL DE CONEXIÓN:', err.code, err.message);
    // Si falla, reintenta en 5 segundos
    setTimeout(testConnection, 5000);
  }
})();

module.exports = {
  query: async (sql, params) => {
    const [results] = await pool.execute(sql, params);
    return results;
  },
  pool
};