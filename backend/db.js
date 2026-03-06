const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Verificación de conexión
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ CONEXIÓN INTERNA EXITOSA: Base de datos lista.');
        connection.release();
    } catch (err) {
        console.error('❌ ERROR DE CONEXIÓN:', err.message);
        console.log('Intentando conectar a:', config.db.host, 'Puerto:', config.db.port);
    }
})();

async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en consulta DB:', error.message);
    throw error;
  }
}

module.exports = { query, pool };