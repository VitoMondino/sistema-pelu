const mysql = require('mysql2/promise');
const config = require('./config');

// Creamos un Pool en lugar de una conexión única
const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function query(sql, params) {
  try {
    // El pool gestiona automáticamente abrir y devolver la conexión
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

module.exports = {
  query
};