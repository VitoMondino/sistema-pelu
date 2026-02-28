const mysql = require('mysql2/promise');
const config = require('./config');

console.log('Intentando conectar a:', config.db.host, 'en el puerto:', config.db.port);

const pool = mysql.createPool({
  ...config.db,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Función de prueba inmediata
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ CONEXIÓN EXITOSA CON RAILWAY');
        connection.release();
    } catch (err) {
        console.error('❌ ERROR CRÍTICO DE CONEXIÓN:', err.message);
    }
})();

async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en la base de datos:', error.message);
    // Si la conexión se perdió, intentamos una vez más
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reintentando consulta...');
        const [results] = await pool.execute(sql, params);
        return results;
    }
    throw error;
  }
}

module.exports = { query };