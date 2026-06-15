const prisma = require('../services/prismaService');
const { normalizeRole } = require('../utils/role');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const { JWT_SECRET, EMAIL } = require('../config');

// Configurar SendGrid
sgMail.setApiKey(EMAIL.pass);

const fs = require('fs');
const path = require('path');

// Upload product image (admin only)
async function uploadProductoImagen(req, res) {
  try {
    const productoId = req.params.id || req.query.id;
    if (!productoId) return res.status(400).json({ success: false, message: 'ID de producto requerido' });

    const producto = await prisma.productos.findUnique({ where: { id: String(productoId) } });
    if (!producto) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

    if (!req.file) return res.status(400).json({ success: false, message: 'Archivo de imagen no proporcionado' });

    const url = req.file.url || `/tienda/img/${req.file.filename}`;
    const es_principal = req.body.es_principal === '1' || req.body.es_principal === 'true' || req.body.es_principal === true;
    const orden = Number(req.body.orden) || 0;

    // Si se marca como principal, desmarcar otras
    if (es_principal) {
      if (prisma.producto_imagenes && typeof prisma.producto_imagenes.updateMany === 'function') {
        await prisma.producto_imagenes.updateMany({ where: { producto_id: String(productoId), es_principal: true }, data: { es_principal: false } });
      } else {
        // fallback SQL
        await prisma.$executeRawUnsafe('UPDATE producto_imagenes SET es_principal = 0 WHERE producto_id = ? AND es_principal = 1', String(productoId));
      }
    }

    let created = null;
    if (prisma.producto_imagenes && typeof prisma.producto_imagenes.create === 'function') {
      created = await prisma.producto_imagenes.create({
        data: {
          producto_id: String(productoId),
          url: String(url),
          es_principal: !!es_principal,
          orden: orden
        }
      });
    } else {
      // Fallback: insertar vía SQL directo si el cliente Prisma no expone el modelo
      try {
        const insertSql = `INSERT INTO producto_imagenes (producto_id, url, es_principal, orden) VALUES (?, ?, ?, ?)`;
        await prisma.$executeRawUnsafe(insertSql, String(productoId), String(url), es_principal ? 1 : 0, Number(orden));
        const [row] = await prisma.$queryRawUnsafe('SELECT * FROM producto_imagenes WHERE id = LAST_INSERT_ID()');
        created = row || null;
      } catch (sqlErr) {
        console.error('SQL fallback error:', sqlErr);
        // Si la tabla no existe, intentar crearla (migración ligera) y reintentar
        try {
          if (sqlErr && sqlErr.meta && sqlErr.meta.code === '1146' || (sqlErr && sqlErr.message && sqlErr.message.includes("doesn't exist"))) {
            const createSql = `CREATE TABLE IF NOT EXISTS producto_imagenes (
              id INT AUTO_INCREMENT PRIMARY KEY,
              producto_id VARCHAR(50),
              url VARCHAR(500),
              es_principal TINYINT(1) DEFAULT 0,
              orden INT DEFAULT 0,
              INDEX(producto_id)
            ) ENGINE=InnoDB;`;
            await prisma.$executeRawUnsafe(createSql);
            // reintentar inserción
            const insertSql2 = `INSERT INTO producto_imagenes (producto_id, url, es_principal, orden) VALUES (?, ?, ?, ?)`;
            await prisma.$executeRawUnsafe(insertSql2, String(productoId), String(url), es_principal ? 1 : 0, Number(orden));
            const [row2] = await prisma.$queryRawUnsafe('SELECT * FROM producto_imagenes WHERE id = LAST_INSERT_ID()');
            created = row2 || null;
          } else {
            throw sqlErr;
          }
        } catch (innerErr) {
          console.error('SQL fallback create/retry error:', innerErr);
          throw innerErr;
        }
      }
    }

    res.json({ success: true, message: 'Imagen subida', imagen: created });
  } catch (error) {
    console.error('UPLOAD IMG ERROR:', error);
    res.status(500).json({ success: false, message: 'Error subiendo imagen de producto' });
  }
}

// Listar imágenes de un producto (admin)
async function getProductoImagenes(req, res) {
  try {
    const productoId = req.params.id || req.query.id;
    if (!productoId) return res.status(400).json({ success: false, message: 'ID de producto requerido' });
    let imgs = [];
    if (prisma.producto_imagenes && typeof prisma.producto_imagenes.findMany === 'function') {
      imgs = await prisma.producto_imagenes.findMany({ where: { producto_id: String(productoId) }, orderBy: { orden: 'asc' } });
    } else {
      imgs = await prisma.$queryRawUnsafe('SELECT * FROM producto_imagenes WHERE producto_id = ? ORDER BY orden ASC', String(productoId));
    }

    // Si la variante actual no tiene imágenes, buscar imágenes de otras variantes del mismo modelo/marca
    if ((!imgs || imgs.length === 0) && prisma.productos) {
      const producto = await prisma.productos.findUnique({ where: { id: String(productoId) } });
      if (producto && producto.marca && producto.modelo) {
        const groupProducts = await prisma.productos.findMany({ where: { marca: producto.marca, modelo: producto.modelo } });
        const groupIds = groupProducts.map(prod => prod.id).filter(Boolean);
        if (groupIds.length) {
          if (prisma.producto_imagenes && typeof prisma.producto_imagenes.findMany === 'function') {
            imgs = await prisma.producto_imagenes.findMany({ where: { producto_id: { in: groupIds } }, orderBy: { orden: 'asc' } });
          } else {
            const safeList = groupIds.map(id => String(id).replace(/'/g, "''")).map(id => `'${id}'`).join(',');
            imgs = await prisma.$queryRawUnsafe(`SELECT * FROM producto_imagenes WHERE producto_id IN (${safeList}) ORDER BY orden ASC`);
          }
        }
      }
    }

    res.json(imgs || []);
  } catch (error) {
    console.error('GET IMAGES ERROR:', error);
    res.status(500).json({ success: false, message: 'Error al listar imágenes' });
  }
}

// Eliminar imagen de producto (admin)
async function deleteProductoImagen(req, res) {
  try {
    const productoId = req.params.id || req.query.id;
    const imgId = Number(req.params.imgId || req.query.imgId);
    if (!productoId || !imgId) return res.status(400).json({ success: false, message: 'Producto e imagen requeridos' });
    
    let img = null;
    try {
      // Usar SQL directo siempre para garantizar que funcione
      const rows = await prisma.$queryRawUnsafe('SELECT * FROM producto_imagenes WHERE id = ? LIMIT 1', Number(imgId));
      img = (rows && rows.length) ? rows[0] : null;
    } catch (e) {
      console.error('[IMG_QUERY_ERROR]:', e);
    }
    
    if (!img) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    
    // Borrar fichero físico en la carpeta de subida persistente o en la ruta legacy de tienda/img
    try {
      let filePath = null;
      if (img.url && img.url.startsWith('/uploads/')) {
        const filename = img.url.replace('/uploads/', '');
        filePath = path.join(__dirname, '..', '..', 'uploads', filename);
      } else if (img.url && img.url.startsWith('/tienda/img/')) {
        const filename = img.url.replace('/tienda/img/', '');
        filePath = path.join(__dirname, '..', '..', 'public', 'tienda', 'img', filename);
      }

      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[FS] Imagen eliminada: ${filePath}`);
      }
    } catch (fsErr) {
      console.warn(`[FS_WARN] Error al borrar archivo físico de ${imgId}:`, fsErr.message);
    }
    
    // Eliminar registro de BD - usar SQL directo siempre
    try {
      await prisma.$executeRawUnsafe('DELETE FROM producto_imagenes WHERE id = ?', Number(imgId));
      console.log(`[DB] Imagen ${imgId} eliminada de BD`);
    } catch (delErr) {
      console.error('[DB_DELETE_ERROR]:', delErr);
      return res.status(500).json({ success: false, message: `Error al eliminar imagen de BD: ${delErr.message}` });
    }
    
    res.json({ success: true, message: 'Imagen eliminada correctamente' });
  } catch (error) {
    console.error('[DELETE_IMG_ERROR]:', error);
    res.status(500).json({ success: false, message: `Error al eliminar imagen: ${error.message}` });
  }
}

// Marcar imagen como principal (admin)
async function setPrincipalImagen(req, res) {
  try {
    const productoId = req.params.id || req.query.id;
    const imgId = Number(req.params.imgId || req.query.imgId);
    if (!productoId || !imgId) return res.status(400).json({ success: false, message: 'Producto e imagen requeridos' });
    // desmarcar otras
    if (prisma.producto_imagenes && typeof prisma.producto_imagenes.updateMany === 'function') {
      await prisma.producto_imagenes.updateMany({ where: { producto_id: String(productoId), es_principal: true }, data: { es_principal: false } });
      // marcar seleccionada
      await prisma.producto_imagenes.update({ where: { id: imgId }, data: { es_principal: true } });
    } else {
      await prisma.$executeRawUnsafe('UPDATE producto_imagenes SET es_principal = 0 WHERE producto_id = ?', String(productoId));
      await prisma.$executeRawUnsafe('UPDATE producto_imagenes SET es_principal = 1 WHERE id = ?', Number(imgId));
    }
    res.json({ success: true, message: 'Imagen marcada como principal' });
  } catch (error) {
    console.error('SET PRINCIPAL ERROR:', error);
    res.status(500).json({ success: false, message: 'Error marcando imagen principal' });
  }
}

async function getUsuarios(req, res) {
  try {
    const { id } = req.query;
    if (id) {
      const user = await prisma.usuarios.findUnique({
        where: { id: Number(id) },
        select: { id: true, username: true, email: true, role: true, verified: true }
      });
      return res.json(user || {});
    }

    const users = await prisma.usuarios.findMany({
      select: { id: true, username: true, email: true, role: true, verified: true }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar usuarios' });
  }
}

async function getClientes(req, res) {
  try {
    const { id, email } = req.query;
    if (id || email) {
      const where = id ? { id: Number(id) } : { email: String(email) };
      const cliente = await prisma.clientes.findFirst({ where, include: { direcciones: true } });
      return res.json(cliente || {});
    }
    const clientes = await prisma.clientes.findMany({ include: { direcciones: true }, orderBy: { fecha_registro: 'desc' } });
    res.json(clientes);
  } catch (error) {
    console.error('GET CLIENTES ERROR:', error);
    res.status(500).json({ success: false, message: 'Error al listar clientes' });
  }
}

async function updateCliente(req, res) {
  try {
    const { id, email, nombres, apellidos, telefono, provincia, ciudad, direccion_exacta, es_predeterminada } = req.body;
    if (!id && !email) return res.status(400).json({ success: false, message: 'Se requiere id o email del cliente' });
    const where = id ? { id: Number(id) } : { email: String(email) };
    const cliente = await prisma.clientes.findFirst({ where });
    if (!cliente) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    const clienteData = {};
    if (nombres !== undefined) clienteData.nombres = String(nombres);
    if (apellidos !== undefined) clienteData.apellidos = String(apellidos);
    if (telefono !== undefined) clienteData.telefono = String(telefono);

    if (Object.keys(clienteData).length) {
      await prisma.clientes.update({ where: { id: cliente.id }, data: clienteData });
    }

    // manejar dirección
    if (provincia || ciudad || direccion_exacta) {
      const existing = await prisma.direcciones.findFirst({ where: { cliente_id: cliente.id, es_predeterminada: true } });
      if (existing) {
        await prisma.direcciones.update({ where: { id: existing.id }, data: { provincia: provincia || existing.provincia, ciudad: ciudad || existing.ciudad, direccion_exacta: direccion_exacta || existing.direccion_exacta, telefono: telefono || existing.telefono } });
      } else {
        await prisma.direcciones.create({ data: { cliente_id: cliente.id, nombre: `${nombres || cliente.nombres || ''} ${apellidos || cliente.apellidos || ''}`.trim() || '', telefono: telefono || '', provincia: provincia || '', ciudad: ciudad || '', direccion_exacta: direccion_exacta || '', es_predeterminada: !!es_predeterminada } });
      }
    }

    res.json({ success: true, message: 'Cliente actualizado' });
  } catch (error) {
    console.error('UPDATE CLIENTE ERROR:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
  }
}

async function deleteCliente(req, res) {
  const { id, email } = req.query;
  if (!id && !email) {
    return res.status(400).json({ success: false, message: 'ID o Email de cliente requerido' });
  }

  try {
    // Buscamos al cliente primero para obtener su ID real
    const where = id ? { id: Number(id) } : { email: String(email) };
    const cliente = await prisma.clientes.findFirst({ where });

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    // Primero eliminamos las direcciones asociadas para evitar errores de integridad referencial
    await prisma.direcciones.deleteMany({ where: { cliente_id: cliente.id } });
    
    await prisma.clientes.delete({ where: { id: cliente.id } });
    res.json({ success: true, message: 'Cliente y sus direcciones eliminados correctamente' });
  } catch (error) {
    console.error('DELETE CLIENTE ERROR:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el cliente' });
  }
}

async function createUsuario(req, res) {
  const { username, email, password, role, verified } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  }

  try {
    const normalizedRole = normalizeRole(role);
    const hashedPassword = await require('bcryptjs').hash(password, 10);
    const created = await prisma.usuarios.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: normalizedRole,
        verified: !!verified
      }
    });

    let verificationToken = null;
    if (!verified) {
      verificationToken = jwt.sign(
        {
          id: created.id,
          username: created.username,
          email: created.email,
          type: 'email_verification'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.usuarios.update({
        where: { id: created.id },
        data: {
          verification_token: verificationToken,
          verification_token_expiry: expiry
        }
      });

      try {
        await sgMail.send({
          from: EMAIL.from,
          to: created.email,
          subject: 'Tu token de verificación de Calzado Nica',
          text: `Tu token de verificación es: ${verificationToken}`,
          html: `<p>Tu token de verificación es:</p><pre style="font-family: monospace; background:#f4f4f4; padding:10px; border-radius:6px; overflow-x:auto;">${verificationToken}</pre>`
        });
      } catch (mailError) {
        console.error('MAIL ERROR (createUsuario):', mailError);
        return res.status(500).json({ success: false, message: 'Usuario creado, pero no se pudo enviar el correo de verificación.' });
      }
    }

    res.json({ success: true, message: 'Usuario creado', id: created.id, verificationToken });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'El usuario o el email ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
}

async function updateUsuario(req, res) {
  const { id, username, email, password, role, verified } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido' });
  }

  const data = {};
  if (username) data.username = username;
  if (email) data.email = email;
  if (role) data.role = normalizeRole(role);
  if (typeof verified !== 'undefined') data.verified = !!verified;
  if (password) data.password = await require('bcryptjs').hash(password, 10);

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar' });
  }

  try {
    if (typeof verified !== 'undefined') {
      if (data.verified) {
        data.verification_token = null;
        data.verification_token_expiry = null;
      } else {
        const existingUser = await prisma.usuarios.findUnique({ where: { id: Number(id) } });
        if (existingUser && !existingUser.verification_token && existingUser.email) {
          const newToken = jwt.sign(
            {
              id: Number(id),
              username: username || existingUser.username,
              email: existingUser.email,
              type: 'email_verification'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          data.verification_token = newToken;
          data.verification_token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
      }
    }

    await prisma.usuarios.update({
      where: { id: Number(id) },
      data
    });
    res.json({ success: true, message: 'Usuario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
}

async function deleteUsuario(req, res) {
  const id = req.query.id ? Number(req.query.id) : null;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido' });
  }

  try {
    await prisma.usuarios.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
  }
}

async function getEmpleados(req, res) {
  try {
    const { id } = req.query;
    if (id) {
      const empleado = await prisma.empleados.findUnique({
        where: { id: String(id) }
      });
      if (!empleado) return res.json({});
      return res.json({
        ...empleado,
        sueldo_base: empleado.sueldo,
        fecha_nacimiento: empleado.nacimiento
      });
    }

    const empleados = await prisma.empleados.findMany();
    const mapped = empleados.map(emp => ({
      ...emp,
      sueldo_base: emp.sueldo,
      fecha_nacimiento: emp.nacimiento
    }));
    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar empleados' });
  }
}

async function createEmpleado(req, res) {
  const {
    id,
    nombres,
    apellidos,
    sueldo_base,
    fecha_nacimiento,
    cedula,
    sexo,
    estado_civil,
    telefono,
    direccion,
    cargo
  } = req.body;

  if (!id || !nombres || !apellidos || !sueldo_base || !fecha_nacimiento || !cedula || !sexo || !estado_civil || !telefono || !direccion || !cargo) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear empleado' });
  }

  try {
    const empleado = await prisma.empleados.create({
      data: {
        id: String(id),
        nombres: String(nombres),
        apellidos: String(apellidos),
        sueldo: Number(sueldo_base),
        nacimiento: new Date(fecha_nacimiento),
        cedula: String(cedula),
        sexo: String(sexo),
        estado_civil: String(estado_civil),
        telefono: String(telefono),
        direccion: String(direccion),
        cargo: String(cargo)
      }
    });
    res.json({ success: true, message: 'Empleado creado', id: empleado.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear empleado' });
  }
}

async function updateEmpleado(req, res) {
  const {
    id,
    nombres,
    apellidos,
    sueldo_base,
    fecha_nacimiento,
    cedula,
    sexo,
    estado_civil,
    telefono,
    direccion,
    cargo
  } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para actualizar empleado' });
  }

  const data = {};
  if (nombres) data.nombres = String(nombres);
  if (apellidos) data.apellidos = String(apellidos);
  if (sueldo_base) data.sueldo = Number(sueldo_base);
  if (fecha_nacimiento) data.nacimiento = new Date(fecha_nacimiento);
  if (cedula) data.cedula = String(cedula);
  if (sexo) data.sexo = String(sexo);
  if (estado_civil) data.estado_civil = String(estado_civil);
  if (telefono) data.telefono = String(telefono);
  if (direccion) data.direccion = String(direccion);
  if (cargo) data.cargo = String(cargo);

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar' });
  }

  try {
    await prisma.empleados.update({
      where: { id: String(id) },
      data
    });
    res.json({ success: true, message: 'Empleado actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar empleado' });
  }
}

async function deleteEmpleado(req, res) {
  const id = req.query.id ? String(req.query.id) : null;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para eliminar empleado' });
  }

  try {
    await prisma.empleados.delete({ where: { id } });
    res.json({ success: true, message: 'Empleado eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar empleado' });
  }
}

async function getCategorias(req, res) {
  try {
    const { id } = req.query;
    if (id) {
      const categoria = await prisma.categorias.findUnique({ where: { id: String(id) } });
      return res.json(categoria || {});
    }
    const categorias = await prisma.categorias.findMany();
    res.json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar categorías' });
  }
}

async function createCategoria(req, res) {
  const { id, nombre, descripcion } = req.body;
  if (!id || !nombre) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear categoría' });
  }

  try {
    const categoria = await prisma.categorias.create({
      data: { id: String(id), nombre: String(nombre), descripcion: descripcion || null }
    });
    res.json({ success: true, message: 'Categoría creada', id: categoria.id });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'El nombre de categoría ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear categoría' });
  }
}

async function updateCategoria(req, res) {
  const { id, nombre, descripcion } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para actualizar categoría' });
  }

  const data = {};
  if (nombre) data.nombre = String(nombre);
  if (descripcion !== undefined) data.descripcion = descripcion || null;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar' });
  }

  try {
    await prisma.categorias.update({ where: { id: String(id) }, data });
    res.json({ success: true, message: 'Categoría actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar categoría' });
  }
}

async function deleteCategoria(req, res) {
  const id = req.query.id ? String(req.query.id) : null;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para eliminar categoría' });
  }

  try {
    await prisma.categorias.delete({ where: { id } });
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar categoría' });
  }
}

async function getEstilos(req, res) {
  try {
    const { id } = req.query;
    if (id) {
      const estilo = await prisma.estilos.findUnique({ where: { id: String(id) } });
      return res.json(estilo || {});
    }
    const estilos = await prisma.estilos.findMany();
    res.json(estilos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar estilos' });
  }
}

async function createEstilo(req, res) {
  const { id, nombre, descripcion } = req.body;
  if (!id || !nombre) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear estilo' });
  }

  try {
    const estilo = await prisma.estilos.create({
      data: { id: String(id), nombre: String(nombre), descripcion: descripcion || null }
    });
    res.json({ success: true, message: 'Estilo creado', id: estilo.id });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'El nombre de estilo ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear estilo' });
  }
}

async function updateEstilo(req, res) {
  const { id, nombre, descripcion } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para actualizar estilo' });
  }

  const data = {};
  if (nombre) data.nombre = String(nombre);
  if (descripcion !== undefined) data.descripcion = descripcion || null;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar' });
  }

  try {
    await prisma.estilos.update({ where: { id: String(id) }, data });
    res.json({ success: true, message: 'Estilo actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar estilo' });
  }
}

async function deleteEstilo(req, res) {
  const id = req.query.id ? String(req.query.id) : null;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para eliminar estilo' });
  }

  try {
    await prisma.estilos.delete({ where: { id } });
    res.json({ success: true, message: 'Estilo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar estilo' });
  }
}

async function getProductos(req, res) {
  try {
    const { id } = req.query;
    
    // Cargar datos base con manejo de errores para diagnosticar fallos de tabla
    let productos, categorias, estilos;
    try {
      [productos, categorias, estilos] = await Promise.all([
        prisma.productos.findMany(),
        prisma.categorias.findMany(),
        prisma.estilos.findMany()
      ]);
    } catch (dbErr) {
      console.error('[ERROR_DB] No se pudieron cargar las tablas base:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Error de base de datos: asegúrate de haber sincronizado el esquema (npx prisma db push).' });
    }

    // Cargar imágenes con manejo de errores para evitar 500 si la tabla no existe en la DB
    const productIds = productos.map(p => p.id);
    let imagenes = [];
    try {
      if (productIds.length && prisma.producto_imagenes && typeof prisma.producto_imagenes.findMany === 'function') {
        imagenes = await prisma.producto_imagenes.findMany({ where: { producto_id: { in: productIds } } });
      } else if (productIds.length) {
        // Fallback: consultar directamente la tabla producto_imagenes si el modelo no está expuesto
        const safeList = productIds.map(id => String(id).replace(/'/g, "''")).map(id => `'${id}'`).join(',');
        imagenes = await prisma.$queryRawUnsafe(`SELECT * FROM producto_imagenes WHERE producto_id IN (${safeList})`);
      }
    } catch (imgErr) {
      console.warn('[WARN] No se pudieron cargar las imágenes de los productos:', imgErr.message);
      // Si falla la consulta de imágenes, continuamos con una lista vacía para no romper el request
    }

    const imagenMap = new Map();
    const safeImagenes = Array.isArray(imagenes) ? imagenes : [];
    for (const img of safeImagenes) {
      if (!imagenMap.has(img.producto_id)) imagenMap.set(img.producto_id, []);
      imagenMap.get(img.producto_id).push(img);
    }
    const categoriaMap = new Map(categorias.map(cat => [cat.id, cat.nombre]));
    const estiloMap = new Map(estilos.map(est => [est.id, est.nombre]));

    const mapProducto = prod => {
      // Filtramos para ignorar CUALQUIER registro de 'sin-imagen.svg'
      const prodImgs = (imagenMap.get(prod.id) || []).filter(img => img && img.url && !img.url.toLowerCase().endsWith('sin-imagen.svg'));
      
      // Fallback: Si no hay imágenes en la galería, usar el campo de la tabla (si no es placeholder)
      const tableFallback = (prod.imagen_principal && !prod.imagen_principal.toLowerCase().endsWith('sin-imagen.svg')) 
        ? prod.imagen_principal 
        : '/tienda/img/sin-imagen.svg';

      return {
        ...prod,
        precio: prod.precio ? Number(prod.precio) : 0,
        stock: prod.stock ? Number(prod.stock) : 0,
        categoria_nombre: prod.categoria_id ? categoriaMap.get(prod.categoria_id) || '' : '',
        estilo_nombre: prod.estilo_id ? estiloMap.get(prod.estilo_id) || '' : '',
        imagen_principal: prodImgs.length > 0
          ? (prodImgs.find(im => im.es_principal) || prodImgs[0]).url
          : tableFallback
      };
    };

    const mapped = productos.map(mapProducto);

    // --- LÓGICA DE AGRUPACIÓN MAESTRA (Marca + Modelo) ---
    const grouped = new Map();
    mapped.forEach(p => {
      // Limpiamos y normalizamos para evitar que espacios o nulos agrupen productos distintos
      const marca = String(p.marca || 'Genérico').trim().toLowerCase();
      const modelo = String(p.modelo || 'Sin Modelo').trim().toLowerCase();
      const key = `${marca}|${modelo}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...p,
          tallas_array: [p.talla],
          colores_array: p.color ? [p.color] : [],
          stock_total: Math.max(0, Number(p.stock || 0)),
          variantes: [{ id: p.id, talla: p.talla, color: p.color, stock: p.stock }]
        });
      } else {
        const group = grouped.get(key);
        if (!group.tallas_array.includes(p.talla)) group.tallas_array.push(p.talla);
        if (p.color && !group.colores_array.includes(p.color)) group.colores_array.push(p.color);
        
        // Forzamos suma numérica para evitar que se concatenen como texto (el error del número gigante)
        group.stock_total += Math.max(0, Number(p.stock || 0));
        group.variantes.push({ id: p.id, talla: p.talla, color: p.color, stock: p.stock });
        
        // Si el grupo tiene imagen placeholder pero esta variante tiene una real, actualizarla
        if (group.imagen_principal.toLowerCase().endsWith('sin-imagen.svg') && !p.imagen_principal.toLowerCase().endsWith('sin-imagen.svg')) {
          group.imagen_principal = p.imagen_principal;
        }
      }
    });

    if (id) {
      const target = mapped.find(prod => prod.id === String(id));
      if (!target) return res.json({});
      
      const marcaKey = String(target.marca || 'Genérico').trim().toLowerCase();
      const modeloKey = String(target.modelo || 'Sin Modelo').trim().toLowerCase();
      const key = `${marcaKey}|${modeloKey}`;
      const groupData = grouped.get(key);

      // Retornamos la variante real pero le adjuntamos info de grupo como extras
      return res.json({
        ...target,
        stock_total: groupData ? groupData.stock_total : target.stock,
        variantes: groupData ? groupData.variantes : [],
        tallas_disponibles: groupData ? groupData.tallas_array : [target.talla],
        colores_disponibles: groupData ? groupData.colores_array : (target.color ? [target.color] : [])
      });
    }

    res.json(Array.from(grouped.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar productos' });
  }
}

function getVariantBaseId(productId) {
  if (!productId) return '';
  const parts = String(productId).trim().split('-');
  if (parts.length <= 3) return String(productId).trim().toUpperCase();
  return parts.slice(0, parts.length - 2).join('-').toUpperCase();
}

function createVariantId(baseId, color, talla) {
  const safeColor = String(color || 'SIN')
    .trim()
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const safeTalla = String(talla || '').trim().replace(/\s+/g, '');
  return String(`${baseId}-${safeColor}-${safeTalla}`).substring(0, 50);
}

function normalizeVariantInput(variant) {
  if (!variant) return null;
  const color = String(variant.color || '').trim();
  const talla = String(variant.talla || '').trim();
  if (!color || !talla) return null;
  const stock = variant.stock === undefined || variant.stock === null ? 0 : Number(variant.stock);
  return {
    id: variant.id ? String(variant.id).trim() : undefined,
    color,
    talla,
    stock: Number.isNaN(stock) ? 0 : stock
  };
}

async function createProducto(req, res) {
  const { id, marca, modelo, talla, color, precio, stock, categoria_id, estilo_id, variantes } = req.body;
  const variantRows = Array.isArray(variantes)
    ? variantes.map(normalizeVariantInput).filter(Boolean)
    : [];

  if (!id || !/^PROD-[A-Z]{2}-\d{3}$/i.test(String(id).trim())) {
    return res.status(400).json({ 
      success: false, 
      message: 'Formato de ID inválido. Debe ser: PROD-XX-### (ej: PROD-MA-002)' 
    });
  }

  const baseId = String(id).trim().toUpperCase();
  const listaTallas = variantRows.length === 0
    ? String(talla || '').split(/[,\/\;]+/).map(s => s.trim()).filter(Boolean)
    : [];
  const listaColores = variantRows.length === 0
    ? String(color || '').split(/[,\/\;]+/).map(s => s.trim()).filter(Boolean)
    : [];

  if (!marca || !modelo || (variantRows.length === 0 && (listaTallas.length === 0 || listaColores.length === 0))) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear producto' });
  }

  try {
    const creados = [];
    const variantsToCreate = variantRows.length > 0
      ? variantRows
      : listaColores.flatMap(c => listaTallas.map(t => ({ color: c, talla: t, stock: Number(stock) })));

    await prisma.$transaction(async (tx) => {
      for (const variant of variantsToCreate) {
        const finalId = createVariantId(baseId, variant.color, variant.talla);
        await tx.productos.create({
          data: {
            id: String(finalId),
            marca: String(marca),
            modelo: String(modelo),
            talla: String(variant.talla),
            color: String(variant.color),
            categoria_id: categoria_id ? String(categoria_id) : null,
            estilo_id: estilo_id ? String(estilo_id) : null,
            precio: Number(precio),
            stock: Number(variant.stock === undefined ? stock : variant.stock)
          }
        });
        creados.push(finalId);
      }
    });

    res.json({ success: true, message: `Matriz creada: ${creados.length} variantes generadas.`, ids: creados });
  } catch (error) {
    console.error('[CREATE_PRODUCTO_BATCH_ERROR]:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        message: 'Error: Algunos de estos registros ya existen (posible duplicidad de ID o talla).' 
      });
    }
    res.status(500).json({ success: false, message: 'Error al procesar el lote de productos.' });
  }
}

// --- UPDATE PRODUCTO ---
// MEJORADO: Cuando se edita un producto existente y se agregan nuevas tallas,
// crea registros nuevos para las tallas adicionales en lugar de fallar
async function updateProducto(req, res) {
  const { id, marca, modelo, talla, color, precio, stock, categoria_id, estilo_id, variantes } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para actualizar producto' });
  }

  try {
    const productoActual = await prisma.productos.findUnique({ where: { id: String(id) } });
    if (!productoActual) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const data = {};
    if (marca) data.marca = String(marca);
    if (modelo) data.modelo = String(modelo);
    if (precio !== undefined) data.precio = Number(precio);
    if (stock !== undefined) data.stock = Math.max(0, parseInt(stock) || 0);
    if (categoria_id !== undefined) data.categoria_id = categoria_id ? String(categoria_id) : null;
    if (estilo_id !== undefined) data.estilo_id = estilo_id ? String(estilo_id) : null;

    const variantRows = Array.isArray(variantes)
      ? variantes.map(normalizeVariantInput).filter(Boolean)
      : [];

    let mensajeExtra = '';
    let tallasNuevas = [];
    let variantesEliminadas = 0;

    if (variantRows.length > 0) {
      const groupMarca = String(marca || productoActual.marca);
      const groupModelo = String(modelo || productoActual.modelo);
      const productosExistentes = await prisma.productos.findMany({
        where: { marca: groupMarca, modelo: groupModelo },
        select: { id: true }
      });
      const existingIds = productosExistentes.map(p => p.id);
      const incomingIds = variantRows.filter(v => v.id).map(v => String(v.id));
      const idsToDelete = existingIds.filter(existingId => !incomingIds.includes(existingId));
      const baseId = getVariantBaseId(String(id));

      console.log('[UPDATE_PRODUCTO_DEBUG] Variantes recibidas:', {
        totalVariantes: variantRows.length,
        variantesConId: variantRows.filter(v => v.id).length,
        variantes: variantRows
      });

      if (Object.keys(data).length > 0) {
        await prisma.productos.updateMany({
          where: { marca: groupMarca, modelo: groupModelo },
          data
        });
      }

      for (const variant of variantRows) {
        console.log('[VARIANTE_PROCESSING]', { id: variant.id, color: variant.color, talla: variant.talla, existe: variant.id && existingIds.includes(variant.id) });
        
        if (variant.id && existingIds.includes(variant.id)) {
          // UPDATE EXISTENTE
          const updateData = {
            talla: variant.talla,
            color: variant.color,
            stock: variant.stock
          };
          if (Object.keys(data).length > 0) {
            updateData.marca = data.marca;
            updateData.modelo = data.modelo;
            if (data.precio !== undefined) updateData.precio = data.precio;
            if (data.categoria_id !== undefined) updateData.categoria_id = data.categoria_id;
            if (data.estilo_id !== undefined) updateData.estilo_id = data.estilo_id;
          }
          console.log('[UPDATE_VARIANTE]', variant.id);
          await prisma.productos.update({ where: { id: variant.id }, data: updateData });
        } else {
          // CREAR NUEVA VARIANTE
          const newId = createVariantId(baseId, variant.color, variant.talla);
          console.log('[CREATE_VARIANTE_INTENT]', { color: variant.color, talla: variant.talla, newId });
          
          try {
            // Verificar si el ID ya existe (por si acaso)
            const idExists = await prisma.productos.findUnique({ where: { id: newId } });
            if (idExists) {
              console.warn(`[VARIANTE_ID_CONFLICT] ID ${newId} ya existe, intentando alternativa...`);
              // Si el ID existe, intentar con un sufijo aleatorio
              const alternativeId = `${newId.substring(0, 45)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
              console.log('[ALTERNATIVA_ID]', alternativeId);
              
              await prisma.productos.create({
                data: {
                  id: alternativeId,
                  marca: String(marca || productoActual.marca),
                  modelo: String(modelo || productoActual.modelo),
                  talla: String(variant.talla),
                  color: String(variant.color),
                  categoria_id: categoria_id ? String(categoria_id) : (productoActual.categoria_id || null),
                  estilo_id: estilo_id ? String(estilo_id) : (productoActual.estilo_id || null),
                  precio: Number(precio !== undefined ? precio : productoActual.precio),
                  stock: Number(variant.stock)
                }
              });
            } else {
              await prisma.productos.create({
                data: {
                  id: newId,
                  marca: String(marca || productoActual.marca),
                  modelo: String(modelo || productoActual.modelo),
                  talla: String(variant.talla),
                  color: String(variant.color),
                  categoria_id: categoria_id ? String(categoria_id) : (productoActual.categoria_id || null),
                  estilo_id: estilo_id ? String(estilo_id) : (productoActual.estilo_id || null),
                  precio: Number(precio !== undefined ? precio : productoActual.precio),
                  stock: Number(variant.stock)
                }
              });
            }
            
            console.log('[CREATE_VARIANTE_OK]', newId);
            tallasNuevas.push(variant.talla);
          } catch (e) {
            console.error(`[ERROR_CREATE_VARIANTE] ${variant.color}-${variant.talla}:`, {
              errorCode: e.code,
              errorMessage: e.message,
              errorMeta: e.meta
            });
          }
        }
      }

      if (idsToDelete.length > 0) {
        await prisma.productos.deleteMany({ where: { id: { in: idsToDelete } } });
        variantesEliminadas = idsToDelete.length;
      }
      mensajeExtra = [];
      if (tallasNuevas.length > 0) {
        mensajeExtra.push(`${tallasNuevas.length} variante(s) añadida(s)`);
      }
      if (variantesEliminadas > 0) {
        mensajeExtra.push(`${variantesEliminadas} variante(s) eliminada(s)`);
      }
      mensajeExtra = mensajeExtra.length ? ` + ${mensajeExtra.join(', ')}` : '';
    } else {
      if (talla) {
        const listaTallasNuevas = String(talla || '').split(/[,\/\;]+/).map(s => s.trim()).filter(Boolean);

        const productosExistentes = await prisma.productos.findMany({
          where: {
            marca: String(marca || productoActual.marca),
            modelo: String(modelo || productoActual.modelo),
            color: String(color || productoActual.color || '')
          },
          select: { talla: true, id: true }
        });

        const tallasExistentes = productosExistentes.map(p => p.talla);
        const tallasFaltantes = listaTallasNuevas.filter(t => !tallasExistentes.includes(t));

        if (tallasFaltantes.length > 0) {
          const baseId = `${marca || productoActual.marca}-${color || productoActual.color || 'SIN'}`;
          const colorSlug = (color || productoActual.color || 'SIN').substring(0,3).toUpperCase();

          for (const t of tallasFaltantes) {
            const newId = `${baseId}-${colorSlug}-${t}`.substring(0, 50);
            try {
              await prisma.productos.create({
                data: {
                  id: newId,
                  marca: String(marca || productoActual.marca),
                  modelo: String(modelo || productoActual.modelo),
                  talla: String(t),
                  color: String(color || productoActual.color || ''),
                  categoria_id: categoria_id ? String(categoria_id) : (productoActual.categoria_id || null),
                  estilo_id: estilo_id ? String(estilo_id) : (productoActual.estilo_id || null),
                  precio: Number(precio !== undefined ? precio : productoActual.precio),
                  stock: Number(stock !== undefined ? stock : productoActual.stock)
                }
              });
              tallasNuevas.push(t);
            } catch (e) {
              console.warn(`[WARN] No se pudo crear talla ${t}:`, e.message);
            }
          }
        }

        if (tallasFaltantes.length > 0) {
          mensajeExtra = ` + ${tallasFaltantes.length} talla(s) nueva(s)`;
        }
      }

      if (Object.keys(data).length > 0) {
        await prisma.productos.update({ where: { id: String(id) }, data });
      }
    }

    res.json({ 
      success: true, 
      message: `Producto actualizado${mensajeExtra}`,
      tallasAgregadas: tallasNuevas,
      variantesEliminadas
    });
  } catch (error) {
    console.error('[UPDATE_PRODUCTO_ERROR]:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Error: duplicado detectado al guardar.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Producto no encontrado para actualizar.' });
    }
    res.status(500).json({ success: false, message: `Error al actualizar: ${error.message}` });
  }
}

async function deleteProducto(req, res) {
  const id = req.query.id ? String(req.query.id) : null;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para eliminar producto' });
  }

  try {
    console.log(`[DELETE_PRODUCTO] Iniciando eliminación de: ${id}`);
    
    // 1. Limpieza de imágenes - usar SQL directo siempre
    let imgDeleted = 0;
    try {
      const result = await prisma.$executeRawUnsafe(
        'DELETE FROM producto_imagenes WHERE producto_id = ?', 
        String(id)
      );
      imgDeleted = result || 0;
      console.log(`[DELETE_PRODUCTO] ${imgDeleted} imágenes eliminadas`);
    } catch (imgErr) {
      console.warn(`[WARN] Error al eliminar imágenes de ${id}:`, imgErr.message);
    }

    // 2. Intentar borrar producto
    try {
      await prisma.productos.delete({ where: { id: String(id) } });
      console.log(`[DELETE_PRODUCTO] Producto ${id} eliminado exitosamente`);
      return res.json({ 
        success: true, 
        message: `Producto eliminado (${imgDeleted} imágenes borradas)`
      });
    } catch (delErr) {
      console.error(`[DELETE_PRODUCTO_ERROR] No se pudo eliminar ${id}:`, delErr.code, delErr.message);
      
      // Error P2003: clave foránea - producto está en facturas/pedidos
      if (delErr.code === 'P2003') {
        return res.status(400).json({ 
          success: false, 
          message: 'No se puede eliminar: este producto está registrado en ventas/facturas. Usa stock = 0 para ocultarlo.'
        });
      }
      
      // Otros errores
      return res.status(500).json({ 
        success: false, 
        message: `Error al eliminar: ${delErr.message || 'Error desconocido'}`
      });
    }
  } catch (error) {
    console.error('[DELETE_PRODUCTO_OUTER_ERROR]:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error interno: ${error.message}` 
    });
  }
}

async function getCodigos(req, res) {
  try {
    const { id, codigo } = req.query;
    if (id) {
      const codigoDb = await prisma.codigos_promocionales.findUnique({ where: { id: String(id) } });
      if (!codigoDb) return res.json({});
      // validar fecha/estado igual que cuando se consulta por código
      const now = new Date();
      if (!codigoDb.estado) return res.json({ status: 'inactive', message: 'Código inactivo' });
      if (now < codigoDb.fecha_inicio) return res.json({ status: 'not_started', message: 'Código aún no válido' });
      if (now > codigoDb.fecha_fin) return res.json({ status: 'expired', message: 'Código vencido' });
      return res.json(codigoDb || {});
    }

    if (codigo) {
      const now = new Date();
      // primero buscar por código sin filtrar por fechas/estado para dar feedback preciso
      const raw = await prisma.codigos_promocionales.findFirst({ where: { codigo: String(codigo) } });
      if (!raw) return res.json({});
      // si existe, comprobar estado/fechas
      if (!raw.estado) return res.json({ status: 'inactive', message: 'Código inactivo' });
      if (now < raw.fecha_inicio) return res.json({ status: 'not_started', message: 'Código aún no válido' });
      if (now > raw.fecha_fin) return res.json({ status: 'expired', message: 'Código vencido' });
      // válido
      return res.json(raw);
    }

    const codigos = await prisma.codigos_promocionales.findMany();
    res.json(codigos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar códigos promocionales' });
  }
}

async function createCodigo(req, res) {
  const { id, codigo, porcentaje_descuento, fecha_inicio, fecha_fin, estado, descripcion } = req.body;
  if (!codigo || porcentaje_descuento === undefined || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear código' });
  }

  const newId = id ? String(id) : String(codigo).substring(0, 20);

  try {
    const promocion = await prisma.codigos_promocionales.create({
      data: {
        id: newId,
        codigo: String(codigo),
        porcentaje_descuento: Number(porcentaje_descuento),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        estado: Boolean(Number(estado)),
        descripcion: descripcion || null
      }
    });
    res.json({ success: true, message: 'Código promocional creado', id: promocion.id });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'El código promocional ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear código promocional' });
  }
}

async function updateCodigo(req, res) {
  const { id, codigo, porcentaje_descuento, fecha_inicio, fecha_fin, estado, descripcion } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para actualizar código promocional' });
  }

  const data = {};
  if (codigo) data.codigo = String(codigo);
  if (porcentaje_descuento !== undefined) data.porcentaje_descuento = Number(porcentaje_descuento);
  if (fecha_inicio) data.fecha_inicio = new Date(fecha_inicio);
  if (fecha_fin) data.fecha_fin = new Date(fecha_fin);
  if (estado !== undefined) data.estado = Boolean(Number(estado));
  if (descripcion !== undefined) data.descripcion = descripcion || null;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar' });
  }

  try {
    await prisma.codigos_promocionales.update({ where: { id: String(id) }, data });
    res.json({ success: true, message: 'Código promocional actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar código promocional' });
  }
}

async function deleteCodigo(req, res) {
  const id = req.query.id ? String(req.query.id) : null;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para eliminar código promocional' });
  }

  try {
    await prisma.codigos_promocionales.delete({ where: { id } });
    res.json({ success: true, message: 'Código promocional eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar código promocional' });
  }
}

async function getFacturas(req, res) {
  try {
    const { id } = req.query;
    if (id) {
      const factura = await prisma.facturas.findUnique({
        where: { id: String(id) },
        include: { factura_items: true }
      });
      if (!factura) return res.json({});
      return res.json({
        ...factura,
        items: factura.factura_items.map(item => ({
          id: item.id_producto,
          nombre_producto: item.nombre_producto,
          precio_unitario: item.precio_unitario,
          cantidad: item.cantidad
        }))
      });
    }

    const facturas = await prisma.facturas.findMany({ orderBy: { fecha: 'desc' } });
    res.json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar facturas' });
  }
}

async function createFactura(req, res) {
  const { id, cliente, vendedor, items, subtotal, monto_descuento, iva, total, codigo_descuento } = req.body;
  if (!cliente || !vendedor || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear factura' });
  }

  try {
    // intentar resolver dirección del cliente si se trata de un cliente registrado
    let clienteDisplay = String(cliente);
    try {
      // cliente puede ser email o id; intentamos buscar en clientes por email
      let foundCliente = null;
      if (cliente && String(cliente).match(/^\d+$/)) {
        // si es numérico, buscar por id
        foundCliente = await prisma.clientes.findUnique({ where: { id: Number(cliente) } });
      }
      if (!foundCliente) {
        foundCliente = await prisma.clientes.findFirst({ where: { email: String(cliente) } });
      }
      if (foundCliente) {
        const dir = await prisma.direcciones.findFirst({ where: { cliente_id: foundCliente.id, es_predeterminada: true } });
        const name = `${foundCliente.nombres || ''} ${foundCliente.apellidos || ''}`.trim() || foundCliente.email;
        if (dir) {
          clienteDisplay = `${name} — ${dir.provincia || ''}, ${dir.ciudad || ''}, ${dir.direccion_exacta || ''}`;
        } else {
          clienteDisplay = name;
        }
      }
    } catch (lookupErr) { console.warn('No se pudo resolver dirección del cliente para la factura', lookupErr); }

    const productoIds = items.map(item => String(item.id));
    const productos = await prisma.productos.findMany({ where: { id: { in: productoIds } } });
    const productoMap = new Map(productos.map(p => [p.id, p]));

    for (const item of items) {
      const producto = productoMap.get(String(item.id));
      if (!producto) {
        return res.status(400).json({ success: false, message: `Producto no encontrado: ${item.id}` });
      }
      if (producto.stock < Number(item.cantidad)) {
        return res.status(400).json({ success: false, message: `Stock insuficiente para ${producto.marca} ${producto.modelo}` });
      }
    }

    // asegurar que existe un id válido para la factura (generar si el cliente no lo envía)
    const now = new Date();
    let facturaId = id ? String(id) : null;
    if (!facturaId) {
      // calcular correlativo del año actual: contar facturas con fecha en este año y sumar 1
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const startOfNextYear = new Date(year + 1, 0, 1);
      const countThisYear = await prisma.facturas.count({ where: { fecha: { gte: startOfYear, lt: startOfNextYear } } });
      const seq = countThisYear + 1;
      const yy = String(year).slice(-2);
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      facturaId = `FACT${String(seq).padStart(3, '0')}-${yy}${MM}${dd}-${hh}${min}`;
    }

    const factura = await prisma.$transaction(async tx => {
      await Promise.all(items.map(item => {
        const producto = productoMap.get(String(item.id));
        return tx.productos.update({
          where: { id: producto.id },
          data: { stock: producto.stock - Number(item.cantidad) }
        });
      }));

      const createdFactura = await tx.facturas.create({
        data: {
          id: facturaId,
          cliente: clienteDisplay,
          vendedor: String(vendedor),
          fecha: new Date(),
          subtotal: Number(subtotal),
          monto_descuento: Number(monto_descuento) || 0,
          iva: Number(iva) || 0,
          total: Number(total),
          codigo_descuento: codigo_descuento ? String(codigo_descuento) : null
        }
      });

      await Promise.all(items.map(item => tx.factura_items.create({
        data: {
          id_factura: createdFactura.id,
          id_producto: String(item.id),
          nombre_producto: String(item.nombre),
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio)
        }
      })));

      return createdFactura;
    });

    res.json({ success: true, message: 'Factura registrada', id: factura.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al registrar factura' });
  }
}

async function deleteFactura(req, res) {
  const id = req.query.id ? String(req.query.id) : null;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para eliminar factura' });
  }

  try {
    await prisma.facturas.delete({ where: { id } });
    res.json({ success: true, message: 'Factura eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar factura' });
  }
}

async function getStats(req, res) {
  try {
    const [
      productosCount,
      empleadosCount,
      categoriasCount,
      estilosCount,
      ventasCount,
      ventasTotalResult,
      ventasParesResult
    ] = await Promise.all([
      prisma.productos.count(),
      prisma.empleados.count(),
      prisma.categorias.count(),
      prisma.estilos.count(),
      prisma.facturas.count(),
      prisma.facturas.aggregate({ _sum: { total: true } }),
      prisma.factura_items.aggregate({ _sum: { cantidad: true } })
    ]);

    res.json({
      productos: productosCount,
      empleados: empleadosCount,
      categorias: categoriasCount,
      estilos: estilosCount,
      ventas: ventasCount,
      ventas_pares: ventasParesResult._sum.cantidad || 0,
      ventas_total: Number(ventasTotalResult._sum.total || 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
}

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getEstilos,
  createEstilo,
  updateEstilo,
  deleteEstilo,
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  uploadProductoImagen,
  getProductoImagenes,
  deleteProductoImagen,
  setPrincipalImagen,
  getCodigos,
  createCodigo,
  updateCodigo,
  deleteCodigo,
  getFacturas,
  createFactura,
  deleteFactura,
  getStats,
  getClientes,
  updateCliente,
  deleteCliente
};
