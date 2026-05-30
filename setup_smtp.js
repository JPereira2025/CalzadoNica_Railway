const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ingresa la contraseña de aplicación de Gmail: ', (pwd) => {
  const envContent = `EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=fufuruco@gmail.com
EMAIL_PASS=${pwd}
EMAIL_FROM=fufuruco@gmail.com
`;
  
  try {
    fs.writeFileSync('.env', envContent, { mode: 0o600 });
    console.log('✓ Archivo .env creado correctamente con credenciales SMTP');
  } catch (err) {
    console.error('✗ Error al crear .env:', err.message);
  }
  
  rl.close();
});
