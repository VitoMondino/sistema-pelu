const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config'); // Necesitaremos una clave secreta para JWT en config

// Función para registrar un nuevo usuario (opcional, ya que tenemos uno por defecto)
// async function register(req, res, next) {
//   const { nombre_usuario, contrasena } = req.body;
//   if (!nombre_usuario || !contrasena) {
//     return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
//   }
//   try {
//     const hashedPassword = await bcrypt.hash(contrasena, 10);
//     const result = await db.query(
//       'INSERT INTO usuarios (nombre_usuario, contrasena) VALUES (?, ?)',
//       [nombre_usuario, hashedPassword]
//     );
//     res.status(201).json({ message: 'Usuario registrado con éxito!', userId: result.insertId });
//   } catch (error) {
//     if (error.code === 'ER_DUP_ENTRY') {
//       return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
//     }
//     next(error);
//   }
// }

async function login(req, res, next) {
  const { nombre_usuario, contrasena } = req.body;
  if (!nombre_usuario || !contrasena) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
  }

  try {
    const users = await db.query('SELECT * FROM usuarios WHERE nombre_usuario = ?', [nombre_usuario]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const user = users[0];

    // Comparar la contraseña directamente si no está hasheada (como en el script SQL inicial)
    // En una implementación real, la contraseña en la BD debería estar hasheada durante el registro.
    // Y aquí se usaría bcrypt.compare(contrasena, user.contrasena)
    let passwordIsValid;
    if (user.nombre_usuario === 'MVsalonUrbano' && user.contrasena === 'Tunumero200105+') {
        // Para el usuario por defecto, comparamos directamente (ya que no se hasheó al insertarlo)
        passwordIsValid = (contrasena === user.contrasena);
    } else {
        // Para otros usuarios (si se implementa registro con hash), se usaría bcrypt
        // passwordIsValid = await bcrypt.compare(contrasena, user.contrasena);
        // Por ahora, si no es el usuario por defecto y la contraseña no está hasheada, fallará o dará error si se intenta comparar.
        // Para este caso, asumimos que cualquier otro usuario tendría su contraseña hasheada.
        // Como no hay otros usuarios, este path no se tomará.
        // Si se implementa registro, la contraseña del usuario por defecto también debería hashearse.
        // O manejar este caso especial.
        // Por simplicidad, si no es el usuario por defecto, asumimos que la comparación fallará si no está hasheada.
        try {
            passwordIsValid = await bcrypt.compare(contrasena, user.contrasena);
        } catch (e) {
            // Si falla el compare (ej. porque la contraseña en BD no es un hash válido), es inválida.
            passwordIsValid = false;
        }
    }


    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // Generar JWT
    // Asegúrate de tener una JWT_SECRET en tu archivo config.js o .env
    if (!config.jwt_secret) {
        console.error("Error: JWT_SECRET no está definida en la configuración.");
        return res.status(500).json({ message: "Error de configuración del servidor." });
    }
    const token = jwt.sign({ id: user.id, nombre_usuario: user.nombre_usuario }, config.jwt_secret, {
      expiresIn: '1h' // El token expira en 1 hora
    });

    res.status(200).json({
      message: 'Login exitoso!',
      token,
      user: { id: user.id, nombre_usuario: user.nombre_usuario }
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  // register, // Descomentar si se implementa el registro
  login
};
