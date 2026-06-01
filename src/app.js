/**
 * ARCHIVO: app.js
 * DESCRIPCIÓN: Configuración centralizada de Express.
 * FUNCIONALIDAD: Middlewares globales, archivos estáticos y ruteo principal.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const blockTienda = require('./middlewares/blockTienda');

const app = express();

// Middlewares globales de utilidad
app.use(cors());
app.use(express.json()); // Habilita la lectura de JSON en el body
app.use(express.urlencoded({ extended: true })); // Habilita la lectura de formularios

// Servir un favicon mínimo (SVG) para evitar 404 en requests del navegador
app.get('/favicon.ico', (req, res) => {
    res.type('image/svg+xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="100%" height="100%" fill="#1E40AF" rx="8"/>
        <text x="50%" y="55%" font-size="36" font-family="Arial, Helvetica, sans-serif" fill="white" text-anchor="middle" alignment-baseline="middle">CN</text>
    </svg>`);
});

/** 
 * Configuración de Archivos Estáticos
 */
app.use('/tienda', express.static(path.join(__dirname, '..', 'public', 'tienda')));

// Servidor de archivos raíz (index.html, assets, etc)
app.use(express.static(path.join(__dirname, '..')));

app.use('/', routes);

/**
 * Middleware de Manejo de Errores Global (Estilo Profesor)
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    res.status(status).json({ 
        success: false, 
        message: message 
    });
};

app.use(errorHandler);

module.exports = app;
