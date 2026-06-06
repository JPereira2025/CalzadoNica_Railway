(async () => {
  try {
    const base = 'http://localhost:3001';
    const email = 'testuser+prueba@example.com';
    const pwd = 'Pass123!';
    const nombres = 'Test';
    const apellidos = 'Usuario';
    const provincia = 'DeptoX';
    const ciudad = 'CiudadY';
    const direccion = 'Calle 123';

    console.log('1) Registrando usuario...');
    let res = await fetch(base + '/register', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: email, email, password: pwd, nombres, apellidos, telefono: '9999', direccion: { provincia, ciudad, direccion }, guardarDireccion: true }) });
    let data = await res.json().catch(()=>null);
    console.log('Register status', res.status, data);

    console.log('2) Reenviando token...');
    res = await fetch(base + '/resend-token', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ usernameOrEmail: email, _debug: true }) });
    data = await res.json();
    console.log('Resend response', res.status, data);
    const token = data && data.token;
    if (!token) throw new Error('No token returned from resend-token');
    console.log('Token:', token);

    console.log('3) Verificando token...');
    res = await fetch(base + '/verify-token', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ usernameOrEmail: email, token }) });
    data = await res.json();
    console.log('Verify response', res.status, data);

    console.log('4) Login tienda...');
    res = await fetch(base + '/tienda/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: email, password: pwd }) });
    data = await res.json();
    console.log('Login response', res.status, data);
    const authToken = data && data.token;
    if (!authToken) throw new Error('Login failed, no token');

    console.log('5) Obtener primer producto...');
    res = await fetch(base + '/api/productos');
    const productos = await res.json();
    const first = productos && productos[0];
    if (!first) throw new Error('No products found');
    console.log('Primer producto:', first.id, first.marca, first.modelo, first.precio);

    console.log('6) Creando factura...');
    const item = { id: first.id, nombre: (first.marca || '') + ' ' + (first.modelo || ''), cantidad: 1, precio: first.precio };
    const factura = { id: 'FACT' + Date.now(), cliente: email, vendedor: 'Tienda', items: [item], subtotal: Number(first.precio), monto_descuento: 0, iva: Number((Number(first.precio) * 0.15).toFixed(2)), total: Number((Number(first.precio) * 1.15).toFixed(2)) };
    res = await fetch(base + '/api/facturas', { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + authToken }, body: JSON.stringify(factura) });
    data = await res.json();
    console.log('Factura response', res.status, data);

    process.exit(0);
  } catch (err) {
    console.error('Test flow error', err);
    process.exit(1);
  }
})();
