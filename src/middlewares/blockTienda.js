// Middleware para bloquear o permitir el acceso a la tienda pública
// Controlado por la variable de entorno `TIENDA_ENABLED` (valor 'true' habilita).
module.exports = function (req, res, next) {
  try {
    const enabled = String(process.env.TIENDA_ENABLED || 'true').toLowerCase() === 'true';
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/tienda')) {
      if (!enabled) {
        // Responder con JSON para peticiones XHR/API, HTML para navegadores
        if (req.accepts && req.accepts('html')) {
          return res.status(503).send('<h1>Tienda temporalmente deshabilitada</h1>');
        }
        return res.status(503).json({ success: false, message: 'Tienda temporalmente deshabilitada' });
      }
    }
  } catch (e) {
    // Si falla, no bloqueamos por seguridad
    console.error('blockTienda middleware error:', e && e.message);
  }
  next();
};
