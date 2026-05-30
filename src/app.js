const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta public (para /tienda/, css, js, img)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/', routes);

// Manejo de errores: intercepta JSON inválido y otros errores
app.use((err, req, res, next) => {
  // body-parser / express.json lanza SyntaxError para JSON mal formado
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('JSON inválido recibido:', err.message);
    return res.status(400).json({ success: false, error: 'JSON inválido' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
