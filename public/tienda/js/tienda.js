/**
 * MÓDULO: Tienda Virtual
 * @description Lógica del lado del cliente para la tienda de Calzado Nica.
 * Maneja:
 * - Listado dinámico de productos y filtros.
 * - Gestión del carrito de compras (LocalStorage).
 * - Procesamiento de pedidos y autenticación de clientes.
 */
(function () {
  console.log('tienda.js v2 loaded');
  const CART_KEY = 'cn_cart';
  let currentProduct = null;
  let currentImages = []; // ahora array de objetos { id, url, es_principal }
  let currentImageIndex = 0;
  let allProducts = [];
  let allCategorias = [];
  let allEstilos = [];
  let currentDiscount = null;
  const IVA_RATE = 0.15;
  const SHIPPING_BASE = 100;
  const SHIPPING_STEP_KM = 5;
  const SHIPPING_STEP_COST = 50;
  const STORE_LOCATION = { lat: 12.1470, lng: -86.2650 }; // Ajusta estas coordenadas a la ubicación real de la tienda
  let userLocation = null;
  let shippingDistanceKm = null;
  let shippingCost = SHIPPING_BASE;

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  }
  // Quitar descuento aplicado
  function quitarDescuento() {
    try {
      currentDiscount = null;
      localStorage.removeItem('cn_discount');
      localStorage.removeItem('cn_discount_applied');
      const montoEl = document.getElementById('monto-descuento'); if (montoEl) montoEl.textContent = '';
      const aplicado = document.getElementById('descuento-aplicado'); if (aplicado) aplicado.textContent = '';
      const fila = document.getElementById('fila-descuento'); if (fila) fila.style.display = 'none';
      const quitarBtn = document.getElementById('quitar-descuento-btn'); if (quitarBtn) quitarBtn.style.display = 'none';
      actualizarUIcarrito();
      showToast('Descuento removido', 'success');
    } catch (e) { console.error('quitarDescuento error', e); showToast('Error removiendo descuento', 'error'); }
  }

  /**
   * Persistencia del carrito
   */
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

  function formatCurrency(n) {
    return `C$ ${Number(n).toFixed(2)}`;
  }

  function calculateShippingCost(distanceKm) {
    if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm) || distanceKm <= 0) return SHIPPING_BASE;
    if (distanceKm <= SHIPPING_STEP_KM) return SHIPPING_BASE;
    const extraKm = distanceKm - SHIPPING_STEP_KM;
    const extraSteps = Math.ceil(extraKm / SHIPPING_STEP_KM);
    return SHIPPING_BASE + extraSteps * SHIPPING_STEP_COST;
  }

  function getDistanceKm(a, b) {
    if (!a || !b || typeof a.lat !== 'number' || typeof a.lng !== 'number' || typeof b.lat !== 'number' || typeof b.lng !== 'number') return null;
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const hav = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
    return Number((R * c).toFixed(2));
  }

  function refreshCheckoutTotal() {
    const cart = getCart();
    const subtotal = cart.reduce((s, i) => s + (Number(i.precio) * Number(i.cantidad || 0)), 0);
    const descuentoMonto = currentDiscount ? (subtotal * (currentDiscount.porcentaje / 100)) : 0;
    const base = subtotal - descuentoMonto;
    const iva = Number((base * IVA_RATE).toFixed(2));
    const total = Number((base + iva + shippingCost).toFixed(2));
    const ivaEl = document.getElementById('resumen-iva');
    const totalEl = document.getElementById('resumen-total');
    if (ivaEl) ivaEl.textContent = formatCurrency(iva);
    if (totalEl) totalEl.textContent = formatCurrency(total);
  }

  function updateShippingSummary(distanceKm, cost, message) {
    if (typeof cost === 'number') shippingCost = cost;
    shippingDistanceKm = typeof distanceKm === 'number' ? distanceKm : null;
    const statusEl = document.getElementById('shipping-status');
    const distanceEl = document.getElementById('shipping-distance');
    const costEl = document.getElementById('resumen-shipping');
    if (statusEl) statusEl.textContent = message || 'Distancia calculada desde la tienda.';
    if (distanceEl) distanceEl.textContent = (typeof shippingDistanceKm === 'number')
      ? `Distancia estimada: ${shippingDistanceKm.toFixed(1)} km`
      : 'Distancia estimada: no disponible';
    if (costEl) costEl.textContent = formatCurrency(shippingCost);
    refreshCheckoutTotal();
  }

  function initShipping() {
    if (!navigator.geolocation) {
      updateShippingSummary(null, SHIPPING_BASE, 'No se pudo acceder a la ubicación del cliente. Se aplica costo base de envío.');
      return;
    }
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      if (STORE_LOCATION && typeof STORE_LOCATION.lat === 'number' && typeof STORE_LOCATION.lng === 'number') {
        const distance = getDistanceKm(STORE_LOCATION, userLocation);
        const cost = calculateShippingCost(distance);
        updateShippingSummary(distance, cost);
      } else {
        updateShippingSummary(null, SHIPPING_BASE, 'Ubicación de la tienda no configurada. Se aplica costo base de envío.');
      }
    }, () => {
      updateShippingSummary(null, SHIPPING_BASE, 'No se pudo determinar la ubicación del cliente. Se aplica costo base de envío.');
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
  }

  function updateDeliveryMethod() {
    const deliveryType = document.querySelector('input[name="modo_entrega"]:checked')?.value || 'envio';
    const direccionSection = document.getElementById('direccion-section');
    const shippingInfo = document.querySelector('.shipping-info');
    if (deliveryType === 'retiro') {
      if (direccionSection) direccionSection.style.display = 'none';
      if (shippingInfo) shippingInfo.style.display = 'none';
      updateShippingSummary(null, 0, 'Retiro en tienda: no se aplica costo de envío.');
    } else {
      if (direccionSection) direccionSection.style.display = '';
      if (shippingInfo) shippingInfo.style.display = '';
      initShipping();
    }
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
      imgEl.style.cursor = 'pointer';
      imgEl.onclick = async (ev) => { ev.stopPropagation(); await showQuickView(p.id); };
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
    const cat = document.getElementById('filtro-categoria')?.value || '';
    const est = document.getElementById('filtro-estilo')?.value || '';
    const orden = document.getElementById('filtro-orden')?.value || 'recientes';
    let lista = allProducts.slice();
    if (cat) lista = lista.filter(p => p.categoria_id === String(cat));
    if (est) lista = lista.filter(p => p.estilo_id === String(est));
    if (q) lista = lista.filter(p => (`${p.marca} ${p.modelo} ${p.categoria_nombre} ${p.estilo_nombre} ${p.color}`).toLowerCase().includes(q));
    if (orden === 'precio-asc') lista.sort((a,b)=>Number(a.precio)-Number(b.precio));
    if (orden === 'precio-desc') lista.sort((a,b)=>Number(b.precio)-Number(a.precio));
    renderProductos(lista);
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
      // rellenar selectores de talla y color si existen
      try {
        const tallaSel = document.getElementById('talla');
        const colorSel = document.getElementById('color');
        const rawTallas = Array.isArray(p.tallas) && p.tallas.length ? p.tallas : (p.talla ? [p.talla] : []);
        const tallas = rawTallas.reduce((acc, raw) => {
          if (typeof raw !== 'string') return acc;
          raw.split(/[,;\/\s]+/).map(t => t.trim()).filter(Boolean).forEach(t => { if (!acc.includes(t)) acc.push(t); });
          return acc;
        }, []);
        const rawColores = Array.isArray(p.colores_array) && p.colores_array.length ? p.colores_array : (p.color ? [p.color] : []);
        const colores = rawColores.reduce((acc, raw) => {
          if (typeof raw !== 'string') return acc;
          raw.split(/[,;\/]+/).map(c => c.trim()).filter(Boolean).forEach(c => { if (!acc.includes(c)) acc.push(c); });
          return acc;
        }, []);
        if (tallaSel) {
          tallaSel.innerHTML = '<option value="">Selecciona talla</option>';
          tallas.forEach(t => {
            const opt = document.createElement('option'); opt.value = t; opt.textContent = t; tallaSel.appendChild(opt);
          });
          if (tallas.length === 1) tallaSel.value = String(tallas[0]);
        }
        if (colorSel) {
          colorSel.innerHTML = '<option value="">Selecciona color</option>';
          colores.forEach(c => {
            const opt = document.createElement('option'); opt.value = c; opt.textContent = c; colorSel.appendChild(opt);
          });
          if (colores.length === 1) colorSel.value = String(colores[0]);
        }
      } catch (e) { /* noop */ }
      // preparar carrusel
      currentImages = [];
      currentImageIndex = 0;
      // cargar miniaturas (todas las imágenes del producto)
      try {
        const imgsRes = await fetch(`/api/productos/${encodeURIComponent(id)}/imagenes`);
        const imgsData = imgsRes.ok ? await imgsRes.json() : [];
        const imgs = Array.isArray(imgsData) ? imgsData : [];
        const validImgs = imgs.filter(i => i && typeof i.url === 'string' && i.url.trim() && !i.url.toLowerCase().endsWith('sin-imagen.svg'));
        const miniCont = document.getElementById('miniaturas');
        if (miniCont) {
          miniCont.innerHTML = '';
          if (validImgs.length) {
                  // build images array (objetos) y preferir es_principal como inicio
                  currentImages = validImgs.map(i => ({ id: i.id, url: i.url, es_principal: !!i.es_principal }));
                  const principalIdx = currentImages.findIndex(i => i.es_principal);
                  currentImageIndex = principalIdx >= 0 ? principalIdx : 0;
                  // render thumbnails (horizontales) con opción de marcar principal si es admin
                  const user = JSON.parse(localStorage.getItem('cn_user') || 'null');
                  const isAdmin = user && user.role === 'Administrador';
                  validImgs.forEach((img, idx) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'mini-thumb-wrapper';
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'mini-thumb';
                    b.innerHTML = `<img src="${img.url}" alt="thumb" class="mini-thumb-img" data-idx="${idx}" data-imgid="${img.id}" />`;
                    b.onclick = (ev) => { setCurrentImage(idx); openLightbox(idx); };
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
            // asignar click para abrir lightbox (UX: click abre imagen en grande)
            const mainImg = document.getElementById('img-principal');
            if (mainImg) {
              mainImg.onclick = () => openLightbox(currentImageIndex);
            }
            if (validImgs.length > 1) {
              ensureCarouselControls();
            } else {
              removeCarouselControls();
            }
          } else {
            // si no hay imágenes en tabla, usar imagen principal del producto
            const fallbackImg = (p.imagen_principal && !p.imagen_principal.toLowerCase().endsWith('sin-imagen.svg')) ? p.imagen_principal : '/tienda/img/sin-imagen.svg';
            currentImages = [{ id: null, url: fallbackImg, es_principal: true }];
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

  // Vista rápida a media pantalla (quick view)
  async function showQuickView(productId) {
    try {
      const res = await fetch(`/api/productos?id=${encodeURIComponent(productId)}`);
      const p = await res.json();
      if (!p || !p.id) return;
      // cargar imágenes
      let imgs = [];
      try {
        const imgsRes = await fetch(`/api/productos/${encodeURIComponent(productId)}/imagenes`);
        imgs = await imgsRes.json();
      } catch (e) { imgs = []; }

      const existing = document.getElementById('quickview-overlay');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.id = 'quickview-overlay';
      overlay.className = 'quickview-overlay';
      overlay.innerHTML = `
        <div class="quickview-panel">
          <button class="quickview-close">×</button>
          <div class="quickview-body">
            <div class="quickview-media">
              <img id="quickview-main-img" src="${(imgs && imgs[0] && imgs[0].url) || p.imagen_principal || '/tienda/img/sin-imagen.svg'}" />
              <div class="quickview-thumbs">${(imgs && imgs.length) ? imgs.map((im, i) => `<img data-idx="${i}" src="${im.url}" />`).join('') : ''}</div>
            </div>
            <div class="quickview-info">
              <h3>${p.marca} ${p.modelo}</h3>
              <p>${p.categoria_nombre || ''} · Talla ${p.talla} · ${p.color || ''}</p>
              <p class="price">${formatCurrency(p.precio)}</p>
              <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                <a href="/tienda/producto.html?id=${p.id}" class="btn-detalle">Ver detalle</a>
                <button id="quickview-volver" class="btn-volver-tienda" type="button">Volver a la tienda</button>
              </div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      // inject minimal styles once
      if (!document.getElementById('quickview-styles')) {
        const s = document.createElement('style'); s.id = 'quickview-styles'; s.textContent = `
          .quickview-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999}
          .quickview-panel{background:#fff;width:85%;max-width:980px;border-radius:8px;overflow:hidden}
          .quickview-close{position:absolute;right:10px;top:6px;border:none;background:transparent;font-size:28px;cursor:pointer}
          .quickview-body{display:flex;gap:12px;padding:18px}
          .quickview-media{flex:1}
          .quickview-media img{width:100%;height:auto;border-radius:6px}
          .quickview-thumbs{display:flex;gap:8px;margin-top:8px}
          .quickview-thumbs img{width:64px;height:64px;object-fit:cover;cursor:pointer;border-radius:6px}
          .quickview-info{width:320px}
          .quickview-info .price{font-weight:800;margin-top:8px}
        `; document.head.appendChild(s);
      }

      overlay.querySelector('.quickview-close').onclick = () => overlay.remove();
      const mainImg = overlay.querySelector('#quickview-main-img');
      overlay.querySelectorAll('.quickview-thumbs img').forEach(img => img.addEventListener('click', (ev) => {
        const idx = Number(img.getAttribute('data-idx'));
        if (imgs && imgs[idx]) mainImg.src = imgs[idx].url;
      }));
      // click en imagen abre lightbox completo
      mainImg.onclick = () => {
        overlay.remove();
        if (imgs && imgs.length) {
          currentImages = imgs.map(i=>({ id:i.id, url:i.url }));
          openLightbox(0);
        }
      };
      const volverBtn = overlay.querySelector('#quickview-volver');
      if (volverBtn) volverBtn.onclick = () => { overlay.remove(); window.location.href = '/tienda/'; };
    } catch (err) { console.error('quickview error', err); }
  }

  function agregarAlCarrito() {
    if (!currentProduct) return alert('Producto no cargado');
    const cantidad = Number(document.getElementById('cantidad')?.value || 1);
    const selectedTalla = document.getElementById('talla') ? (document.getElementById('talla').value || null) : (currentProduct.talla || null);
    const selectedColor = document.getElementById('color') ? (document.getElementById('color').value || null) : (currentProduct.color || null);
    const selectedImage = (currentImages && currentImages[currentImageIndex]) ? currentImages[currentImageIndex] : { id: null, url: currentProduct.imagen_principal || '/tienda/img/sin-imagen.svg' };
    const selectedImageId = selectedImage.id || null;
    const selectedImageUrl = selectedImage.url || currentProduct.imagen_principal || '/tienda/img/sin-imagen.svg';
    const cart = getCart();
    const found = cart.find(it => it.id === currentProduct.id && (it.talla || null) === (selectedTalla || null) && (it.color || null) === (selectedColor || null) && (it.imagen_id || null) === selectedImageId);
    if (found) found.cantidad = Math.min((found.cantidad || 0) + cantidad, 999);
    else cart.push({ id: currentProduct.id, nombre: `${currentProduct.marca} ${currentProduct.modelo}`, precio: Number(currentProduct.precio), cantidad, imagen: selectedImageUrl, imagen_id: selectedImageId, talla: selectedTalla, color: selectedColor });
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
      const itemImageSrc = item.imagen || '/tienda/img/sin-imagen.svg';
      row.innerHTML = `
        <img src="${itemImageSrc}" alt="${item.nombre}" onerror="this.onerror=null;this.src='/tienda/img/sin-imagen.svg';">
        <div class="carrito-item-info">
          <h3>${item.nombre}</h3>
          <p>Precio: ${formatCurrency(item.precio)}</p>
          <p>Talla: ${item.talla ? item.talla : '—'} ${item.color ? '· Color: ' + item.color : ''}</p>
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
      // mostrar indicador pequeño junto al input de código
      const disp = document.getElementById('descuento-aplicado'); if (disp) disp.textContent = `- ${formatCurrency(descuentoMonto)} (${currentDiscount.porcentaje}%)`;
      const quitarBtn = document.getElementById('quitar-descuento-btn'); if (quitarBtn) quitarBtn.style.display = '';
    } else {
      // ocultar fila de descuento y limpiar textos para evitar que el porcentaje se muestre "solo"
      const fila = document.getElementById('fila-descuento'); if (fila) fila.style.display = 'none';
      const montoEl = document.getElementById('monto-descuento'); if (montoEl) montoEl.textContent = '';
      const disp = document.getElementById('descuento-aplicado'); if (disp) disp.textContent = '';
      const quitarBtn = document.getElementById('quitar-descuento-btn'); if (quitarBtn) quitarBtn.style.display = 'none';
    }
    const total = Math.max(0, subtotal - descuentoMonto);
    document.getElementById('total').textContent = formatCurrency(total);
    // mostrar cantidad total de artículos (sum de cantidades)
    const totalQty = cart.reduce((s,i) => s + Number(i.cantidad || 0), 0);
    document.getElementById('carrito-cantidad').textContent = `${totalQty} artículo${totalQty !== 1 ? 's' : ''}`;
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

  // Mostrar modal de confirmación reutilizable. Retorna Promise<boolean>
  function showConfirm(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      if (!modal) return resolve(window.confirm(message));
      const msgEl = document.getElementById('confirm-message');
      const okBtn = document.getElementById('confirm-ok');
      const cancelBtn = document.getElementById('confirm-cancel');
      let cleanup = () => {
        modal.classList.remove('active');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onOverlay);
      };
      function onOk(ev) { ev && ev.stopPropagation(); cleanup(); resolve(true); }
      function onCancel(ev) { ev && ev.stopPropagation(); cleanup(); resolve(false); }
      function onOverlay(e) { if (e.target === modal) { cleanup(); resolve(false); } }
      if (msgEl) msgEl.textContent = message || '';
      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onOverlay);
      // show
      modal.classList.add('active');
    });
  }

  // Mostrar toast con botón Deshacer. undoCb se ejecuta si el usuario presiona Deshacer.
  function showUndoToast(message, undoCb, timeout = 6000) {
    try {
      const t = document.createElement('div');
      t.className = 'toast success';
      t.style.display = 'flex';
      t.style.alignItems = 'center';
      t.style.gap = '0.6rem';
      t.style.padding = '0.6rem 0.9rem';
      const span = document.createElement('span'); span.textContent = message;
      const btn = document.createElement('button');
      btn.textContent = 'Deshacer';
      btn.style.background = 'transparent';
      btn.style.color = 'white';
      btn.style.border = '1px solid rgba(255,255,255,0.2)';
      btn.style.padding = '0.25rem 0.6rem';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      let removed = false;
      const timer = setTimeout(() => { if (!removed) { try { t.remove(); } catch (e) {} } }, timeout);
      btn.onclick = () => {
        if (removed) return; removed = true; clearTimeout(timer); try { undoCb && undoCb(); } catch (e) { console.error(e); }
        try { t.remove(); } catch (e) {}
      };
      t.appendChild(span); t.appendChild(btn); document.body.appendChild(t);
    } catch (e) { console.error('showUndoToast error', e); }
  }

  // Vaciar carrito con confirmación modal y opción de deshacer
  async function vaciarCarrito() {
    try {
      const ok = await showConfirm('¿Estás seguro de que deseas vaciar el carrito?');
      if (!ok) return;
      const prev = getCart();
      // persistir backup temporal por si el usuario navega
      try { localStorage.setItem('cn_cart_backup', JSON.stringify(prev)); } catch (e) {}
      saveCart([]);
      actualizarUIcarrito();
      showUndoToast('Carrito vaciado', () => {
        try {
          const backup = JSON.parse(localStorage.getItem('cn_cart_backup') || 'null');
          if (backup && Array.isArray(backup)) {
            saveCart(backup);
            actualizarUIcarrito();
            showToast('Carrito restaurado', 'success');
            localStorage.removeItem('cn_cart_backup');
          }
        } catch (e) { console.error('Error restaurando carrito', e); showToast('No se pudo restaurar el carrito', 'error'); }
      }, 8000);
    } catch (e) {
      console.error('Error vaciando carrito', e);
      showToast('No se pudo vaciar el carrito', 'error');
    }
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
          // persistir descuento para que no se pierda al navegar y marcar que el usuario lo aplicó
          try { localStorage.setItem('cn_discount', JSON.stringify(currentDiscount)); localStorage.setItem('cn_discount_applied','1'); } catch (e) {}
          // mostrar monto descontado junto al porcentaje
          try {
            const cart = getCart();
            const subtotal = cart.reduce((s,i) => s + (Number(i.precio) * Number(i.cantidad || 0)), 0);
            const monto = subtotal * (Number(data.porcentaje_descuento) / 100);
            const disp = document.getElementById('descuento-aplicado');
            if (disp) disp.textContent = `- ${formatCurrency(monto)} (${data.porcentaje_descuento}%)`;
          } catch (e) { document.getElementById('descuento-aplicado') && (document.getElementById('descuento-aplicado').textContent = `-${data.porcentaje_descuento}%`); }
          if (document.getElementById('fila-descuento')) document.getElementById('fila-descuento').style.display = '';
          const quitarBtn = document.getElementById('quitar-descuento-btn'); if (quitarBtn) quitarBtn.style.display = '';
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
    // Requerir que el usuario esté autenticado
    const user = JSON.parse(localStorage.getItem('cn_user') || 'null');
    const token = localStorage.getItem('cn_token');
    if (!user || !token) {
      // abrir modal de login y mostrar advertencia
      showToast('Debe iniciar sesión antes de proceder al pago', 'error');
      abrirModal('login');
      return;
    }
    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const provincia = document.getElementById('provincia').value.trim();
    const ciudad = document.getElementById('ciudad').value.trim();
    const direccion_exacta = document.getElementById('direccion_exacta').value.trim();
    const metodo_pago = document.getElementById('metodo_pago').value;
    const tipo_entrega = document.querySelector('input[name="modo_entrega"]:checked')?.value || 'envio';
    // recoger detalles de pago según método
    let pago_detalles = null;
    if (metodo_pago === 'transferencia') {
      const num = document.getElementById('transfer_numero')?.value?.trim();
      const nombre = document.getElementById('transfer_nombre')?.value?.trim();
      const banco = document.getElementById('transfer_banco')?.value?.trim();
      if (!num || !nombre || !banco) {
        document.getElementById('checkout-error').textContent = 'Complete los datos de la transferencia bancaria';
        document.getElementById('checkout-error').style.display = '';
        if (document.getElementById('transferencia-section')) document.getElementById('transferencia-section').scrollIntoView({behavior:'smooth'});
        return;
      }
      pago_detalles = { tipo: 'transferencia', numero: num, titular: nombre, banco };
    } else if (metodo_pago === 'pago_movil') {
      const num = document.getElementById('billetera_numero')?.value?.trim();
      const codigo = document.getElementById('billetera_codigo')?.value?.trim();
      const nombre = document.getElementById('billetera_nombre')?.value?.trim();
      if (!num || !codigo || !nombre) {
        document.getElementById('checkout-error').textContent = 'Complete los datos de la billetera móvil';
        document.getElementById('checkout-error').style.display = '';
        if (document.getElementById('billetera-section')) document.getElementById('billetera-section').scrollIntoView({behavior:'smooth'});
        return;
      }
      pago_detalles = { tipo: 'billetera_movil', numero: num, codigo: codigo, titular: nombre };
    }
    if (!nombres || !apellidos || !email || !telefono || !metodo_pago) {
      document.getElementById('checkout-error').textContent = 'Complete todos los campos requeridos';
      document.getElementById('checkout-error').style.display = '';
      return;
    }
    if (tipo_entrega === 'envio' && (!provincia || !ciudad || !direccion_exacta)) {
      document.getElementById('checkout-error').textContent = 'Complete los datos de envío para entrega a domicilio';
      document.getElementById('checkout-error').style.display = '';
      return;
    }

    const items = cart.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, talla: i.talla || null }));
    const subtotal = cart.reduce((s,i) => s + (i.precio * i.cantidad), 0);
    const descuentoMonto = currentDiscount ? (subtotal * (currentDiscount.porcentaje / 100)) : 0;
    const base = subtotal - descuentoMonto;
    const iva = Number((base * IVA_RATE).toFixed(2));
    const shippingCostToUse = tipo_entrega === 'retiro' ? 0 : (typeof shippingCost === 'number' ? shippingCost : SHIPPING_BASE);
    const total = Number((base + iva + shippingCostToUse).toFixed(2));
    // No generar ID de factura en cliente; el servidor debe asignarla para garantizar consistencia
    const payload = {
      cliente: `${nombres} ${apellidos} <${email}>`,
      vendedor: 'web',
      items: items.map(it => ({ id: it.id, nombre: it.nombre, cantidad: it.cantidad, precio: it.precio, talla: it.talla })),
      subtotal,
      monto_descuento: Number(descuentoMonto.toFixed(2)),
      descuento_porcentaje: currentDiscount ? currentDiscount.porcentaje : 0,
      iva,
      shipping_cost: shippingCostToUse,
      shipping_distance_km: shippingDistanceKm !== null ? Number(shippingDistanceKm.toFixed(2)) : null,
      tipo_entrega,
      provincia: tipo_entrega === 'envio' ? provincia : null,
      ciudad: tipo_entrega === 'envio' ? ciudad : null,
      direccion_exacta: tipo_entrega === 'envio' ? direccion_exacta : null,
      total,
      codigo_descuento: currentDiscount ? currentDiscount.id : null,
      metodo_pago,
      pago_detalles
    };
    const btn = e.target?.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
    try {
      // Actualizar el perfil del cliente con los datos ingresados en el checkout para "guiñar" futuras facturas
      await actualizarPerfilDesdeCheckout();

      // si hay comprobante de pago (archivo), enviar como FormData para incluir archivo
      let res;
      const token = localStorage.getItem('cn_token');
      let fileInput = null;
      if (metodo_pago === 'transferencia') fileInput = document.getElementById('transfer_comprobante');
      if (metodo_pago === 'pago_movil') fileInput = document.getElementById('billetera_comprobante');
      if (fileInput && fileInput.files && fileInput.files.length) {
        const fd = new FormData();
        fd.append('comprobante', fileInput.files[0]);
        fd.append('payload', JSON.stringify(payload));
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        res = await fetch('/api/facturas', { method: 'POST', headers, body: fd });
      } else {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        res = await fetch('/api/facturas', { method: 'POST', headers, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error registrando pedido');
      }
      // usar el ID devuelto por el servidor (ej: FACT003-260605-2309)
      const facturaId = data.id || data.facturaId || data.numero || null;
      localStorage.removeItem(CART_KEY);
      // limpiar descuento persistido al confirmar pedido
      localStorage.removeItem('cn_discount');
      localStorage.removeItem('cn_discount_applied');
      actualizarCartCount();
      mostrarConfirmacion(facturaId || 'Pedido registrado');
      currentDiscount = null;
    } catch (err) {
      console.error(err);
      document.getElementById('checkout-error').textContent = err.message || 'Error procesando pedido';
      document.getElementById('checkout-error').style.display = '';
    }
      if (btn) { btn.disabled = false; btn.textContent = '✓ Confirmar Pedido'; }
  }

  function mostrarConfirmacion(facturaId) {
    const main = document.querySelector('main.container') || document.querySelector('main');
    const user = JSON.parse(localStorage.getItem('cn_user') || 'null');
    const loggedIn = user && (user.username || user.email);
    console.log('mostrarConfirmacion', { facturaId, loggedIn, user });
    if (!main) return alert('Pedido confirmado: ' + facturaId);
    main.innerHTML = `
      <div class="pedido-confirmado">
        <i>✓</i>
        <h1>Pedido confirmado</h1>
        <p>Gracias, su pedido fue registrado correctamente.</p>
        <div class="pedido-numero">${facturaId}</div>
        <div class="pedido-acciones">
          <a href="/tienda/" class="btn-continuar-comprando">${loggedIn ? 'Seguir comprando' : 'Volver a la tienda'}</a>
          ${loggedIn ? '<button type="button" class="btn-logout" onclick="logout()">Salir y cerrar sesión</button>' : ''}
        </div>
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
  function abrirModal(tab) {
    const m = document.getElementById('auth-modal');
    if (m) { m.style.display = ''; m.classList.add('active'); }
    cambiarTab(tab);
  }
  function cerrarModal() {
    const m = document.getElementById('auth-modal');
    if (m) { m.classList.remove('active'); m.style.display = 'none'; }
    // limpiar posibles mensajes de error en los formularios
    const loginErr = document.getElementById('login-error'); if (loginErr) { loginErr.textContent = ''; loginErr.style.display = 'none'; }
    const registerErr = document.getElementById('register-error'); if (registerErr) { registerErr.textContent = ''; registerErr.style.display = 'none'; }
    const registerSuc = document.getElementById('register-success'); if (registerSuc) { registerSuc.textContent = ''; registerSuc.style.display = 'none'; }
  }
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
    const apiBase = (window.API_BASE || '').replace(/\/$/, '');
    try {
      const res = await fetch((apiBase || '') + '/tienda/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: email, password }) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (typeof abrirModal === 'function') abrirModal('login');
        const el = document.getElementById('login-error'); if (el) { el.textContent = data.message || 'Error autenticando'; el.style.display = 'block'; }
        showToast(data.message || 'Error autenticando', 'error');
        if (data.verificationPending) {
          const verifyModal = document.getElementById('verify-modal-store');
          const inputUser = document.getElementById('verify-usernameOrEmail-store');
          const errVerify = document.getElementById('verify-error-store');
          const verifyInstructions = document.getElementById('verify-instructions');
          if (inputUser) inputUser.value = email;
          if (verifyModal) verifyModal.classList.add('active');
          if (verifyInstructions) {
            verifyInstructions.textContent = data.tokenExpired
              ? 'Tu token expiró. Solicita reenvío del token y úsalo para verificar tu cuenta.'
              : 'Completa tu token de verificación para activar tu cuenta.';
          }
          if (errVerify) { errVerify.textContent = data.message || 'Cuenta no verificada'; errVerify.style.display = 'block'; }
        }
        return;
      }
      // merge saved address if server didn't return it
      try {
        const saved = localStorage.getItem('cn_saved_address_' + (data.user && (data.user.email || data.user.username) ? (data.user.email || data.user.username) : ''));
        if (saved && (!data.user.provincia && !data.user.direccion_exacta)) {
          const addr = JSON.parse(saved);
          data.user = Object.assign({}, data.user, addr || {});
        }
      } catch (e) { /* noop */ }
      localStorage.setItem('cn_token', data.token);
      localStorage.setItem('cn_user', JSON.stringify(data.user));
      updateAuthUI();
      cerrarModal();
    } catch (err) { console.error(err); const el = document.getElementById('login-error'); if (el) { el.textContent = 'Error de red'; el.style.display = 'block'; } }
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
    const provincia = form.querySelector('input[name="provincia"]') ? form.querySelector('input[name="provincia"]').value || '' : '';
    const ciudad = form.querySelector('input[name="ciudad"]') ? form.querySelector('input[name="ciudad"]').value || '' : '';
    const direccion = form.querySelector('input[name="direccion"]') ? form.querySelector('input[name="direccion"]').value || '' : '';
    const guardarDireccion = form.querySelector('input[name="guardarDireccion"]') ? !!form.querySelector('input[name="guardarDireccion"]').checked : false;
    const password = form.querySelector('input[name="password"]').value;
    const confirm = form.querySelector('input[name="confirmPassword"]').value;
    if (password !== confirm) {
      const el = document.getElementById('register-error'); if (el) { el.textContent = 'Las contraseñas no coinciden'; el.style.display = 'block'; }
      return;
    }
    try {
      const body = { username: email, email, password, nombres, apellidos, telefono };
      if (direccion || ciudad || provincia) { body.direccion = { provincia, ciudad, direccion }; body.saveAddress = guardarDireccion; }
      const res = await fetch('/register', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        const el = document.getElementById('register-error');
        if (res.status === 409) {
          if (el) {
            // Evitar inyectar directamente en `onclick`: crear el link y añadir listener
            el.innerHTML = '';
            const text = document.createTextNode('Este correo ya está registrado. ');
            const br = document.createElement('br');
            const link = document.createElement('a');
            link.href = '#';
            link.style.color = 'white';
            link.style.textDecoration = 'underline';
            link.style.fontWeight = 'bold';
            link.textContent = 'Haz clic aquí para verificar tu cuenta';
            link.addEventListener('click', function(ev) { ev.preventDefault(); window.tienda && window.tienda.irAVerificacion && window.tienda.irAVerificacion(email); });
            el.appendChild(text);
            el.appendChild(br);
            el.appendChild(link);
            el.style.display = 'block';
          }
        }
        else {
          if (el) { el.textContent = data.message || 'Error registrando'; el.style.display = 'block'; }
        }
        return;
      }
      const suc = document.getElementById('register-success'); if (suc) { suc.textContent = data.message || 'Cuenta creada. Revisa tu correo'; suc.style.display = 'block'; }
      // After successful registration, open the verification modal and pre-fill email
      openVerifyModalFromRegister(email);
      // guardar dirección localmente para autocompletar al loguear si el usuario eligió guardar
      try {
        if (guardarDireccion && email) {
          const addrObj = { provincia, ciudad, direccion_exacta: direccion };
          localStorage.setItem('cn_saved_address_' + email, JSON.stringify(addrObj));
        }
      } catch (e) { console.warn('No se pudo guardar dirección localmente', e); }
    } catch (err) { console.error(err); document.getElementById('register-error').textContent = 'Error de red'; }
  }

  function irAVerificacion(email) {
    cerrarModal();
    const verifyModal = document.getElementById('verify-modal-store');
    const inputUser = document.getElementById('verify-usernameOrEmail-store');
    if (inputUser) inputUser.value = email || '';
    if (verifyModal) {
      verifyModal.classList.add('active');
      // Solicitar reenvío automático para conveniencia del usuario
      setTimeout(() => { window.resendTokenStore && window.resendTokenStore(); }, 300);
    }
  }

  /**
   * Helper function to open the verification modal and pre-fill the email,
   * used after successful registration or when an existing email is detected.
   */
  function openVerifyModalFromRegister(email) {
    cerrarModal(); // Cerramos el modal de registro para evitar solapamiento
    const verifyModal = document.getElementById('verify-modal-store');
    const inputUser = document.getElementById('verify-usernameOrEmail-store');
    const inputToken = document.getElementById('verify-token-store');
    if (inputUser) inputUser.value = email || '';
    if (verifyModal) verifyModal.classList.add('active');
    if (inputToken) { inputToken.value = ''; setTimeout(()=>inputToken.focus(), 200); }
  }

  function openVerifyModalFromLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.querySelector('#auth-modal input[name="email"]')?.value?.trim();
    const verifyModal = document.getElementById('verify-modal-store');
    const inputUser = document.getElementById('verify-usernameOrEmail-store');
    if (inputUser) inputUser.value = email || '';
    if (verifyModal) verifyModal.classList.add('active');
    return false;
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
      // cerrar modal tras breve delay y también cerrar el modal de registro si está abierto
      setTimeout(()=>{
        document.getElementById('verify-modal-store')?.classList.remove('active');
        try { if (typeof cerrarModal === 'function') cerrarModal(); else document.getElementById('auth-modal')?.classList.remove('active'); } catch (e) { /* noop */ }
      }, 1200);
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
      const apiBase = (window.API_BASE || '').replace(/\/$/, '');
      const res = await fetch((apiBase || '') + '/resend-token', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ usernameOrEmail }) });
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

  /**
   * Guarda la dirección del cliente en la DB para futuras compras
   */
  async function actualizarPerfilDesdeCheckout() {
    const user = JSON.parse(localStorage.getItem('cn_user') || 'null');
    const token = localStorage.getItem('cn_token');
    if (!user || !token) return;

    const payload = {
        nombres: document.getElementById('nombres')?.value,
        apellidos: document.getElementById('apellidos')?.value,
        telefono: document.getElementById('telefono')?.value,
        provincia: document.getElementById('provincia')?.value,
        ciudad: document.getElementById('ciudad')?.value,
        direccion_exacta: document.getElementById('direccion_exacta')?.value
    };

    try {
        const res = await fetch('/tienda/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) localStorage.setItem('cn_user', JSON.stringify(data.user));
    } catch (e) { console.error('Error actualizando perfil', e); }
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
    if (user && (user.username || user.email)) {
      document.getElementById('auth-buttons') && (document.getElementById('auth-buttons').style.display = 'none');
      document.getElementById('user-menu') && (document.getElementById('user-menu').style.display = 'flex');
      document.getElementById('user-name') && (document.getElementById('user-name').textContent = user.username || user.email || 'Usuario');
      // si estamos en checkout, mostrar el formulario
      const form = document.getElementById('checkout-form');
      const placeholder = document.getElementById('login-required');
      if (form) form.style.display = '';
      if (placeholder) placeholder.style.display = 'none';
      // inicializar resumen si estamos en checkout
      if (typeof window.tienda !== 'undefined' && window.tienda.inicializarCheckout) window.tienda.inicializarCheckout();
      // completar campos del checkout con datos del usuario, si existen
      try {
        const userData = user || JSON.parse(localStorage.getItem('cn_user') || 'null');
        if (userData) {
          if (document.getElementById('nombres')) document.getElementById('nombres').value = userData.nombres || '';
          if (document.getElementById('apellidos')) document.getElementById('apellidos').value = userData.apellidos || '';
          if (document.getElementById('email') && (userData.email || userData.username)) document.getElementById('email').value = userData.email || userData.username || '';
          if (document.getElementById('telefono') && userData.telefono) document.getElementById('telefono').value = userData.telefono || '';
          if (document.getElementById('provincia')) document.getElementById('provincia').value = userData.provincia || '';
          if (document.getElementById('ciudad')) document.getElementById('ciudad').value = userData.ciudad || '';
          if (document.getElementById('direccion_exacta')) document.getElementById('direccion_exacta').value = userData.direccion_exacta || '';
        }
      } catch (e) { /* noop */ }
    } else {
      document.getElementById('auth-buttons') && (document.getElementById('auth-buttons').style.display = 'flex');
      document.getElementById('user-menu') && (document.getElementById('user-menu').style.display = 'none');
      document.getElementById('user-name') && (document.getElementById('user-name').textContent = '');
      // si estamos en checkout, ocultar el formulario
      const form2 = document.getElementById('checkout-form');
      const placeholder2 = document.getElementById('login-required');
      if (form2) form2.style.display = 'none';
      if (placeholder2) placeholder2.style.display = '';
    }
  }

  // Exponer funciones globales usadas por HTML inline
  window.tienda = {
    cargarProductos,
    buscarProductos,
    applyFilters,
    cargarDetalleProducto,
    agregarAlCarrito,
    actualizarUIcarrito,
    procederAlPago,
    aplicarDescuento,
    inicializarCheckout: function() {
      // proteger en caso de llamadas desde páginas que no contienen elementos de checkout
      initShipping();
      const resumenItems = document.getElementById('resumen-items');
      if (!resumenItems) return; // nada que hacer fuera del checkout
      const cart = getCart();
      let subtotal = 0;
      resumenItems.innerHTML = '';
      cart.forEach(it => {
        const row = document.createElement('div');
        row.className = 'resumen-item';
        const itemSubtotal = Number(it.precio) * Number(it.cantidad || 0);
        subtotal += itemSubtotal;
        const tallaText = it.talla ? ` (Talla: ${it.talla})` : '';
        row.innerHTML = `<span>${it.nombre}${tallaText} x ${it.cantidad}</span><span>${formatCurrency(itemSubtotal)}</span>`;
        resumenItems.appendChild(row);
      });
      const descuentoMonto = currentDiscount ? (subtotal * (currentDiscount.porcentaje / 100)) : 0;
      const base = subtotal - descuentoMonto;
      const iva = Number((base * IVA_RATE).toFixed(2));
      const shippingCostToUse = typeof shippingCost === 'number' ? shippingCost : SHIPPING_BASE;
      const total = Number((base + iva + shippingCostToUse).toFixed(2));
      const subtotalEl = document.getElementById('resumen-subtotal'); if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
      const shippingEl = document.getElementById('resumen-shipping'); if (shippingEl) shippingEl.textContent = formatCurrency(shippingCostToUse);
      const descuentoRow = document.getElementById('resumen-descuento-row');
      const descuentoEl = document.getElementById('resumen-descuento');
      if (currentDiscount) {
        if (descuentoRow) descuentoRow.style.display = '';
        if (descuentoEl) descuentoEl.textContent = `- ${formatCurrency(descuentoMonto)}`;
      } else {
        if (descuentoRow) descuentoRow.style.display = 'none';
      }
      // mostrar IVA y total
      let ivaRow = document.getElementById('resumen-iva-row');
      if (!ivaRow) {
        const div = document.createElement('div');
        div.className = 'resumen-item';
        div.id = 'resumen-iva-row';
        div.innerHTML = `<span>IVA (${Math.round(IVA_RATE*100)}%)</span><span id="resumen-iva">C$ 0.00</span>`;
        const container = document.querySelector('.checkout-resumen');
        const reference = document.querySelector('.resumen-item.total');
        if (container && reference) container.insertBefore(div, reference);
      }
      const ivaEl = document.getElementById('resumen-iva'); if (ivaEl) ivaEl.textContent = formatCurrency(iva);
      const totalEl = document.getElementById('resumen-total'); if (totalEl) totalEl.textContent = formatCurrency(total);
      const deliveryRadios = document.querySelectorAll('input[name="modo_entrega"]');
      deliveryRadios.forEach(radio => radio.addEventListener('change', updateDeliveryMethod));
      updateDeliveryMethod();
      // Bind form
      const form = document.getElementById('checkout-form');
      if (form) form.onsubmit = procesarPedido;
      actualizarCartCount();
    },
    cambiarCantidad,
    eliminarItem,
    vaciarCarrito,
    quitarDescuento,
    abrirModal,
    cerrarModal,
    cambiarTab,
    handleLogin,
    handleRegister,
    openVerifyModalFromLogin,
    irAVerificacion,
    logout
  };

  // Exponer atajos globales para compatibilidad con handlers inline en HTML
  window.abrirModal = abrirModal;
  window.cerrarModal = cerrarModal;
  window.cambiarTab = cambiarTab;
  window.logout = function(){ window.tienda.logout(); };
  // Compatibilidad: si estamos en la página de detalle, cambiar el input cantidad;
  // This function is exposed globally for compatibility with inline HTML event handlers.
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
  window.cargarProductos = function(){ return (allProducts && allProducts.length && window.tienda.applyFilters) ? window.tienda.applyFilters() : window.tienda.cargarProductos(); };
  window.buscarProductos = function(){ return window.tienda.buscarProductos(); };
  window.procederAlPago = function(){ return window.tienda.procederAlPago(); };
  // navegación rápida al carrito desde el navbar
  window.irAlCarrito = function(){ window.location.href = '/tienda/carrito.html'; };
  // Exponer handlers de auth usados en los formularios inline
  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;
  window.handleVerifyStore = handleVerifyStore;
  window.resendTokenStore = resendTokenStore;
  window.openVerifyModalFromLogin = openVerifyModalFromLogin;
  window.openVerifyModalFromRegister = openVerifyModalFromRegister;
  // Exponer aplicarDescuento para botones inline (ej. carrito)
  window.aplicarDescuento = function() { return window.tienda.aplicarDescuento(); };
  // Exponer quitarDescuento
  window.quitarDescuento = function() { return window.tienda.quitarDescuento && window.tienda.quitarDescuento(); };
  // Exponer inicializarCheckout y procesarPedido para checkout.html
  window.inicializarCheckout = function() { return window.tienda.inicializarCheckout && window.tienda.inicializarCheckout(); };
  window.procesarPedido = function(e) { return typeof procesarPedido === 'function' ? procesarPedido(e) : null; };
  // Exponer vaciarCarrito para uso en HTML
  window.vaciarCarrito = function() { return window.tienda.vaciarCarrito && window.tienda.vaciarCarrito(); };

  // Auto-init según página
  document.addEventListener('DOMContentLoaded', async () => {
    // restaurar descuento aplicado (persistido en localStorage)
    try {
      const stored = localStorage.getItem('cn_discount');
      if (stored && localStorage.getItem('cn_discount_applied') === '1') {
        const parsed = JSON.parse(stored);
        if (parsed) {
          // Si viene con id, validamos por id; si viene con codigo (texto), validamos por código.
          const tryFetchBy = parsed.id ? ('id=' + encodeURIComponent(parsed.id)) : (parsed.codigo ? ('codigo=' + encodeURIComponent(parsed.codigo)) : null);
          if (!tryFetchBy || Number(parsed.porcentaje) <= 0) {
            localStorage.removeItem('cn_discount'); localStorage.removeItem('cn_discount_applied'); currentDiscount = null;
          } else {
            try {
              const resp = await fetch('/api/codigos?' + tryFetchBy);
              const codigoResp = await resp.json();
              const porcentaje = codigoResp && (codigoResp.porcentaje_descuento !== undefined ? Number(codigoResp.porcentaje_descuento) : (codigoResp.porcentaje !== undefined ? Number(codigoResp.porcentaje) : null));
              if (codigoResp && codigoResp.id && porcentaje !== null && porcentaje > 0) {
                currentDiscount = { id: codigoResp.id, porcentaje };
                const cart = getCart();
                const subtotal = cart.reduce((s,i) => s + (Number(i.precio) * Number(i.cantidad || 0)), 0);
                const monto = subtotal * (Number(currentDiscount.porcentaje) / 100);
                const disp = document.getElementById('descuento-aplicado');
                if (disp) disp.textContent = `- ${formatCurrency(monto)} (${currentDiscount.porcentaje}%)`;
                document.getElementById('fila-descuento') && (document.getElementById('fila-descuento').style.display = '');
                const quitarBtn = document.getElementById('quitar-descuento-btn'); if (quitarBtn) quitarBtn.style.display = '';
              } else {
                // código no válido según servidor
                localStorage.removeItem('cn_discount'); localStorage.removeItem('cn_discount_applied'); currentDiscount = null;
              }
            } catch (srvErr) {
              console.warn('No se pudo validar código de descuento remoto:', srvErr);
              localStorage.removeItem('cn_discount'); localStorage.removeItem('cn_discount_applied'); currentDiscount = null;
            }
          }
        } else { localStorage.removeItem('cn_discount'); localStorage.removeItem('cn_discount_applied'); currentDiscount = null; }
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
      const user = JSON.parse(localStorage.getItem('cn_user') || 'null');
      const token = localStorage.getItem('cn_token');
      const form = document.getElementById('checkout-form');
      const placeholder = document.getElementById('login-required');
      if (!user || !token) {
        if (form) form.style.display = 'none';
        if (placeholder) placeholder.style.display = '';
        abrirModal('login');
      } else {
        if (form) form.style.display = '';
        if (placeholder) placeholder.style.display = 'none';
        window.tienda.inicializarCheckout();
      }
    }
    // bind metodo_pago change to show payment detail sections
    const metodoEl = document.getElementById('metodo_pago');
    if (metodoEl) {
      function togglePaymentSections() {
        const val = metodoEl.value;
        const trans = document.getElementById('transferencia-section');
        const bille = document.getElementById('billetera-section');
        if (trans) trans.style.display = val === 'transferencia' ? '' : 'none';
        if (bille) bille.style.display = val === 'pago_movil' ? '' : 'none';
      }
      metodoEl.addEventListener('change', togglePaymentSections);
      // initial
      togglePaymentSections();
    }
    // Listener para links de verificación (evitar onclick inline)
    document.querySelectorAll('.link-verify-from-login').forEach(link => {
      link.addEventListener('click', function(ev) {
        ev.preventDefault();
        openVerifyModalFromLogin(ev);
      });
    });
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
