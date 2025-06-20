const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // Si no hay token, no autorizado
  }

  jwt.verify(token, config.jwt_secret, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Si el token no es válido, prohibido
    }
    req.user = user;
    next(); // Token válido, continuar
  });
}

module.exports = authenticateToken;
