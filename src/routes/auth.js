const express = require('express');
const { login, logout, register, verifyToken, resendToken } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/resend-token', resendToken);
router.post('/verify-token', verifyToken);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
