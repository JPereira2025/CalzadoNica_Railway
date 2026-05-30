#!/usr/bin/env node
require('dotenv').config();
const prisma = require('../src/services/prismaService');
const bcrypt = require('bcryptjs');

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const username = String(argv.username || argv.u || 'admin@local').trim();
  const password = String(argv.password || argv.p || 'admin123');
  const email = String(argv.email || argv.e || username).trim();

  if (!username || !password) {
    console.error('Usage: node create_admin.js --username admin@example.com --password secret');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const existing = await prisma.usuarios.findUnique({ where: { username } });
    if (existing) {
      await prisma.usuarios.update({ where: { username }, data: { password: hash, role: 'Administrador', verified: true, email } });
      console.log('Usuario existente actualizado a Administrador:', username);
    } else {
      await prisma.usuarios.create({ data: { username, password: hash, role: 'Administrador', email, verified: true } });
      console.log('Usuario administrador creado:', username);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error creando admin:', err);
    process.exit(2);
  }
}

main();
