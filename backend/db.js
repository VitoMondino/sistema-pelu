const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool(config.db);

(async function verificar() {
  console.log('--- DIAGNÓSTICO DE CONEXIÓN ---');
  console.log(`Intentando conectar a: ${config.db.host} en puerto ${config.db.port}`);
  console.log(`Base de datos: ${config.db.database}`);
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ CONEXIÓN EXITOSA: El backend y la DB están hablando.');
    connection.release();
  } catch (err) {
    console.error('❌ FALLO DE CONEXIÓN:', err.code);
    console.error('Mensaje completo:', err.message);
    // Reintento automático cada 5 segundos
    setTimeout(verificar, 5000);
  }
})();

module.exports = {
  query: (sql, params) => pool.execute(sql, params).then(([res]) => res),
  pool
};