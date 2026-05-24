const prisma = require('../services/prismaService');
const { normalizeRole } = require('../utils/role');

async function getUsuarios(req, res) {
  try {
    const { id } = req.query;
    if (id) {
      const user = await prisma.usuarios.findUnique({
        where: { id: Number(id) },
        select: { id: true, username: true, role: true }
      });
      return res.json(user || {});
    }

    const users = await prisma.usuarios.findMany({
      select: { id: true, username: true, role: true }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar usuarios' });
  }
}

async function createUsuario(req, res) {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  }

  try {
    const normalizedRole = normalizeRole(role);
    const hashedPassword = await require('bcryptjs').hash(password, 10);
    const created = await prisma.usuarios.create({
      data: {
        username,
        password: hashedPassword,
        role: normalizedRole
      }
    });

    res.json({ success: true, message: 'Usuario creado', id: created.id });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'El usuario ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
}

async function updateUsuario(req, res) {
  const { id, username, password, role } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido' });
  }

  const data = {};
  if (username) data.username = username;
  if (role) data.role = normalizeRole(role);
  if (password) data.password = await require('bcryptjs').hash(password, 10);

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar' });
  }

  try {
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
    const [productos, categorias, estilos] = await Promise.all([
      prisma.productos.findMany(),
      prisma.categorias.findMany(),
      prisma.estilos.findMany()
    ]);
    const categoriaMap = new Map(categorias.map(cat => [cat.id, cat.nombre]));
    const estiloMap = new Map(estilos.map(est => [est.id, est.nombre]));

    const mapProducto = prod => ({
      ...prod,
      categoria_nombre: prod.categoria_id ? categoriaMap.get(prod.categoria_id) || '' : '',
      estilo_nombre: prod.estilo_id ? estiloMap.get(prod.estilo_id) || '' : ''
    });

    if (id) {
      const producto = productos.find(prod => prod.id === String(id));
      return res.json(producto ? mapProducto(producto) : {});
    }

    res.json(productos.map(mapProducto));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar productos' });
  }
}

async function createProducto(req, res) {
  const { id, marca, modelo, talla, color, precio, stock, categoria_id, estilo_id } = req.body;
  if (!id || !marca || !modelo || !talla || precio === undefined || stock === undefined) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear producto' });
  }

  try {
    const producto = await prisma.productos.create({
      data: {
        id: String(id),
        marca: String(marca),
        modelo: String(modelo),
        talla: String(talla),
        color: color ? String(color) : null,
        categoria_id: categoria_id ? String(categoria_id) : null,
        estilo_id: estilo_id ? String(estilo_id) : null,
        precio: Number(precio),
        stock: Number(stock)
      }
    });
    res.json({ success: true, message: 'Producto creado', id: producto.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
}

async function updateProducto(req, res) {
  const { id, marca, modelo, talla, color, precio, stock, categoria_id, estilo_id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para actualizar producto' });
  }

  const data = {};
  if (marca) data.marca = String(marca);
  if (modelo) data.modelo = String(modelo);
  if (talla) data.talla = String(talla);
  if (color !== undefined) data.color = color ? String(color) : null;
  if (precio !== undefined) data.precio = Number(precio);
  if (stock !== undefined) data.stock = Number(stock);
  if (categoria_id !== undefined) data.categoria_id = categoria_id ? String(categoria_id) : null;
  if (estilo_id !== undefined) data.estilo_id = estilo_id ? String(estilo_id) : null;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar' });
  }

  try {
    await prisma.productos.update({ where: { id: String(id) }, data });
    res.json({ success: true, message: 'Producto actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
}

async function deleteProducto(req, res) {
  const id = req.query.id ? String(req.query.id) : null;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID requerido para eliminar producto' });
  }

  try {
    await prisma.productos.delete({ where: { id } });
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
}

async function getCodigos(req, res) {
  try {
    const { id } = req.query;
    if (id) {
      const codigo = await prisma.codigos_promocionales.findUnique({ where: { id: String(id) } });
      return res.json(codigo || {});
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
  if (!id || !codigo || porcentaje_descuento === undefined || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear código' });
  }

  try {
    const promocion = await prisma.codigos_promocionales.create({
      data: {
        id: String(id),
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
  if (!id || !cliente || !vendedor || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos para crear factura' });
  }

  try {
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
          id: String(id),
          cliente: String(cliente),
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
  getCodigos,
  createCodigo,
  updateCodigo,
  deleteCodigo,
  getFacturas,
  createFactura,
  deleteFactura,
  getStats
};
