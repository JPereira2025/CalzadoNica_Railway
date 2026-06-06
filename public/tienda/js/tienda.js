/**
 * MÓDULO: Tienda Virtual
 * @author Gemini Code Assist
 * @description Lógica del lado del cliente para la tienda de Calzado Nica.
 * Maneja:
 * - Listado dinámico de productos y filtros.
 * - Gestión del carrito de compras (LocalStorage).
 * - Procesamiento de pedidos y autenticación de clientes.
 */
(function () {
  const CART_KEY = 'cn_cart';
  let currentProduct = null;
  let currentImages = []; // ahora array de objetos { id, url, es_principal }
  let currentImageIndex = 0;
  let allProducts = [];
  let allCategorias = [];
  let allEstilos = [];
  let currentDiscount = null;
  const IVA_RATE = 0.15;

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  }

  /**
   * Persistencia del carrito
   */
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

  function formatCurrency(n) {
    return `C$ ${Number(n).toFixed(2)}`;
  }

  /**
   * Obtiene los productos de la API y sincroniza categorías/estilos
   */
  async function cargarProductos() {
    try {
      const [resP, resC, resE] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/categorias'),
        fetch('/api/estilos')
      ]);
      const productos = await resP.json();
      allProducts = productos || [];
      allCategorias = (await resC.json()) || [];
      allEstilos = (await resE.json()) || [];
      populateNavProducts();
      populateFilters();
      applyFilters();
      actualizarCartCount();
    } catch (e) {
      console.error('Error cargando productos', e);
    }
  }

  /**
   * Llena los dropdowns de filtros con datos reales de la DB
   */
  function populateFilters() {
    const catSel = document.getElementById('filtro-categoria');
    const estSel = document.getElementById('filtro-estilo');
    if (catSel) {
      // limpiar excepto primera opción
      let optsC = '<option value="">Todas las categorías</option>';
      optsC += allCategorias.map(function(c){ return '<option value="' + c.id + '">' + (c.nombre || '') + '</option>'; }).join('');
      catSel.innerHTML = optsC;
    }
    if (estSel) {
      let optsE = '<option value="">Todos los estilos</option>';
      optsE += allEstilos.map(function(e){ return '<option value="' + e.id + '">' + (e.nombre || '') + '</option>'; }).join('');
      estSel.innerHTML = optsE;
    }
  }

  function populateNavProducts() {
    const navSel = document.getElementById('nav-productos');
    if (!navSel) return;
    let opts = '<option value="">Productos</option>';
    opts += allProducts.map(function(p){ return '<option value="' + p.id + '">' + (p.marca || '') + ' ' + (p.modelo || '') + '</option>'; }).join('');
    navSel.innerHTML = opts;
    navSel.onchange = function(){ if (this.value) window.location.href = '/tienda/producto.html?id=' + encodeURIComponent(this.value); };
  }

  function applyFilters() {
    const cat = document.getElementById('filtro-categoria')?.value || '';
    const est = document.getElementById('filtro-estilo')?.value || '';
    const orden = document.getElementById('filtro-orden')?.value || 'recientes';
    let lista = allProducts.slice();
    if (cat) lista = lista.filter(p => p.categoria_id === String(cat));
    if (est) lista = lista.filter(p => p.estilo_id === String(est));
    if (orden === 'precio-asc') lista.sort((a,b)=>Number(a.precio)-Number(b.precio));
    if (orden === 'precio-desc') lista.sort((a,b)=>Number(b.precio)-Number(a.precio));
    renderProductos(lista);
  }

  function renderProductos(productos) {
    const grid = document.getElementById('productos-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const hoverCache = {};
    productos.forEach(p => {
      const card = document.createElement('div');
      card.className = 'producto-card';
      // permitir override local (usuario) para imagen principal
      let localOverrides = {};
      try { localOverrides = JSON.parse(localStorage.getItem('cn_product_primary_overrides') || '{}'); } catch (e) {}
      const imgSrc = (localOverrides[p.id] && localOverrides[p.id].url) ? localOverrides[p.id].url : (p.imagen_principal || '/tienda/img/sin-imagen.svg');
      card.innerHTML = `
        <img class="producto-imagen" src="${imgSrc}" alt="${p.marca} ${p.modelo}">
        <div class="producto-info">
          <div class="producto-marca">${p.categoria_nombre || ''}</div>
          <div class="producto-nombre">${p.marca} ${p.modelo}</div>
          <div class="producto-detalles">Talla ${p.talla} · ${p.color || ''}</div>
          <div class="producto-precio">${formatCurrency(p.precio)}</div>
          <div style="margin-top:0.8rem;"><a href="/tienda/producto.html?id=${p.id}" class="btn-detalle">Ver detalle</a></div>
        </div>`;
      grid.appendChild(card);

      // hover: mostrar carousel pequeño (lazy fetch) y animación
      let hoverInterval = null;
      let hoverImgs = null;
      let hoverIndex = 0;
      const imgEl = card.querySelector('.producto-imagen');
      const prevBtn = document.createElement('button');
      prevBtn.className = 'card-prev'; prevBtn.type = 'button'; prevBtn.innerHTML = '‹';
      const nextBtn = document.createElement('button');
      nextBtn.className = 'card-next'; nextBtn.type = 'button'; nextBtn.innerHTML = '›';
      card.appendChild(prevBtn); card.appendChild(nextBtn);

      async function ensureHoverImgs() {
        if (hoverImgs && hoverImgs.length) return hoverImgs;
        if (hoverCache[p.id]) { hoverImgs = hoverCache[p.id]; return hoverImgs; }
        try {
          const res = await fetch(`/api/productos/${encodeURIComponent(p.id)}/imagenes`);
          const imgs = await res.json();
          if (Array.isArray(imgs) && imgs.length) { hoverImgs = imgs; hoverCache[p.id] = imgs; }
        } catch (e) { /* ignore */ }
        return hoverImgs;
      }

      card.addEventListener('mouseenter', async () => {
        const imgs = await ensureHoverImgs();
        if (imgs && imgs.length) {
          hoverIndex = 0;
          hoverInterval = setInterval(() => { hoverIndex = (hoverIndex + 1) % imgs.length; imgEl.style.opacity = '0'; setTimeout(()=>{ imgEl.src = imgs[hoverIndex].url; imgEl.style.opacity='1'; },120); }, 3000);
        }
      });
      card.addEventListener('mouseleave', () => { if (hoverInterval) { clearInterval(hoverInterval); hoverInterval = null; imgEl.src = imgSrc; } });

      prevBtn.onclick = async (ev) => { ev.stopPropagation(); const imgs = await ensureHoverImgs(); if (imgs && imgs.length) { hoverIndex = (hoverIndex - 1 + imgs.length) % imgs.length; imgEl.src = imgs[hoverIndex].url; } };
      nextBtn.onclick = async (ev) => { ev.stopPropagation(); const imgs = await ensureHoverImgs(); if (imgs && imgs.length) { hoverIndex = (hoverIndex + 1) % imgs.length; imgEl.src = imgs[hoverIndex].url; } };
      // permitir click para ir a detalle
      card.querySelector('.btn-detalle')?.addEventListener('click', (ev) => {});
    });
  }

  function buscarProductos() {
    const q = document.getElementById('filtro-busqueda')?.value?.toLowerCase() || '';
    const filtered = allProducts.filter(p => (`${p.marca} ${p.modelo} ${p.categoria_nombre} ${p.estilo_nombre} ${p.color}`).toLowerCase().includes(q));
    renderProductos(filtered);
  }

  async function cargarDetalleProducto(id) {
    try {
      const res = await fetch(`/api/productos?id=${encodeURIComponent(id)}`);
      const p = await res.json();
      if (!p || !p.id) return window.location.href = '/tienda/';
      currentProduct = p;
      document.getElementById('producto-nombre').textContent = `${p.marca} ${p.modelo}`;
      document.getElementById('producto-marca').textContent = p.categoria_nombre || '';
      document.getElementById('producto-detalles').textContent = `${p.talla} · ${p.color || ''}`;
      document.getElementById('producto-precio').textContent = formatCurrency(p.precio);
      document.getElementById('producto-stock').textContent = p.stock > 0 ? 'En stock' : 'Agotado';
      document.getElementById('img-principal').src = p.imagen_principal || '/tienda/img/sin-imagen.svg';
      // preparar carrusel
      currentImages = [];
      currentImageIndex = 0;
      // cargar miniaturas (todas las imágenes del producto)
      try {
        const imgsRes = await fetch(`/api/productos/${encodeURIComponent(id)}/imagenes`);
        const imgs = await imgsRes.json();
        const miniCont = document.getElementById('miniaturas');
        if (miniCont) {
          miniCont.innerHTML = '';
          if (imgs && imgs.length) {
                  // build images array (objetos) y preferir es_principal como inicio
                  currentImages = imgs.map(i => ({ id: i.id, url: i.url, es_principal: !!i.es_principal }));
                  const principalIdx = currentImages.findIndex(i => i.es_principal);
                  currentImageIndex = principalIdx >= 0 ? principalIdx : 0;
                  // render thumbnails (horizontales) con opción de marcar principal si es admin
                  const user = JSON.parse(localStorage.getItem('cn_user') || 'null');
                  const isAdmin = user && user.role === 'Administrador';
                  imgs.forEach((img, idx) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'mini-thumb-wrapper';
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'mini-thumb';
                    b.innerHTML = `<img src="${img.url}" alt="thumb" class="mini-thumb-img" data-idx="${idx}" data-imgid="${img.id}" />`;
                    b.onclick = () => { setCurrentImage(idx); };
                    wrapper.appendChild(b);
                    if (isAdmin) {
                      const markBtn = document.createElement('button');
                      markBtn.type = 'button';
                      markBtn.className = 'mark-principal-btn';
                      markBtn.title = 'Marcar como principal';
                      markBtn.textContent = '★';
                      markBtn.onclick = (ev) => { ev.stopPropagation(); markAsPrincipal(img.id, idx); };
                      // indicar estado
                      if (img.es_principal) markBtn.classList.add('active');
                      wrapper.appendChild(markBtn);
                    }
                    miniCont.appendChild(wrapper);
                  });
                  // habilitar desplazamiento con swipe (sin insertar prev/next aquí)
                  initMiniaturasCarousel(miniCont);
            // set main image
            setCurrentImage(currentImageIndex);
            // asignar doble click para abrir lightbox
            const mainImg = document.getElementById('img-principal');
            if (mainImg) {
              mainImg.ondblclick = () => openLightbox(currentImageIndex);
            }
            ensureCarouselControls();
          } else {
            // si no hay imágenes en tabla, usar imagen principal del producto
            currentImages = [{ id: null, url: p.imagen_principal || '/tienda/img/sin-imagen.svg', es_principal: true }];
            currentImageIndex = 0;
            setCurrentImage(0);
            removeCarouselControls();
          }
        }
      } catch (e) { console.warn('No se pudieron cargar miniaturas', e); }
    } catch (e) { console.error(e); }
  }

  function setCurrentImage(idx) {
    if (!currentImages || !currentImages.length) return;
    currentImageIndex = ((idx % currentImages.length) + currentImages.length) % currentImages.length;
    const src = currentImages[currentImageIndex].url;
    const imgEl = document.getElementById('img-principal');
    if (imgEl) {
      // fade animation
      try {
        imgEl.style.transition = 'opacity 180ms ease';
        imgEl.style.opacity = '0';
        setTimeout(() => { imgEl.src = src; imgEl.style.opacity = '1'; }, 180);
      } catch (e) { imgEl.src = src; }
    }
    // actualizar miniatura activa
    document.querySelectorAll('.mini-thumb-img').forEach(el => {
      el.classList.toggle('active', Number(el.getAttribute('data-idx')) === currentImageIndex);
    });
    // actualizar marca de principal visual (si aplica)
    document.querySelectorAll('.mark-principal-btn').forEach(btn => {
      const parentImgId = btn.previousElementSibling && btn.previousElementSibling.querySelector && btn.previousElementSibling.querySelector('.mini-thumb-img')?.getAttribute('data-imgid');
      if (!parentImgId) return;
      const imgObj = currentImages.find(ci => String(ci.id) === String(parentImgId));
      btn.classList.toggle('active', !!imgObj && imgObj.es_principal);
    });
  }

  // Lightbox modal para ver imagen en grande
  function openLightbox(startIdx) {
    if (!currentImages || !currentImages.length) return;
    let idx = startIdx || 0;
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close">✕</button>
        <button class="lightbox-prev">‹</button>
        <img class="lightbox-img" src="${currentImages[idx].url}" />
        <button class="lightbox-next">›</button>
      </div>`;
    document.body.appendChild(overlay);
    const imgEl = overlay.querySelector('.lightbox-img');
    function update() { imgEl.src = currentImages[idx].url; }
    overlay.querySelector('.lightbox-close').onclick = () => overlay.remove();
    overlay.querySelector('.lightbox-prev').onclick = () => { idx = (idx - 1 + currentImages.length) % currentImages.length; update(); };
    overlay.querySelector('.lightbox-next').onclick = () => { idx = (idx + 1) % currentImages.length; update(); };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.addEventListener('keydown', function kb(ev) {
      if (ev.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', kb); }
      if (ev.key === 'ArrowLeft') { idx = (idx - 1 + currentImages.length) % currentImages.length; update(); }
      if (ev.key === 'ArrowRight') { idx = (idx + 1) % currentImages.length; update(); }
    });
  }

  async function markAsPrincipal(imgId, idx) {
    try {
      const productoId = currentProduct && currentProduct.id;
      if (!productoId) return showToast('Producto no cargado', 'error');
      const token = localStorage.getItem('cn_token');
      if (!token) return showToast('Acceso denegado: inicie sesión como admin', 'error');
      const res = await fetch(`/api/productos/${encodeURIComponent(productoId)}/imagenes/${encodeURIComponent(imgId)}/principal`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) return showToast(data.message || 'Error marcando principal', 'error');
      // actualizar estado localmente
      currentImages.forEach(ci => ci.es_principal = (String(ci.id) === String(imgId)));
      setCurrentImage(idx);
      showToast('Imagen marcada como principal', 'success');
      // también actualizar producto.imagen_principal local para reflejar en grids si se vuelve
      if (currentProduct) currentProduct.imagen_principal = currentImages[idx].url;
    } catch (err) {
      console.error('markAsPrincipal error', err);
      showToast('Error marcando imagen principal', 'error');
    }
  }

  function ensureCarouselControls() {
    const gallery = document.querySelector('.galeria-producto');
    if (!gallery) return;
    if (!document.getElementById('carousel-prev')) {
      const prev = document.createElement('button');
      prev.id = 'carousel-prev';
      prev.className = 'carousel-arrow prev';
      prev.type = 'button';
      prev.innerHTML = '‹';
      prev.onclick = () => { setCurrentImage(currentImageIndex - 1); };
      gallery.appendChild(prev);
    }
    if (!document.getElementById('carousel-next')) {
      const next = document.createElement('button');
      next.id = 'carousel-next';
      next.className = 'carousel-arrow next';
      next.type = 'button';
      next.innerHTML = '›';
      next.onclick = () => { setCurrentImage(currentImageIndex + 1); };
      gallery.appendChild(next);
    }
  }

  function removeCarouselControls() {
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (prev) prev.remove();
    if (next) next.remove();
  }

  // Inicializa prev/next y swipe para la fila de miniaturas
  function initMiniaturasCarousel(container) {
    if (!container) return;
    container.style.overflowX = 'auto';
    container.style.display = 'flex';
    container.style.gap = '0.5rem';
    // swipe / drag support (no capturar si se hace click sobre miniatura)
    let isDown = false, startX, scrollLeft;
    container.addEventListener('pointerdown', (e) => {
      // si el objetivo es una miniatura o su hijo, no iniciar drag (permitir click)
      if (e.target.closest && e.target.closest('.mini-thumb')) return;
      isDown = true; try { container.setPointerCapture(e.pointerId); } catch (e) {}
      startX = e.clientX; scrollLeft = container.scrollLeft;
    });
    container.addEventListener('pointermove', (e) => {
      if (!isDown) return; const x = e.clientX; const dx = x - startX; container.scrollLeft = scrollLeft - dx;
    });
    container.addEventListener('pointerup', (e) => { isDown = false; try { container.releasePointerCapture(e.pointerId); } catch(e){} });
    container.addEventListener('pointerleave', () => { isDown = false; });
  }

  function agregarAlCarrito() {
    if (!currentProduct) return alert('Producto no cargado');
    const cantidad = Number(document.getElementById('cantidad')?.value || 1);
    const cart = getCart();
    const found = cart.find(it => it.id === currentProduct.id);
    if (found) found.cantidad = Math.min((found.cantidad || 0) + cantidad, 999);
    else cart.push({ id: currentProduct.id, nombre: `${currentProduct.marca} ${currentProduct.modelo}`, precio: Number(currentProduct.precio), cantidad, imagen: currentProduct.imagen_principal || '/tienda/img/sin-imagen.svg' });
    saveCart(cart);
    actualizarCartCount();
    showToast('Producto agregado al carrito', 'success');
  }

  function actualizarCartCount() {
    const countEls = document.querySelectorAll('#cart-count');
    const total = getCart().reduce((s, i) => s + Number(i.cantidad || 0), 0);
    countEls.forEach(el => el.textContent = total);
  }

  function actualizarUIcarrito() {
    const container = document.getElementById('carrito-items');
    const carritoVacio = document.getElementById('carrito-vacio');
    const resumen = document.getElementById('carrito-resumen');
    if (!container) return;
    const cart = getCart();
    if (!cart.length) {
      container.innerHTML = '';
      carritoVacio.style.display = '';
      resumen.style.display = 'none';
      actualizarCartCount();
      return;
    }
    carritoVacio.style.display = 'none';
    resumen.style.display = '';
    container.innerHTML = '';
    let subtotal = 0;
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'carrito-item';
      const itemSubtotal = Number(item.precio) * Number(item.cantidad);
      subtotal += itemSubtotal;
      row.innerHTML = `
        <img src="${item.imagen}" alt="${item.nombre}">
        <div class="carrito-item-info">
          <h3>${item.nombre}</h3>
          <p>Precio: ${formatCurrency(item.precio)}</p>
        </div>
        <div class="carrito-item-cantidad">
          <button onclick="(function(){ window.tienda.cambiarCantidad('${item.id}', -1); })()">-</button>
          <span>${item.cantidad}</span>
        </div>
        <div class="carrito-item-precio carrito-item-subtotal">${formatCurrency(itemSubtotal)}</div>
        <div><button class="btn-eliminar" onclick="(function(){ window.tienda.eliminarItem('${item.id}'); })()">Eliminar</button></div>
      `;
      container.appendChild(row);
    });
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    // aplicar descuento si existe
    const descuentoMonto = currentDiscount ? (subtotal * (currentDiscount.porcentaje / 100)) : 0;
    if (descuentoMonto > 0) {
      document.getElementById('fila-descuento') && (document.getElementById('fila-descuento').style.display = '');
      const montoEl = document.getElementById('monto-descuento');
      if (montoEl) montoEl.textContent = `-` + formatCurrency(descuentoMonto);
    } else {
      document.getElementById('fila-descuento') && (document.getElementById('fila-descuento').style.display = 'none');
    }
    const total = Math.max(0, subtotal - descuentoMonto);
    document.getElementById('total').textContent = formatCurrency(total);
    document.getElementById('carrito-cantidad').textContent = `${cart.length} artículos`;
    actualizarCartCount();
  }

  function cambiarCantidad(id, delta) {
    const cart = getCart();
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.cantidad = Math.max(1, Number(it.cantidad) + Number(delta));
    saveCart(cart);
    actualizarUIcarrito();
  }

  function eliminarItem(id) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    actualizarUIcarrito();
    showToast('Producto removido', 'success');
  }

  function procederAlPago() {
    const cart = getCart();
    if (!cart.length) return alert('El carrito está vacío');
    window.location.href = '/tienda/checkout.html';
  }

  function aplicarDescuento() {
    const codigo = document.getElementById('codigo-descuento')?.value?.trim();
    if (!codigo) return;
    fetch(`/api/codigos?codigo=${encodeURIComponent(codigo)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.codigo) {
          currentDiscount = { id: data.id, porcentaje: Number(data.porcentaje_descuento) };
          // persistir descuento para que no se pierda al navegar
          try { localStorage.setItem('cn_discount', JSON.stringify(currentDiscount)); } catch (e) {}
          document.getElementById('descuento-aplicado') && (document.getElementById('descuento-aplicado').textContent = `Código válido: -${data.porcentaje_descuento}%`);
          if (document.getElementById('fila-descuento')) document.getElementById('fila-descuento').style.display = '';
          // actualizar montos en carrito y checkout
          actualizarUIcarrito();
          if (document.getElementById('resumen-subtotal')) window.tienda.inicializarCheckout();
        } else if (data && data.status) {
          if (data.status === 'expired') showToast('Código vencido', 'error');
          else if (data.status === 'inactive') showToast('Código inactivo', 'error');
          else if (data.status === 'not_started') showToast('Código aún no válido', 'error');
          else showToast(data.message || 'Código inválido', 'error');
        } else {
          showToast('Código inválido', 'error');
        }
      }).catch(() => showToast('Error verificando código', 'error'));
  }

  async function procesarPedido(e) {
    if (e) e.preventDefault();
    const cart = getCart();
    if (!cart.length) return alert('Carrito vacío');
    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const provincia = document.getElementById('provincia').value;
    const ciudad = document.getElementById('ciudad').value;
    const direccion_exacta = document.getElementById('direccion_exacta').value;
    const metodo_pago = document.getElementById('metodo_pago').value;
    if (!nombres || !apellidos || !email || !telefono || !provincia || !ciudad || !direccion_exacta || !metodo_pago) {
      document.getElementById('checkout-error').textContent = 'Complete todos los campos requeridos';
      document.getElementById('checkout-error').style.display = '';
      return;
    }

    const items = cart.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio }));
    const subtotal = cart.reduce((s,i) => s + (i.precio * i.cantidad), 0);
    const descuentoMonto = currentDiscount ? (subtotal * (currentDiscount.porcentaje / 100)) : 0;
    const base = subtotal - descuentoMonto;
    const iva = Number((base * IVA_RATE).toFixed(2));
    const total = Number((base + iva).toFixed(2));
    const payload = {
      id: `F-${Date.now()}`,
      cliente: `${nombres} ${apellidos} <${email}>`,
      vendedor: 'web',
      items: items.map(it => ({ id: it.id, nombre: it.nombre, cantidad: it.cantidad, precio: it.precio })),
      subtotal,
      monto_descuento: Number(descuentoMonto.toFixed(2)),
      iva,
      total,
      codigo_descuento: currentDiscount ? currentDiscount.id : null
    };

    const btn = document.getElementById('btn-confirmar');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
    try {
      const res = await fetch('/api/facturas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error registrando pedido');
      }
      localStorage.removeItem(CART_KEY);
      actualizarCartCount();
      mostrarConfirmacion(data.id);
      currentDiscount = null;
    } catch (err) {
      console.error(err);
      document.getElementById('checkout-error').textContent = err.message || 'Error procesando pedido';
      document.getElementById('checkout-error').style.display = '';
    }
      if (btn) { btn.disabled = false; btn.textContent = '✓ Confirmar Pedido'; }
  }

  function mostrarConfirmacion(facturaId) {
    const main = document.querySelector('main.container');
    if (!main) return alert('Pedido confirmado: ' + facturaId);
    main.innerHTML = `
      <div class="pedido-confirmado">
        <i>✓</i>
        <h1>Pedido confirmado</h1>
        <p>Gracias, su pedido fue registrado correctamente.</p>
        <div class="pedido-numero">${facturaId}</div>
        <a href="/tienda/" class="btn-continuar-comprando">Volver a la tienda</a>
      </div>`;
  }

  function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // Stubs para auth modal (simple UX)
  function abrirModal(tab) { document.getElementById('auth-modal')?.classList.add('active'); cambiarTab(tab); }
  function cerrarModal() { document.getElementById('auth-modal')?.classList.remove('active'); }
  function cambiarTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    document.querySelectorAll('.modal-form').forEach(f => f.classList.toggle('active', f.id.startsWith(tab)));
  }

  /**
   * Gestión de inicio de sesión del cliente
   */
  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;
    try {
      const res = await fetch('/tienda/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: email, password }) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const el = document.getElementById('login-error'); if (el) { el.textContent = data.message || 'Error autenticando'; el.style.display = 'block'; }
        return;
      }
      localStorage.setItem('cn_token', data.token);
      localStorage.setItem('cn_user', JSON.stringify(data.user));
      updateAuthUI();
      cerrarModal();
    } catch (err) { console.error(err); document.getElementById('login-error').textContent = 'Error de red'; }
  }

  /**
   * Registro de nuevos clientes
   */
  async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[name="email"]').value;
    const nombres = form.querySelector('input[name="nombres"]').value || '';
    const apellidos = form.querySelector('input[name="apellidos"]').value || '';
    const telefono = form.querySelector('input[name="telefono"]') ? form.querySelector('input[name="telefono"]').value || '' : '';
    const password = form.querySelector('input[name="password"]').value;
    const confirm = form.querySelector('input[name="confirmPassword"]').value;
    if (password !== confirm) {
      const el = document.getElementById('register-error'); if (el) { el.textContent = 'Las contraseñas no coinciden'; el.style.display = 'block'; }
      return;
    }
    try {
      const res = await fetch('/register', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: email, email, password, nombres, apellidos, telefono }) });
      const data = await res.json();
      if (!res.ok) {
        const el = document.getElementById('register-error'); if (el) { el.textContent = data.message || 'Error registrando'; el.style.display = 'block'; }
        // Si el correo/usuario ya existe, abrir modal de verificación y reenviar token automáticamente
        if (res.status === 409) {
          try {
            const verifyModal = document.getElementById('verify-modal-store');
            const inputUser = document.getElementById('verify-usernameOrEmail-store');
            if (inputUser) inputUser.value = email;
            if (verifyModal) verifyModal.classList.add('active');
            // reintentar envío del token
            setTimeout(()=>{ window.resendTokenStore && window.resendTokenStore(); }, 200);
          } catch (e) { /* no bloquear por errores en UI */ }
        }
        return;
      }
      const suc = document.getElementById('register-success'); if (suc) { suc.textContent = data.message || 'Cuenta creada. Revisa tu correo'; suc.style.display = 'block'; }
      // Mostrar modal de verificación en tienda y pre-llenar el email
      try {
        const verifyModal = document.getElementById('verify-modal-store');
        const inputUser = document.getElementById('verify-usernameOrEmail-store');
        const inputToken = document.getElementById('verify-token-store');
        if (inputUser) inputUser.value = email;
        if (verifyModal) verifyModal.classList.add('active');
        if (inputToken) { inputToken.value = ''; setTimeout(()=>inputToken.focus(), 200); }
      } catch (err) { /* no bloquear por errores en UI */ }
    } catch (err) { console.error(err); document.getElementById('register-error').textContent = 'Error de red'; }
  }

  async function handleVerifyStore(e) {
    if (e && e.preventDefault) e.preventDefault();
    const usernameOrEmail = document.getElementById('verify-usernameOrEmail-store')?.value?.trim();
    const token = document.getElementById('verify-token-store')?.value?.trim();
    const errEl = document.getElementById('verify-error-store');
    const sucEl = document.getElementById('verify-success-store');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
    if (sucEl) { sucEl.textContent = ''; sucEl.style.display = 'none'; }
    if (!usernameOrEmail || !token) {
      if (errEl) { errEl.textContent = 'Completa correo/usuario y token'; errEl.style.display = 'block'; }
      return false;
    }
    try {
      const res = await fetch('/verify-token', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ usernameOrEmail, token }) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (errEl) { errEl.textContent = data.message || 'Token inválido'; errEl.style.display = 'block'; }
        return false;
      }
      if (sucEl) { sucEl.textContent = data.message || 'Cuenta verificada'; sucEl.style.display = 'block'; }
      // cerrar modal tras breve delay
      setTimeout(()=>{ document.getElementById('verify-modal-store')?.classList.remove('active'); }, 1200);
      return true;
    } catch (err) {
      console.error('verify error', err);
      if (errEl) { errEl.textContent = 'Error de red'; errEl.style.display = 'block'; }
      return false;
    }
  }

  async function resendTokenStore() {
    const usernameOrEmail = document.getElementById('verify-usernameOrEmail-store')?.value?.trim();
    const errEl = document.getElementById('verify-error-store');
    const sucEl = document.getElementById('verify-success-store');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
    if (sucEl) { sucEl.textContent = ''; sucEl.style.display = 'none'; }
    if (!usernameOrEmail) {
      if (errEl) { errEl.textContent = 'Ingresa tu correo o usuario'; errEl.style.display = 'block'; }
      return false;
    }
    try {
      const res = await fetch('/resend-token', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ usernameOrEmail }) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (errEl) { errEl.textContent = data.message || 'No se pudo reenviar el token'; errEl.style.display = 'block'; }
        return false;
      }
      if (sucEl) { sucEl.textContent = data.message || 'Token reenviado'; sucEl.style.display = 'block'; }
      return true;
    } catch (err) {
      console.error('resend error', err);
      if (errEl) { errEl.textContent = 'Error de red'; errEl.style.display = 'block'; }
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('cn_token');
    localStorage.removeItem('cn_user');
    try {
      // limpiar carrito y estado relacionado al cerrar sesión
      localStorage.removeItem(CART_KEY);
      currentDiscount = null;
      saveCart([]);
    } catch (e) { /* no bloquear logout por errores de storage */ }
    updateAuthUI();
    // redirigir al inicio de la tienda
    window.location.href = '/tienda/index.html';
  }

  function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('cn_user') || 'null');
    if (user && user.username) {
      document.getElementById('auth-buttons') && (document.getElementById('auth-buttons').style.display = 'none');
      document.getElementById('user-menu') && (document.getElementById('user-menu').style.display = 'flex');
      document.getElementById('user-name') && (document.getElementById('user-name').textContent = user.username);
    } else {
      document.getElementById('auth-buttons') && (document.getElementById('auth-buttons').style.display = 'flex');
      document.getElementById('user-menu') && (document.getElementById('user-menu').style.display = 'none');
      document.getElementById('user-name') && (document.getElementById('user-name').textContent = '');
    }
  }

  // Exponer funciones globales usadas por HTML inline
  window.tienda = {
    cargarProductos,
    buscarProductos,
    cargarDetalleProducto,
    agregarAlCarrito,
    actualizarUIcarrito,
    procederAlPago,
    aplicarDescuento,
    inicializarCheckout: function() {
      // cargar resumen en checkout
      const resumenItems = document.getElementById('resumen-items');
      const cart = getCart();
      let subtotal = 0;
      resumenItems && (resumenItems.innerHTML = '');
      cart.forEach(it => {
        const row = document.createElement('div');
        row.className = 'resumen-item';
        const itemSubtotal = Number(it.precio) * Number(it.cantidad);
        subtotal += itemSubtotal;
        row.innerHTML = `<span>${it.nombre} x ${it.cantidad}</span><span>${formatCurrency(itemSubtotal)}</span>`;
        resumenItems && resumenItems.appendChild(row);
      });
      const descuentoMonto = currentDiscount ? (subtotal * (currentDiscount.porcentaje / 100)) : 0;
      const base = subtotal - descuentoMonto;
      const iva = Number((base * IVA_RATE).toFixed(2));
      const total = Number((base + iva).toFixed(2));
      document.getElementById('resumen-subtotal').textContent = formatCurrency(subtotal);
      if (currentDiscount) {
        document.getElementById('resumen-descuento-row') && (document.getElementById('resumen-descuento-row').style.display = '');
        document.getElementById('resumen-descuento').textContent = `- ${formatCurrency(descuentoMonto)}`;
      } else {
        document.getElementById('resumen-descuento-row') && (document.getElementById('resumen-descuento-row').style.display = 'none');
      }
      // mostrar IVA y total
      let ivaRow = document.getElementById('resumen-iva-row');
      if (!ivaRow) {
        const div = document.createElement('div');
        div.className = 'resumen-item';
        div.id = 'resumen-iva-row';
        div.innerHTML = `<span>IVA (${Math.round(IVA_RATE*100)}%)</span><span id="resumen-iva">C$ 0.00</span>`;
        document.querySelector('.checkout-resumen') && document.querySelector('.checkout-resumen').insertBefore(div, document.querySelector('.resumen-item.total'));
      }
      document.getElementById('resumen-iva') && (document.getElementById('resumen-iva').textContent = formatCurrency(iva));
      document.getElementById('resumen-total').textContent = formatCurrency(total);
      // Bind form
      const form = document.getElementById('checkout-form');
      if (form) form.onsubmit = procesarPedido;
      actualizarCartCount();
    },
    cambiarCantidad,
    eliminarItem,
    abrirModal,
    cerrarModal,
    cambiarTab,
    handleLogin,
    handleRegister,
    logout
  };

  // Exponer atajos globales para compatibilidad con handlers inline en HTML
  window.abrirModal = abrirModal;
  window.cerrarModal = cerrarModal;
  window.cambiarTab = cambiarTab;
  window.logout = function(){ window.tienda.logout(); };
  // Compatibilidad: si estamos en la página de detalle, cambiar el input cantidad;
  // en el carrito se usa directamente `window.tienda.cambiarCantidad(id, delta)`.
  window.cambiarCantidad = function(arg1, arg2) {
    // llamado como cambiarCantidad(delta) desde producto.html
    if (typeof arg1 === 'number' && typeof arg2 === 'undefined' && document.getElementById('cantidad')) {
      const delta = Number(arg1);
      const input = document.getElementById('cantidad');
      const current = Number(input.value || 1);
      input.value = Math.max(1, current + delta);
      return;
    }
    // llamado como cambiarCantidad(id, delta) desde el carrito
    if (typeof arg1 === 'string' && typeof arg2 !== 'undefined') {
      return window.tienda.cambiarCantidad(arg1, arg2);
    }
    // fallback: si se pasa id como número (por seguridad)
    if (typeof arg1 === 'number' && typeof arg2 !== 'undefined') {
      return window.tienda.cambiarCantidad(String(arg1), arg2);
    }
  };

  // Exponer funciones faltantes que algunas páginas llaman directamente
  window.cargarDetalleProducto = function(id) { return window.tienda.cargarDetalleProducto(id); };
  window.actualizarUIcarrito = function() { return window.tienda.actualizarUIcarrito(); };
  window.agregarAlCarrito = function(){ return window.tienda.agregarAlCarrito(); };
  window.buscarProductos = function(){ return window.tienda.buscarProductos(); };
  window.procederAlPago = function(){ return window.tienda.procederAlPago(); };
  // navegación rápida al carrito desde el navbar
  window.irAlCarrito = function(){ window.location.href = '/tienda/carrito.html'; };
  // Exponer handlers de auth usados en los formularios inline
  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;
  window.handleVerifyStore = handleVerifyStore;
  window.resendTokenStore = resendTokenStore;
  // Exponer aplicarDescuento para botones inline (ej. carrito)
  window.aplicarDescuento = function() { return window.tienda.aplicarDescuento(); };
  // Exponer inicializarCheckout y procesarPedido para checkout.html
  window.inicializarCheckout = function() { return window.tienda.inicializarCheckout && window.tienda.inicializarCheckout(); };
  window.procesarPedido = function(e) { return typeof procesarPedido === 'function' ? procesarPedido(e) : null; };

  // Auto-init según página
  document.addEventListener('DOMContentLoaded', () => {
    // restaurar descuento aplicado (persistido en localStorage)
    try {
      const stored = localStorage.getItem('cn_discount');
      if (stored) {
        currentDiscount = JSON.parse(stored);
        if (currentDiscount && document.getElementById('descuento-aplicado')) {
          document.getElementById('descuento-aplicado').textContent = `Código válido: -${currentDiscount.porcentaje}%`;
          document.getElementById('fila-descuento') && (document.getElementById('fila-descuento').style.display = '');
        }
      }
    } catch (e) { console.warn('No se pudo restaurar descuento', e); }
    if (document.getElementById('productos-grid')) {
      cargarProductos();
      // bind filter change events
      document.getElementById('filtro-categoria')?.addEventListener('change', applyFilters);
      document.getElementById('filtro-estilo')?.addEventListener('change', applyFilters);
      document.getElementById('filtro-orden')?.addEventListener('change', applyFilters);
      document.getElementById('filtro-busqueda')?.addEventListener('input', buscarProductos);
    }
    if (document.getElementById('carrito-items')) actualizarUIcarrito();
    if (document.getElementById('detalle-producto')) {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) cargarDetalleProducto(id);
    }
    if (document.getElementById('checkout-form')) {
      window.tienda.inicializarCheckout();
    }
    updateAuthUI();
  });

  // Global error handlers para capturar errores espontáneos y mostrarlos en pantalla
  function showAppError(msg) {
    try {
      let el = document.getElementById('app-error');
      if (!el) {
        el = document.createElement('div');
        el.id = 'app-error';
        el.style.position = 'fixed';
        el.style.left = '12px';
        el.style.right = '12px';
        el.style.bottom = '12px';
        el.style.padding = '12px';
        el.style.background = 'rgba(220,53,69,0.95)';
        el.style.color = 'white';
        el.style.borderRadius = '6px';
        el.style.zIndex = 99999;
        el.style.fontFamily = 'Segoe UI, Tahoma, sans-serif';
        el.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(el);
      }
      el.textContent = String(msg);
      setTimeout(() => { try { el.remove(); } catch (e){} }, 10000);
    } catch (e) { console.error('showAppError failed', e); }
  }

  window.addEventListener('error', function (ev) {
    console.error('Unhandled error:', ev.error || ev.message);
    showAppError(ev.error && ev.error.stack ? ev.error.stack : ev.message || String(ev));
  });
  window.addEventListener('unhandledrejection', function (ev) {
    console.error('Unhandled rejection:', ev.reason);
    showAppError(ev.reason && ev.reason.stack ? ev.reason.stack : String(ev.reason));
  });

})();
