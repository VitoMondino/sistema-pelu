const mysql = require('mysql2/promise');
const config = require('./config');

// Creamos un Pool configurado para conexiones seguras y estables
const pool = mysql.createPool({
  ...config.db,
  // Configuraciones críticas para Railway/Render:
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Mantiene la conexión activa para evitar el cierre por el servidor
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Tiempo de espera para conectar
  connectTimeout: 20000 
});

async function query(sql, params) {
  try {
    // Usamos execute para mayor seguridad con sentencias preparadas
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    // Si la conexión se pierde, el pool intentará reconectar en la próxima llamada
    console.error('Error en la base de datos:', error);
    throw error;
  }
}

// Exportamos el pool por si necesitas usar transacciones en el futuro
module.exports = {
  query,
  pool 
};