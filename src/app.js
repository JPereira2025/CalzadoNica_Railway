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
const morgan = require('morgan');

const app = express();

// Middlewares globales de utilidad
app.use(cors());
app.use(express.json()); // Habilita la lectura de JSON en el body
app.use(express.urlencoded({ extended: true })); // Habilita la lectura de formularios

// Logging de peticiones
app.use(morgan(process.env.LOG_FORMAT || 'dev'));

// Control de acceso a la tienda pública (habilitar/inhabilitar vía env)
app.use(blockTienda);

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
// No servir la raíz del proyecto desde el servidor Node: evitamos que
// `http://localhost:3001/` muestre la WebApp administrativa (que debe
// seguir siendo servida por Apache en http://localhost/CalzadoNica/).
// Servimos únicamente la tienda pública en `/tienda` (arriba) y la API.

// Si quieres una página informativa en la raíz del API, descomenta lo siguiente:
// app.get('/', (req, res) => res.send('Calzado Nica API'));

app.use('/', routes);

/**
 * Middleware de Manejo de Errores Global (Estilo Profesor)
 */
const errorHandler = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [SYSTEM_ERROR]: ${err.message}`);
    
    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    
    res.status(status).json({ 
        success: false, 
        message: message,
        timestamp: timestamp,
        path: req.originalUrl
    });
};

app.use(errorHandler);

module.exports = app;
