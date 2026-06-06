const http = require('http');

const payload = JSON.stringify({
  cliente: 'Test User <test@example.com>',
  vendedor: 'web',
  items: [{ id: 'PROD-AD-002', nombre: 'Zapatillas', cantidad: 1, precio: 850 }],
  subtotal: 850,
  monto_descuento: 0,
  iva: 0,
  total: 850,
  codigo_descuento: null,
  metodo_pago: 'efectivo',
  pago_detalles: { tipo: 'efectivo' }
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/facturas',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      console.log('Status:', res.statusCode);
      console.log('Response:', JSON.parse(data));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', err => {
  console.error('Request error', err);
});

req.write(payload);
req.end();
