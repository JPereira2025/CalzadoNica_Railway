const fs = require('fs');
const input = fs.readFileSync('dump_real.sql','utf8');
const match = input.match(/INSERT INTO `usuarios` \(`id`, `username`, `password`, `role`\) VALUES([\s\S]*?);/);
if(!match){ console.error('No se encontró INSERT de usuarios'); process.exit(1); }
const valuesBlock = match[1];
// split tuples
const tuples = valuesBlock.split(/\),\s*\(/).map(s=>s.replace(/^\(|\)$/g,'').trim()).filter(Boolean);
let out = 'SET FOREIGN_KEY_CHECKS=0;\n';
out += 'INSERT INTO usuarios (id, username, password, role, email, verified, verification_token, verification_token_expiry) VALUES\n';
out += tuples.map(t=>{
  // each t like: 1, 'admin', 'admin123', ''
  // we need to ensure proper quoting
  const parts = t.split(/,\s*/).map(p=>p.trim());
  const id = parts[0];
  const username = parts[1];
  const password = parts[2];
  const role = parts[3] && parts[3] !== "''" ? parts[3] : 'NULL';
  return `(${id}, ${username}, ${password}, ${role}, NULL, 0, NULL, NULL)`;
}).join(',\n');
out += ';\nSET FOREIGN_KEY_CHECKS=1;\n';
fs.writeFileSync('users_insert.sql', out, 'utf8');
console.log('users_insert.sql creado');
