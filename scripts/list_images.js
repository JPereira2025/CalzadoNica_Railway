const prisma = require('../src/services/prismaService');
(async () => {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT id, producto_id, url, es_principal, orden FROM producto_imagenes ORDER BY id DESC');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERROR LIST IMAGES:', e.message || e);
    process.exit(1);
  }
})();
