const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { normalizeRole } = require('../utils/role');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }

    req.user = payload;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || normalizeRole(req.user.role) !== 'Administrador') {
    return res.status(403).json({ success: false, message: 'Acceso denegado: solo administrador.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
