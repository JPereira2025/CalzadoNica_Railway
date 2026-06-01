const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { normalizeRole } = require('../utils/role');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    return next({ status: 401, message: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return next({ status: 403, message: 'Token inválido' });
    }

    req.user = payload;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || normalizeRole(req.user.role) !== 'Administrador') {
    return next({ status: 403, message: 'Acceso denegado: solo administrador.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
