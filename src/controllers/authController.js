const bcrypt = require('bcryptjs');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const prisma = require('../services/prismaService');
const { JWT_SECRET } = require('../config');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });
  }

  try {
    const user = await prisma.usuarios.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    let authenticated = false;
    let needsRehash = false;

    if (user.password.startsWith('$argon2')) {
      try {
        authenticated = await argon2.verify(user.password, password);
      } catch (err) {
        authenticated = false;
      }
    } else if (await bcrypt.compare(password, user.password)) {
      authenticated = true;
    } else if (password === user.password) {
      authenticated = true;
      needsRehash = true;
    }

    if (!authenticated) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    if (needsRehash) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.usuarios.update({
        where: { id: user.id },
        data: { password: newHash }
      });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: '8h'
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

function logout(req, res) {
  res.json({ success: true, message: 'Sesión cerrada' });
}

module.exports = {
  login,
  logout
};
