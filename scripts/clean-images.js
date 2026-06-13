#!/usr/bin/env node
/**
 * Script para limpiar imágenes de productos subidas
 * Uso: node scripts/clean-images.js
 * 
 * Elimina todas las imágenes de /public/tienda/img/ y /tienda/img/
 * excepto sin-imagen.svg
 */

const fs = require('fs');
const path = require('path');

const imagesDirs = [
  path.join(__dirname, '..', 'public', 'tienda', 'img'),
  path.join(__dirname, '..', 'tienda', 'img')
];

function cleanDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️  Directorio no existe: ${dirPath}`);
      return 0;
    }

    const files = fs.readdirSync(dirPath);
    let count = 0;

    files.forEach(file => {
      if (file === 'sin-imagen.svg' || file === '.gitkeep') {
        return; // Saltar archivos protegidos
      }

      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Eliminado: ${file}`);
        count++;
      }
    });

    return count;
  } catch (err) {
    console.error(`❌ Error limpiando ${dirPath}:`, err.message);
    return 0;
  }
}

console.log('🧹 Limpiando imágenes de productos...\n');

let totalDeleted = 0;
imagesDirs.forEach(dir => {
  const deleted = cleanDir(dir);
  totalDeleted += deleted;
});

console.log(`\n✅ Proceso completado: ${totalDeleted} imágenes eliminadas`);
