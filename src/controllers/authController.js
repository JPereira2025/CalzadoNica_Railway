/**
 * CONTROLADOR: AuthController
 * @author Gemini Code Assist
 * @description Maneja el ciclo de vida de la autenticación:
 * 1. Login multi-tabla (Usuarios y Clientes).
 * 2. Registro segmentado por roles.
 * DESCRIPCIÓN: Maneja la lógica de autenticación (Login, Registro, Verificación).
 */

const bcrypt = require('bcryptjs');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const prisma = require('../services/prismaService');
const { JWT_SECRET, EMAIL } = require('../config');
const nodemailer = require('nodemailer');

// Configuración del transporte de correo para envío de Tokens
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

/**
 * Lógica de inicio de sesión.
 * Soporta contraseñas en texto plano (migración), bcrypt y argon2.
 */
async function login(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return next({ status: 400, message: 'El usuario/email y la contraseña son requeridos' });
  }

  try {
    // 1. Intentamos buscar primero en la tabla de Usuarios Internos
    let user = await prisma.usuarios.findFirst({
      where: { OR: [{ username: username }, { email: username }] }
    });

    let isClient = false;

    // 2. Si no es un usuario interno, buscamos en la tabla de Clientes
    if (!user) {
      user = await prisma.clientes.findUnique({
        where: { email: username }
      });
      if (user) {
        isClient = true;
        // Adaptamos el objeto cliente para que sea compatible con el resto del flujo
        user.username = user.email;
        user.role = 'Cliente';
        user.verified = user.verificado;
      }
    }

    // Validaciones de existencia y verificación
    if (!user) {
      return next({ status: 401, message: 'El usuario o correo electrónico no existe' });
    }

    if (user.verified === false) {
      return next({ status: 403, message: 'Esta cuenta aún no ha sido verificada. Revisa tu bandeja de entrada.' });
    }

    let authenticated = false;
    let needsRehash = false;

    // Verificación de contraseña (Soporta Argon2, Bcrypt y Texto Plano para migración)
    if (user.password.startsWith('$argon2')) {
      try { authenticated = await argon2.verify(user.password, password); } catch (err) { authenticated = false; }
    } else if (await bcrypt.compare(password, user.password)) {
      authenticated = true;
    } else if (password === user.password) {
      // Si es texto plano, autenticamos pero marcamos para actualizar a hash seguro
      authenticated = true;
      needsRehash = true;
    }

    if (!authenticated) {
      return next({ status: 401, message: 'Contraseña incorrecta' });
    }

    // Actualización de seguridad de contraseña si es necesario
    if (needsRehash) {
      const newHash = await bcrypt.hash(password, 10);
      const targetTable = isClient ? prisma.clientes : prisma.usuarios;
      await targetTable.update({
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
    next(error);
  }
}

/**
 * Crea un nuevo usuario en la DB con rol 'Cliente'.
 * Genera un token JWT para verificación por email.
 */
async function register(req, res, next) {
  // Limpieza de datos de entrada
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const email = String(req.body.email || '').trim().toLowerCase();
  const nombres = String(req.body.nombres || '').trim();
  const apellidos = String(req.body.apellidos || '').trim();
  const telefono = String(req.body.telefono || '').trim();

  if (!username || !password || !email) {
    return next({ status: 400, message: 'El nombre de usuario, correo y contraseña son obligatorios' });
  }

  try {
    // Si el formulario incluye nombres/apellidos, se trata de un cliente (tienda)
    if (nombres || apellidos) {
      const existingClient = await prisma.clientes.findFirst({ where: { email } });
      if (existingClient) {
        return next({ status: 409, message: 'Este correo electrónico ya se encuentra registrado' });
      }

      const hash = await bcrypt.hash(password, 10);

      const cliente = await prisma.clientes.create({
        data: {
          email,
          password: hash,
          nombres: nombres || '',
          apellidos: apellidos || '',
          telefono: telefono || null,
          verificado: false
        }
      });

      // Generación de token JWT para verificación por email
      const verificationToken = jwt.sign(
        { id: cliente.id, email: cliente.email, type: 'email_verification' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.clientes.update({
        where: { id: cliente.id },
        data: { token_verificacion: verificationToken, token_expiry: expiry }
      });

      // Envío de correo electrónico
      try {
        await transporter.sendMail({
          from: EMAIL.from,
          to: email,
          subject: 'Verifica tu cuenta en Calzado Nica',
          text: `Tu token de verificación es: ${verificationToken}`,
          html: `<p>Tu token de verificación es:</p><pre style="font-family: monospace; background:#f4f4f4; padding:10px; border-radius:6px; overflow-x:auto;">${verificationToken}</pre>`
        });
      } catch (mailErr) {
        console.error('MAIL ERROR:', mailErr);
        return next({ status: 500, message: 'Cuenta creada, pero fallo al enviar email' });
      }

      return res.status(201).json({ success: true, message: 'Cuenta creada. Revisa tu correo para el token de verificación.' });
    }

    // Registro de usuarios internos (admin/ventas) — usar un valor de enum válido
    const existing = await prisma.usuarios.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existing) {
      return next({ status: 409, message: 'El nombre de usuario o correo ya está en uso' });
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

    await prisma.usuarios.update({ where: { id: user.id }, data: { verification_token: verificationToken, verification_token_expiry: expiry } });

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
      return next({ status: 500, message: 'Usuario creado, pero fallo al enviar email' });
    }

    res.status(201).json({ success: true, message: 'Usuario creado. Revisa tu correo para el token de verificación.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Valida el token de verificación recibido por el usuario.
 * Si es correcto, marca al usuario como 'verified'.
 */
async function verifyToken(req, res, next) {
  const usernameOrEmail = String(req.body.usernameOrEmail || '').trim();
  const token = String(req.body.token || '').replace(/\s+/g, '');

  if (!usernameOrEmail || !token) {
    return next({ status: 400, message: 'usernameOrEmail y token son requeridos' });
  }

  try {
    // Primero intentar en tabla clientes (usuarios de tienda)
    const cliente = await prisma.clientes.findFirst({ where: { email: usernameOrEmail } });
    if (cliente) {
      if (cliente.verificado) return res.json({ success: true, message: 'Cuenta ya verificada' });
      if (!cliente.token_verificacion) return next({ status: 400, message: 'No hay token asociado a la cuenta' });
      if (cliente.token_verificacion !== token) return next({ status: 400, message: 'Token inválido' });

      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') return next({ status: 400, message: 'Token expirado' });
        return next({ status: 400, message: 'Token inválido' });
      }

      if (payload.type !== 'email_verification' || payload.id !== cliente.id || payload.email !== cliente.email) {
        return next({ status: 400, message: 'Token inválido' });
      }

      await prisma.clientes.update({ where: { id: cliente.id }, data: { verificado: true, token_verificacion: null, token_expiry: null } });
      return res.json({ success: true, message: 'Cuenta verificada correctamente' });
    }

    // Si no está en clientes, intentar en tabla usuarios (admin/empleados)
    const user = await prisma.usuarios.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
    if (!user) return next({ status: 404, message: 'Usuario no encontrado' });

    if (user.verified) return res.json({ success: true, message: 'Cuenta ya verificada' });
    if (!user.verification_token) return next({ status: 400, message: 'No hay token asociado a la cuenta' });
    if (user.verification_token !== token) return next({ status: 400, message: 'Token inválido' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return next({ status: 400, message: 'Token expirado' });
      return next({ status: 400, message: 'Token inválido' });
    }

    if (payload.type !== 'email_verification' || payload.id !== user.id || payload.email !== user.email) {
      return next({ status: 400, message: 'Token inválido' });
    }

    await prisma.usuarios.update({ where: { id: user.id }, data: { verified: true, verification_token: null, verification_token_expiry: null } });
    res.json({ success: true, message: 'Cuenta verificada correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * Reenviar token de verificación al correo del usuario/cliente
 */
async function resendToken(req, res, next) {
  const usernameOrEmail = String(req.body.usernameOrEmail || '').trim();

  if (!usernameOrEmail) return next({ status: 400, message: 'usernameOrEmail es requerido' });

  try {
    // intentar encontrar en clientes
    const cliente = await prisma.clientes.findFirst({ where: { email: usernameOrEmail } });
    if (cliente) {
      const verificationToken = jwt.sign({ id: cliente.id, email: cliente.email, type: 'email_verification' }, JWT_SECRET, { expiresIn: '15m' });
      const expiry = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.clientes.update({ where: { id: cliente.id }, data: { token_verificacion: verificationToken, token_expiry: expiry } });
      try {
        await transporter.sendMail({
          from: EMAIL.from,
          to: cliente.email,
          subject: 'Reenvío: token de verificación - Calzado Nica',
          text: `Tu token de verificación es: ${verificationToken}`,
          html: `<p>Tu token de verificación es:</p><pre style="font-family: monospace; background:#f4f4f4; padding:10px; border-radius:6px; overflow-x:auto;">${verificationToken}</pre>`
        });
      } catch (mailErr) {
        console.error('MAIL ERROR:', mailErr);
        return next({ status: 500, message: 'Error al reenviar el correo de verificación' });
      }
      return res.json({ success: true, message: 'Token reenviado. Revisa tu correo.' });
    }

    // intentar encontrar en usuarios
    const user = await prisma.usuarios.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
    if (user) {
      const verificationToken = jwt.sign({ id: user.id, username: user.username, email: user.email, type: 'email_verification' }, JWT_SECRET, { expiresIn: '15m' });
      const expiry = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.usuarios.update({ where: { id: user.id }, data: { verification_token: verificationToken, verification_token_expiry: expiry } });
      try {
        await transporter.sendMail({
          from: EMAIL.from,
          to: user.email,
          subject: 'Reenvío: token de verificación - Calzado Nica',
          text: `Tu token de verificación es: ${verificationToken}`,
          html: `<p>Tu token de verificación es:</p><pre style="font-family: monospace; background:#f4f4f4; padding:10px; border-radius:6px; overflow-x:auto;">${verificationToken}</pre>`
        });
      } catch (mailErr) {
        console.error('MAIL ERROR:', mailErr);
        return next({ status: 500, message: 'Error al reenviar el correo de verificación' });
      }
      return res.json({ success: true, message: 'Token reenviado. Revisa tu correo.' });
    }

    return next({ status: 404, message: 'Usuario o correo no encontrado' });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  res.json({ success: true, message: 'Sesión cerrada' });
}

module.exports = {
  login,
  logout,
  register,
  verifyToken,
  resendToken
};
