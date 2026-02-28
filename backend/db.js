const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  ...config.db,
  // 1. SSL obligatorio para Railway
  ssl: {
    rejectUnauthorized: false
  },
  // 2. Parámetros de estabilidad
  waitForConnections: true,
  connectionLimit: 5, // Bajamos el límite para que sea más estable
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // 3. Tiempos de espera extendidos
  connectTimeout: 20000,
  acquireTimeout: 20000
});

async function query(sql, params) {
  let connection;
  try {
    // Intentamos obtener una conexión limpia del pool
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en la base de datos:', error.message);
    // Si la conexión se perdió, el pool intentará crear una nueva en la siguiente petición
    throw error;
  }
}

module.exports = {
  query,
  pool
};