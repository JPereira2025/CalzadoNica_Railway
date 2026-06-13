#!/usr/bin/env node
/**
 * Script para limpiar imágenes de productos subidas
 * Uso: npm run clean:images
 *
 * Elimina solo archivos no rastreados por git en /public/tienda/img/ y /tienda/img/,
 * dejando archivos esenciales rastreados como los logos del proyecto.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imagesDirs = [
  path.join(__dirname, '..', 'public', 'tienda', 'img'),
  path.join(__dirname, '..', 'tienda', 'img')
];

function getUntrackedFiles(dirPath) {
  try {
    const result = execSync(`git ls-files --others --exclude-standard -- "${dirPath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return result
      .split(/\r?\n/)
      .filter(Boolean)
      .map(filePath => path.basename(filePath));
  } catch (err) {
    console.warn(`⚠️  No se pudo obtener archivos no rastreados para ${dirPath}: ${err.message}`);
    return [];
  }
}

function cleanDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️  Directorio no existe: ${dirPath}`);
      return 0;
    }

    const untrackedFiles = new Set(getUntrackedFiles(dirPath));
    const files = fs.readdirSync(dirPath);
    let count = 0;

    files.forEach(file => {
      if (file === 'sin-imagen.svg' || file === '.gitkeep') {
        return;
      }
      if (!untrackedFiles.has(file)) {
        return;
      }

      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Eliminado (no rastreado): ${file}`);
        count++;
      }
    });

    return count;
  } catch (err) {
    console.error(`❌ Error limpiando ${dirPath}:`, err.message);
    return 0;
  }
}

console.log('🧹 Limpiando imágenes no rastreadas de productos...\n');

let totalDeleted = 0;
imagesDirs.forEach(dir => {
  const deleted = cleanDir(dir);
  totalDeleted += deleted;
});

console.log(`\n✅ Proceso completado: ${totalDeleted} archivos eliminados`);
