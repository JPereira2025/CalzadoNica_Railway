require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      database: process.env.DB_NAME || 'calzado_nica'
    });

    const sql = `CREATE TABLE IF NOT EXISTS clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255) NOT NULL,
      nombres VARCHAR(100) NOT NULL,
      apellidos VARCHAR(100) NOT NULL,
      telefono VARCHAR(20),
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      verificado BOOLEAN DEFAULT FALSE,
      token_verificacion VARCHAR(500),
      token_expiry DATETIME
    ) ENGINE=InnoDB;`;

    await conn.query(sql);
    console.log('Tabla clientes creada o ya existía.');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Error creando tabla clientes:', err);
    process.exit(1);
  }
})();
