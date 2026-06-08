/**
 * CONTROLADOR: AuthController
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
    // Buscar únicamente en la tabla de usuarios internos (webapp)
    let user = await prisma.usuarios.findFirst({ where: { OR: [{ username: username }, { email: username }] } });

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

    // Actualización de seguridad de contraseña si es necesario (solo usuarios internos)
    if (needsRehash) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.usuarios.update({ where: { id: user.id }, data: { password: newHash } });
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
  const provincia = req.body.direccion?.provincia || '';
  const ciudad = req.body.direccion?.ciudad || '';
  const direccion_exacta = req.body.direccion?.direccion || '';

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
          telefono: telefono || '',
          verificado: false
        }
      });

      // Si se envió dirección, guardarla en la tabla `direcciones` vinculada al cliente
      if (provincia || ciudad || direccion_exacta) {
        try {
          await prisma.direcciones.create({
            data: {
              cliente_id: cliente.id,
              nombre: `${nombres} ${apellidos}`.trim() || '',
              telefono: telefono || '',
              provincia: provincia || '',
              ciudad: ciudad || '',
              direccion_exacta: direccion_exacta || '',
              es_predeterminada: true
            }
          });
        } catch (addrErr) {
          console.error('ERROR guardando dirección inicial:', addrErr);
          // No abortar la creación del cliente por fallo al guardar dirección
        }
      }

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
    console.info(`[RESEND_TOKEN] Request to resend token for: ${usernameOrEmail}`);
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
      // En modo debug, devolver también el token en la respuesta para pruebas locales
      if (process.env.DEBUG_RESEND === 'true' || process.env.NODE_ENV === 'development') {
        return res.json({ success: true, message: 'Token reenviado. Revisa tu correo.', token: verificationToken });
      }
      return res.json({ success: true, message: 'Token reenviado. Revisa tu correo.' });
    }

    // intentar encontrar en usuarios
    const user = await prisma.usuarios.findFirst({ where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
    if (user) {
      console.info(`[RESEND_TOKEN] Found user id=${user.id} username=${user.username} email=${user.email}`);
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
      if (process.env.DEBUG_RESEND === 'true' || process.env.NODE_ENV === 'development') {
        return res.json({ success: true, message: 'Token reenviado. Revisa tu correo.', token: verificationToken });
      }
      return res.json({ success: true, message: 'Token reenviado. Revisa tu correo.' });
    }

    console.info(`[RESEND_TOKEN] No user or cliente found for: ${usernameOrEmail}`);
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

/**
 * Login para la tienda pública (clientes).
 * Usa la tabla `clientes` exclusivamente y retorna token con role 'Cliente'.
 */
async function loginStore(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return next({ status: 400, message: 'El usuario/email y la contraseña son requeridos' });
  }

  try {
    const cliente = await prisma.clientes.findFirst({ where: { email: username } });
    if (!cliente) return next({ status: 401, message: 'El usuario o correo electrónico no existe' });
    if (cliente.verificado === false) return next({ status: 403, message: 'Cuenta no verificada' });

    let authenticated = false;
    let needsRehash = false;

    if (cliente.password && cliente.password.startsWith && cliente.password.startsWith('$argon2')) {
      try { authenticated = await argon2.verify(cliente.password, password); } catch (err) { authenticated = false; }
    } else if (await bcrypt.compare(password, cliente.password)) {
      authenticated = true;
    } else if (password === cliente.password) {
      authenticated = true;
      needsRehash = true;
    }

    if (!authenticated) return next({ status: 401, message: 'Contraseña incorrecta' });

    if (needsRehash) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.clientes.update({ where: { id: cliente.id }, data: { password: newHash } });
    }

    const token = jwt.sign({ id: cliente.id, username: cliente.email, role: 'Cliente' }, JWT_SECRET, { expiresIn: '8h' });

    // Buscar dirección predeterminada del cliente si existe
    let direccion = null;
    try {
      direccion = await prisma.direcciones.findFirst({ where: { cliente_id: cliente.id, es_predeterminada: true } });
    } catch (dErr) { /* noop */ }

    res.json({ 
      success: true, 
      user: { 
        id: cliente.id, 
        username: cliente.email, 
        email: cliente.email,
        role: 'Cliente',
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        telefono: cliente.telefono,
        provincia: direccion ? direccion.provincia : '',
        ciudad: direccion ? direccion.ciudad : '',
        direccion_exacta: direccion ? direccion.direccion_exacta : ''
      }, 
      token 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Permite al cliente actualizar su información de contacto y dirección
 */
async function updateProfileStore(req, res, next) {
  try {
    const { nombres, apellidos, telefono, provincia, ciudad, direccion_exacta } = req.body;
    const clienteId = req.user.id;

    // Actualizar campos básicos del cliente
    const updatedCliente = await prisma.clientes.update({
      where: { id: clienteId },
      data: { nombres, apellidos, telefono }
    });

    // Actualizar o crear la dirección predeterminada
    try {
      const existingAddr = await prisma.direcciones.findFirst({ where: { cliente_id: clienteId, es_predeterminada: true } });
      if (existingAddr) {
        await prisma.direcciones.update({
          where: { id: existingAddr.id },
          data: { provincia: provincia || existingAddr.provincia, ciudad: ciudad || existingAddr.ciudad, direccion_exacta: direccion_exacta || existingAddr.direccion_exacta, telefono: telefono || existingAddr.telefono }
        });
      } else if (provincia || ciudad || direccion_exacta) {
        await prisma.direcciones.create({ data: { cliente_id: clienteId, nombre: `${nombres} ${apellidos}`.trim() || '', telefono: telefono || '', provincia: provincia || '', ciudad: ciudad || '', direccion_exacta: direccion_exacta || '', es_predeterminada: true } });
      }
    } catch (addrErr) {
      console.error('ERROR actualizando/creando dirección:', addrErr);
    }

    // Devolver usuario combinado con su dirección predeterminada actual
    let direccion = null;
    try { direccion = await prisma.direcciones.findFirst({ where: { cliente_id: clienteId, es_predeterminada: true } }); } catch (e) { /* noop */ }

    const resultUser = Object.assign({}, updatedCliente, { provincia: direccion ? direccion.provincia : '', ciudad: direccion ? direccion.ciudad : '', direccion_exacta: direccion ? direccion.direccion_exacta : '' });

    res.json({ success: true, message: 'Perfil actualizado', user: resultUser });
  } catch (error) {
    next(error);
  }
}

// Exponer loginStore también
module.exports.loginStore = loginStore;
module.exports.updateProfileStore = updateProfileStore;
