const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool(config.db);

(async function probar() {
  console.log('--- INTENTO DE CONEXIÓN ---');
  // Esto nos dirá si ahora sí lee el host
  console.log(`Host configurado: ${config.db.host}`);
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ ¡CONEXIÓN EXITOSA! El backend ya ve la DB.');
    connection.release();
  } catch (err) {
    console.error('❌ ERROR:', err.code, err.message);
    setTimeout(probar, 5000);
  }
})();

module.exports = {
  query: (sql, params) => pool.execute(sql, params).then(([res]) => res),
  pool
};