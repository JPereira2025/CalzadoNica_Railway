const fs = require('fs');
const p = 'dump_filtered.sql';
const lines = fs.readFileSync(p,'utf8').split(/\r?\n/);
let out = [];
let skip=false;
for(let i=0;i<lines.length;i++){
  const l=lines[i];
  if(/--\s*Volcado de datos para la tabla `usuarios`/.test(l)){ skip=true; continue; }
  if(skip){ if(/--\s*Índices para tablas volcadas/.test(l) || /--\s*Índices para tablas volcadas/.test(l.replace(/\r/g,''))){ skip=false; out.push(l); continue; } else { continue; } }
  out.push(l);
}
fs.writeFileSync(p,out.join('\n'),'utf8');
console.log('Limpieza completada');
