const bcrypt = require('bcryptjs');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const prisma = require('../services/prismaService');
const { JWT_SECRET, EMAIL } = require('../config');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: EMAIL.host,
  port: EMAIL.port,
  secure: false,
  auth: {
    user: EMAIL.user,
    pass: EMAIL.pass
  },
  requireTLS: true,
  tls: {
    rejectUnauthorized: false
  }
});

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

    if (user.verified === false) {
      return res.status(403).json({ success: false, message: 'Cuenta no verificada. Revisa tu correo.' });
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

async function register(req, res) {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: 'username, password y email son requeridos' });
  }

  try {
    const existing = await prisma.usuarios.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Usuario o correo ya existe' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.usuarios.create({
      data: {
        username,
        password: hash,
        role: 'Vendedor',
        email,
        verified: false
      }
    });

    const verificationToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        type: 'email_verification'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.usuarios.update({
      where: { id: user.id },
      data: {
        verification_token: verificationToken,
        verification_token_expiry: expiry
      }
    });

    try {
      await transporter.sendMail({
        from: EMAIL.from,
        to: email,
        subject: 'Tu token de verificación',
        text: `Tu token de verificación es: ${verificationToken}`,
        html: `<p>Tu token de verificación es:</p><pre style="font-family: monospace; background:#f4f4f4; padding:10px; border-radius:6px; overflow-x:auto;">${verificationToken}</pre>`
      });
    } catch (mailErr) {
      console.error('MAIL ERROR:', mailErr);
      return res.status(500).json({ success: false, message: 'Usuario creado, pero fallo al enviar email' });
    }

    res.status(201).json({ success: true, message: 'Usuario creado. Revisa tu correo para el token de verificación.' });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

async function verifyToken(req, res) {
  const usernameOrEmail = String(req.body.usernameOrEmail || '').trim();
  const token = String(req.body.token || '').replace(/\s+/g, '');

  if (!usernameOrEmail || !token) {
    return res.status(400).json({ success: false, message: 'usernameOrEmail y token son requeridos' });
  }

  try {
    const user = await prisma.usuarios.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.verified) {
      return res.json({ success: true, message: 'Cuenta ya verificada' });
    }

    if (!user.verification_token) {
      return res.status(400).json({ success: false, message: 'No hay token asociado a la cuenta' });
    }

    if (user.verification_token !== token) {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ success: false, message: 'Token expirado' });
      }
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    if (payload.type !== 'email_verification' || payload.id !== user.id || payload.email !== user.email) {
      return res.status(400).json({ success: false, message: 'Token inválido' });
    }

    await prisma.usuarios.update({
      where: { id: user.id },
      data: { verified: true, verification_token: null, verification_token_expiry: null }
    });

    res.json({ success: true, message: 'Cuenta verificada correctamente' });
  } catch (error) {
    console.error('VERIFY TOKEN ERROR:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

function logout(req, res) {
  res.json({ success: true, message: 'Sesión cerrada' });
}

module.exports = {
  login,
  logout,
  register,
  verifyToken
};
