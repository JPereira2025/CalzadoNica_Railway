/**
 * ARCHIVO: server.js
 * DESCRIPCIÓN: Punto de entrada principal para el servidor Node.js.
 * FUNCIONALIDAD: Carga la configuración, inicializa la app de Express
 * y escucha en el puerto definido.
 */

require('dotenv').config();
const app = require('./app'); // app.js contiene la configuración de express y rutas
const { PORT, HOST } = require('./config');

/**
 * Inicialización del Servidor
 * Sigue el patrón de separación de preocupaciones (SOC)
 */
const server = app.listen(PORT, HOST, () => {
  console.log(`[SERVER] Calzado Nica API corriendo en http://${HOST}:${PORT}`);
});

// Gestión de errores al arrancar el servidor (p. ej. puerto ocupado)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: el puerto ${PORT} ya está en uso. Cierra la aplicación que lo usa o configura otra variable PORT.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Captura de errores inesperados en el proceso
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
