require('dotenv').config();
const prisma = require('../src/services/prismaService');
(async ()=>{
  try{
    const rows = await prisma.usuarios.findMany({ orderBy: { id: 'asc' } });
    console.log('TOTAL:', rows.length);
    rows.forEach(r=> console.log(JSON.stringify(r)));
  }catch(e){
    console.error('ERROR', e);
    process.exit(2);
  }finally{
    await prisma.$disconnect();
  }
})();
