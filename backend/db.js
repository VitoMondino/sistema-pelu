const mysql = require('mysql2/promise');
const config = require('./config');

console.log('Intentando conectar a:', config.db.host, 'en puerto:', config.db.port);
console.log('SSL Configurado:', !!config.db.ssl); // Debería imprimir true

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

// Función de prueba inmediata al arrancar
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ CONEXIÓN EXITOSA CON RAILWAY');
        connection.release();
    } catch (err) {
        console.error('❌ ERROR CRÍTICO DE CONEXIÓN:', err.message);
        // El error "Connection lost" suele ocurrir si el SSL no se aplicó bien o el puerto es incorrecto
    }
})();

async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en la base de datos:', error.message);
    
    // Si la conexión se pierde (común en Railway), reintentamos una vez
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reintentando consulta por conexión perdida...');
        const [results] = await pool.execute(sql, params);
        return results;
    }
    throw error;
  }
}

module.exports = { query, pool };