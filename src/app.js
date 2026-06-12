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

// Configuración para confiar en el proxy de Railway/Cloudflare (Permite obtener IP real)
app.set('trust proxy', 1);

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

// 1. ARCHIVOS ESTÁTICOS (Prioridad para que cargue rápido el diseño)
app.use('/tienda', express.static(path.join(__dirname, '..', 'public', 'tienda')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/css', express.static(path.join(__dirname, '..', 'css'))); // Asegurar CSS si existe
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'))); // Servir imágenes subidas
app.use('/pages', express.static(path.join(__dirname, '..', 'pages'))); // Habilitar módulos de la WebApp

// 2. LOGGING Y SEGURIDAD
app.use(morgan(process.env.LOG_FORMAT || 'dev'));
app.use(blockTienda);

// 3. RUTAS DE API
app.use('/', routes);

// Servir el panel de administración en la ruta raíz '/' explícitamente
// Se coloca después de las rutas para que no interfiera con endpoints específicos
app.get('/', (req, res) => {
    const adminPath = path.resolve(__dirname, '..', 'index.html');
    res.sendFile(adminPath, (err) => {
        if (err) {
            console.error(`[ERROR] No se pudo enviar index.html: ${err.message}`);
            res.status(404).json({ success: false, message: 'WebApp administrativa no encontrada en el servidor.' });
        }
    });
});

// Manejador de rutas no encontradas (404 personalizado en JSON)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `La ruta ${req.originalUrl} no existe en este servidor.`,
        suggestion: 'Si buscas la tienda, ve a /tienda/'
    });
});

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
