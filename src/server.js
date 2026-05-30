require('dotenv').config();
const app = require('./app');
const { PORT, HOST } = require('./config');

const server = app.listen(PORT, HOST, () => {
  console.log(`API: escuchando en http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: el puerto ${PORT} ya está en uso. Cierra la aplicación que lo usa o configura otra variable PORT.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
