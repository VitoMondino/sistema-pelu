const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Función de conexión con reintento automático
(async function connect() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ CONEXIÓN EXITOSA: Backend y MySQL unidos internamente.');
        connection.release();
    } catch (err) {
        console.error('❌ ERROR DE ENLACE:', err.message);
        console.log('Reintentando en 5 segundos...');
        setTimeout(connect, 5000);
    }
})();

module.exports = {
  query: async (sql, params) => {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Error en consulta:', error.message);
      throw error;
    }
  },
  pool
};