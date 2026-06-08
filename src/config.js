const dotenv = require('dotenv');

// Cargar archivo de entorno según ENV_PATH o NODE_ENV.
// Prioridad: ENV_PATH > .env.NODE_ENV > .env
const envPath = process.env.ENV_PATH || (process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  // fallback a .env si no existe el archivo específico
  if (envPath !== '.env') {
    dotenv.config();
    console.info(`[CONFIG] No se encontró ${envPath}, cargado .env por defecto`);
  } else {
    console.info('[CONFIG] No se encontró archivo .env; usando variables de entorno del sistema');
  }
} else {
  console.info(`[CONFIG] Variables cargadas desde: ${envPath}`);
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || '0.0.0.0'
  ,
  EMAIL: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'no-reply@example.com'
  }
};
