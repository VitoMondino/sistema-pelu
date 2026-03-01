const mysql = require('mysql2/promise');
const config = require('./config');

// Configuramos el origen de la conexión
let poolConfig;
if (config.dbUrl) {
  // Si usamos URL (Producción), forzamos SSL
  const separator = config.dbUrl.includes('?') ? '&' : '?';
  poolConfig = config.dbUrl + separator + "ssl={\"rejectUnauthorized\":false}";
} else {
  // Si usamos objeto (Local), usamos la config de db
  poolConfig = {
    ...config.db,
    waitForConnections: true,
    connectionLimit: 5,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };
}

const pool = mysql.createPool(poolConfig);

// Verificación de salud de la conexión al arrancar
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ CONEXIÓN EXITOSA: El puente Render-Railway está activo.');
        connection.release();
    } catch (err) {
        console.error('❌ ERROR DE ENLACE:', err.message);
    }
})();

async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en DB:', error.message);
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reintentando consulta...');
        const [results] = await pool.execute(sql, params);
        return results;
    }
    throw error;
  }
}

module.exports = { query, pool };