#!/usr/bin/env node
require('dotenv').config();
const minimist = require('minimist');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

function makePrisma(url) {
  if (!url) return new PrismaClient();
  return new PrismaClient({ datasources: { db: { url } } });
}

async function ensureAdmin(prisma, username, password, email, options) {
  const hash = await bcrypt.hash(password, 10);
  const now = new Date();
  const expiry = new Date(Date.now() + (options.tokenDays || 7) * 24 * 60 * 60 * 1000);
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
  const token = jwt.sign({ username }, secret, { expiresIn: `${options.tokenDays || 7}d` });

  const existing = await prisma.usuarios.findUnique({ where: { username } });
  if (existing) {
    await prisma.usuarios.update({
      where: { username },
      data: { password: hash, role: 'Administrador', email, verified: true, verification_token: token, verification_token_expiry: expiry }
    });
    return { action: 'updated', username };
  }

  await prisma.usuarios.create({
    data: { username, password: hash, role: 'Administrador', email, verified: true, verification_token: token, verification_token_expiry: expiry }
  });
  return { action: 'created', username };
}

(async ()=>{
  const argv = minimist(process.argv.slice(2));
  const username = String(argv.username || argv.u || argv.user || 'admin').trim();
  const password = String(argv.password || argv.p || 'admin123');
  const email = String(argv.email || argv.e || username).trim();
  const dbUrls = argv.dbUrl || argv.db || argv.d || null; // can be string or array
  const tokenDays = argv.tokenDays ? Number(argv.tokenDays) : 7;

  const urls = [];
  if (dbUrls) {
    if (Array.isArray(dbUrls)) urls.push(...dbUrls);
    else urls.push(String(dbUrls));
  }

  // if no urls provided, use default from .env
  if (urls.length === 0) urls.push(null);

  for (const url of urls) {
    const prisma = makePrisma(url);
    try {
      const res = await ensureAdmin(prisma, username, password, email, { tokenDays });
      console.log(`${res.action} '${username}' on ${url || 'ENV_DATABASE'}`);
    } catch (err) {
      console.error('Error for', url || 'ENV_DATABASE', err.message || err);
    } finally {
      try { await prisma.$disconnect(); } catch(e){}
    }
  }
  process.exit(0);
})();
