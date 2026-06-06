const express = require('express');
const { login, logout, register, verifyToken, resendToken, loginStore } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const router = express.Router();

// Registro: permitir registro público solo para clientes (cuando vienen nombres/apellidos).
// Para crear usuarios internos (sin nombres/apellidos), requerimos autenticación y rol Administrador.
router.post('/register', (req, res, next) => {
	const { nombres, apellidos } = req.body || {};
	if (!nombres && !apellidos) {
		// Creación de usuario interno — proteger con auth + admin
		return authenticateToken(req, res, function(err) {
			if (err) return next(err);
			return requireAdmin(req, res, function(err2) {
				if (err2) return next(err2);
				return register(req, res, next);
			});
		});
	}
	// Registro público (cliente)
	return register(req, res, next);
});

router.post('/resend-token', resendToken);
router.post('/verify-token', verifyToken);
router.post('/login', login);
// Login para la tienda pública (clientes) — ruta separada
router.post('/tienda/login', loginStore);
router.post('/logout', logout);

module.exports = router;
