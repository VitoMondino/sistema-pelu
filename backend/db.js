const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  ...config.db,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

(async function conectar() {
  console.log(`--- INTENTO DE CONEXIÓN ---`);
  console.log(`Host: ${config.db.host} | Puerto: ${config.db.port}`);
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ ¡CONEXIÓN ESTABLECIDA CON ÉXITO!');
    connection.release();
  } catch (err) {
    console.error('❌ ERROR DE ENLACE:', err.code);
    console.log('Reintentando en 5 segundos...');
    setTimeout(conectar, 5000);
  }
})();

module.exports = {
  query: (sql, params) => pool.execute(sql, params).then(([res]) => res),
  pool
};