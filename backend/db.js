const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Tiempos de espera agresivos para evitar el Timeout
  connectTimeout: 20000 
});

(async function verificarConexion() {
  console.log(`--- INTENTO DE CONEXIÓN FINAL ---`);
  console.log(`Conectando a: ${config.db.host}:${config.db.port}`);
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ ¡SISTEMA CONECTADO! La base de datos respondió.');
    connection.release();
  } catch (err) {
    console.error('❌ ERROR ACTUAL:', err.code);
    console.log('Reintentando en 5 segundos...');
    setTimeout(verificarConexion, 5000);
  }
})();

module.exports = {
  query: (sql, params) => pool.execute(sql, params).then(([res]) => res),
  pool
};