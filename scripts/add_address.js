const { PrismaClient } = require('@prisma/client');
(async () => {
  try {
    const prisma = new PrismaClient();
    const args = process.argv.slice(2);
    if (args.length < 4) {
      console.error('Uso: node scripts/add_address.js <email> <provincia> <ciudad> <direccion_exacta>');
      process.exit(2);
    }
    const [email, provincia, ciudad, direccion_exacta] = args;
    const cliente = await prisma.clientes.findFirst({ where: { email } });
    if (!cliente) {
      console.error('Cliente no encontrado con email', email);
      process.exit(1);
    }
    // desmarcar otras direcciones predeterminadas
    await prisma.direcciones.updateMany({ where: { cliente_id: cliente.id }, data: { es_predeterminada: false } });
    const created = await prisma.direcciones.create({ data: { cliente_id: cliente.id, nombre: `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || cliente.email, telefono: cliente.telefono || '', provincia, ciudad, direccion_exacta, es_predeterminada: true } });
    console.log('Dirección creada:', created);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creando dirección:', err);
    process.exit(3);
  }
})();
