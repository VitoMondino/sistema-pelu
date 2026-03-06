const mysql = require('mysql2/promise');
const config = require('./config');

// Configuramos el origen de la conexión de forma robusta
let poolConfig;

if (config.dbUrl) {
  // Si usamos DATABASE_URL, verificamos si necesita inyección de parámetros SSL
  const needsSsl = config.dbUrl.includes('proxy.rlwy.net');
  const separator = config.dbUrl.includes('?') ? '&' : '?';
  
  poolConfig = needsSsl 
    ? config.dbUrl + separator + "ssl={\"rejectUnauthorized\":false}"
    : config.dbUrl;
} else {
  // Configuración estándar usando el objeto config.db
  poolConfig = {
    ...config.db,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };
}

const pool = mysql.createPool(poolConfig);

// Verificación de salud de la conexión al arrancar el proceso
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ CONEXIÓN EXITOSA: El backend está vinculado a la base de datos.');
        connection.release();
    } catch (err) {
        console.error('❌ ERROR CRÍTICO DE CONEXIÓN:', err.message);
        console.error('Detalles del Host intentado:', config.db.host);
    }
})();

async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en consulta DB:', error.message);
    
    // Gestión de reconexión automática si el servidor cierra el socket
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.fatal) {
        console.log('🔄 Reintentando consulta por pérdida de conexión...');
        const [results] = await pool.execute(sql, params);
        return results;
    }
    throw error;
  }
}

module.exports = { query, pool };