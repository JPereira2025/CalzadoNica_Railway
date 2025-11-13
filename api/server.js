const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// GET empleados
app.get('/api/empleados', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM empleados ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar empleados' });
  }
});

// POST empleado (ejemplo)
app.post('/api/empleados', async (req, res) => {
  try {
    const { nombres, apellidos, sueldo, nacimiento, cedula, sexo, estado_civil, telefono, direccion, cargo } = req.body;
    const [result] = await pool.query(
      `INSERT INTO empleados (nombres, apellidos, sueldo, nacimiento, cedula, sexo, estado_civil, telefono, direccion, cargo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombres, apellidos, sueldo, nacimiento, cedula, sexo, estado_civil, telefono, direccion, cargo]
    );
    res.json({ insertId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar empleado' });
  }
});

// otros endpoints...

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`API: escuchando en http://${HOST}:${PORT}`));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});