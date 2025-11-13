const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindPostcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

const inputPath = path.resolve(__dirname, 'src/css/tailwind.css');
const outputPath = path.resolve(__dirname, 'dist/css/tailwind.css');

async function build() {
  try {
    const input = fs.readFileSync(inputPath, 'utf8');
    const result = await postcss([
      tailwindPostcss({ config: path.resolve(__dirname, 'tailwind.config.js') }),
      autoprefixer()
    ]).process(input, {
      from: inputPath,
      to: outputPath,
      map: false
    });
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, result.css, 'utf8');
    console.log('tailwind: CSS generado ->', outputPath);
  } catch (err) {
    console.error('tailwind: Error al generar CSS:', err);
    process.exit(1);
  }
}

build();