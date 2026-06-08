const dotenv = require('dotenv'); dotenv.config();
const prisma = require('../src/services/prismaService');
(async ()=>{
  try {
    const username = process.argv[2] || 'JPereira';
    const u = await prisma.usuarios.findUnique({ where: { username } });
    if(u) console.log(JSON.stringify(u, null, 2)); else console.log('NOT_FOUND');
  } catch (e) {
    console.error('ERROR', e);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
})();
