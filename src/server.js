const app = require('./app');
const { PORT, HOST } = require('./config');

app.listen(PORT, HOST, () => console.log(`API: escuchando en http://${HOST}:${PORT}`));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
