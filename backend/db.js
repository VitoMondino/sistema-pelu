const mysql = require('mysql2/promise');
const config = require('./config');

console.log('Intentando conectar a:', config.db.host, 'en puerto:', config.db.port);

// Creamos el pool con toda la configuración de config.js
const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Prueba de conexión inmediata al arrancar el backend
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
    
    // Si la conexión se pierde, intentamos reconectar una vez
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reintentando consulta por desconexión...');
        const [results] = await pool.execute(sql, params);
        return results;
    }
    throw error;
  }
}

module.exports = { query };