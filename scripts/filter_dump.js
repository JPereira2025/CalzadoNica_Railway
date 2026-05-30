const fs = require('fs');
const inPath = 'dump_real.sql';
const outPath = 'dump_filtered.sql';
const lines = fs.readFileSync(inPath, 'utf8').split(/\r?\n/);
let out = [];
let skipTable = false;
let skipAlter = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^--\s*Estructura de tabla para la tabla `usuarios`/.test(line)) { skipTable = true; continue; }
  if (skipTable) {
    if (/^\)\s*ENGINE=.*;/.test(line)) { skipTable = false; continue; }
    continue;
  }
  if (/^ALTER TABLE `usuarios`/.test(line)) { skipAlter = true; continue; }
  if (skipAlter) {
    if (/;\s*$/.test(line)) { skipAlter = false; continue; }
    continue;
  }
  if (/^INSERT INTO `usuarios`/.test(line)) { continue; }
  out.push(line);
}
fs.writeFileSync(outPath, out.join('\n'), 'utf8');
console.log('dump_filtered.sql creado');
