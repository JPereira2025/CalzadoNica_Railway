// --- VERSIÓN 2.1 - COMPLETA Y CORREGIDA CON FALLBACKS ---

// Configuración de la API
const API_BASE = 'http://localhost/Zapatos/endpoints/';

// Estado global de la aplicación
let currentUser = null;
let carritoFactura = [];
let descuentoAplicado = { porcentaje: 0, codigo: '' };
let facturaIdCounter = 1; // contador para generar IDs de factura

// Inicialización de la aplicación
 $(document).ready(function() {
    checkSession();
    setupEventListeners();
    loadDashboardStats();
    setupCarousel();
});

// --- VERIFICACIÓN DE SESIÓN ---
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    } else {
        showLogin();
    }
}

function showApp() {
    $("#loginModal").hide();
    $("#app").show();
    $("#user-name").text(currentUser.username);
    $("#user-role").text(currentUser.role);
}

function showLogin() {
    $("#app").hide();
    $("#loginModal").show();
}

// --- CONFIGURACIÓN DE EVENTOS ---
function setupEventListeners() {
    // Login y Logout
    $("#loginForm").on("submit", handleLogin);
    $("#logout-btn").on("click", handleLogout);

    // Navegación: delegación segura
    $(document).on("click", "a.sidebar-link", handleNavigation);

    // Modales
    $(document).on("click", ".modal-close", function() {
        $(this).closest('.modal').fadeOut(200);
    });

    // Módulos
    setupEmpleadosListeners();
    setupCategoriasListeners();
    setupEstilosListeners();
    setupProductosListeners();
    setupCodigosListeners();
    setupFacturacionListeners();
    setupUsuariosListeners();
}

// --- LÓGICA DE LOGIN ---
function handleLogin(e) {
    e.preventDefault();
    const username = $("#username").val().trim();
    const password = $("#password").val();

    const $submitBtn = $(e.target).find('button[type="submit"]');
    $submitBtn.prop('disabled', true).text('Iniciando...');

    apiCall('login.php', 'POST', { username, password })
        .then(response => {
            if (response.success) {
                currentUser = response.user;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                showNotification(`Bienvenido, ${currentUser.username}!`, "success");
                showApp();
            } else {
                $("#loginError").removeClass("hidden").text(response.message || 'Error al iniciar sesión');
            }
        })
        .fail(() => showNotification('Error de conexión. Revisa la consola (F12).', 'error'))
        .always(() => $submitBtn.prop('disabled', false).text('Iniciar Sesión'));
}

function handleLogout(e) {
    e.preventDefault();
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    showLogin();
}

// --- LÓGICA DE NAVEGACIÓN (robusta) ---
function handleNavigation(e) {
    e = e || window.event;
    let $anchor = null;
    if (e.currentTarget && e.currentTarget.tagName && e.currentTarget.tagName.toUpperCase() === 'A') {
        $anchor = $(e.currentTarget);
    } else {
        $anchor = $(e.target).closest('a[href]');
    }
    if (!$anchor || $anchor.length === 0) return;

    const href = ($anchor.attr && $anchor.attr('href')) || '';
    if (!href) return;

    if (href.charAt(0) === '#') e.preventDefault();

    let target = '';
    if (href.indexOf('#') !== -1) {
        target = href.split('#').pop() || '';
    } else {
        try {
            const url = new URL(href, window.location.origin);
            target = (url.hash || '').replace('#', '');
        } catch (err) {
            target = href.replace(/^.*#/, '');
        }
    }
    if (!target) return;

    navigateTo(target);
}

function navigateTo(page) {
    if (!page) page = 'dashboard';
    page = String(page).replace(/^#/, '');
    $(".page").hide();
    $(`#${page}-page`).show();
    $("#page-title").text(capitalizeFirstLetter(page));
    $(".sidebar-link").removeClass("active");
    $(`a[href="#${page}"]`).addClass("active");

    if (page === 'facturacion') {
        resetFacturaForm();
        loadFacturas();
    } else if (page === 'dashboard') {
        loadDashboardStats();
    } else if (page === 'empleados') {
        loadEmpleados();
    } else if (page === 'categorias') {
        loadCategorias();
    } else if (page === 'estilos') {
        loadEstilos();
    } else if (page === 'productos') {
        loadProductos();
    } else if (page === 'codigos') {
        loadCodigos();
    } else if (page === 'usuarios') {
        loadUsuarios();
    }
}

// --- FUNCIONES AUXILIARES ---
function apiCall(endpoint, method = 'GET', data = null) {
    return $.ajax({
        url: `${API_BASE}${endpoint}`,
        method: method,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json',
        dataType: 'json'
    });
}

function showNotification(message, type = 'info') {
    const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
    
    const notificationId = 'notification-' + Date.now();

    const notification = $(`
        <div id="${notificationId}" class="${colors[type]} text-white p-4 rounded-lg shadow-lg mb-4 flex items-center justify-between relative" style="z-index: 9999;">
            <div class="flex items-center">
                <i class="fas fa-${icons[type]} mr-3"></i>
                <span>${message}</span>
            </div>
            <button class="ml-4 text-white hover:text-gray-200 notification-close" title="Cerrar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `);

    $("#notification-area").append(notification);

    notification.find('.notification-close').on('click', function() {
        notification.slideUp(300, function() { $(this).remove(); });
    });

    setTimeout(() => {
        notification.slideUp(300, function() { $(this).remove(); });
    }, 6000);
}

function capitalizeFirstLetter(string) {
    return String(string).charAt(0).toUpperCase() + String(string).slice(1);
}

// --- FUNCIONES DE MODALES Y FORMULARIOS ---
function resetForm(formSelector, idSelector) {
    const $form = $(formSelector);
    if ($form && $form.length) {
        $form[0].reset();
    }
    if (idSelector) {
        $(idSelector).val('');
    }
}

function openModal(modalId) {
    $(modalId).fadeIn(200);
}

// --- FUNCIONES DE CARGA Y RENDERIZADO CON FALLBACK ---
function loadEmpleados() {
    apiCall('empleados.php')
        .done(empleados => {
            localStorage.setItem('empleados', JSON.stringify(empleados));
            renderTable('empleados-table-body', empleados, renderEmpleadoRow);
        })
        .fail(() => {
            console.warn("API falló, cargando empleados desde localStorage.");
            const empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
            renderTable('empleados-table-body', empleados, renderEmpleadoRow);
            if (empleados.length > 0) {
                showNotification('Usando datos locales de empleados. La conexión con el servidor falló.', 'info');
            } else {
                showNotification('No hay datos de empleados locales y el servidor no responde.', 'error');
            }
        });
}

function loadCategorias() {
    apiCall('categorias.php')
        .done(categorias => {
            localStorage.setItem('categorias', JSON.stringify(categorias));
            renderTable('categorias-table-body', categorias, renderCategoriaRow);
            populateDropdowns();
        })
        .fail(() => {
            const categorias = JSON.parse(localStorage.getItem('categorias') || '[]');
            renderTable('categorias-table-body', categorias, renderCategoriaRow);
            if (categorias.length > 0) showNotification('Usando datos locales de categorías.', 'info');
            else showNotification('No hay datos locales de categorías.', 'error');
        });
}

function loadEstilos() {
    apiCall('estilos.php')
        .done(estilos => {
            localStorage.setItem('estilos', JSON.stringify(estilos));
            renderTable('estilos-table-body', estilos, renderEstiloRow);
            populateDropdowns();
        })
        .fail(() => {
            const estilos = JSON.parse(localStorage.getItem('estilos') || '[]');
            renderTable('estilos-table-body', estilos, renderEstiloRow);
            if (estilos.length > 0) showNotification('Usando datos locales de estilos.', 'info');
            else showNotification('No hay datos locales de estilos.', 'error');
        });
}

function loadProductos() {
    apiCall('productos.php')
        .done(productos => {
            localStorage.setItem('productos', JSON.stringify(productos));
            renderTable('productos-table-body', productos, renderProductoRow);
            populateFacturaProductoSelect();
        })
        .fail(() => {
            const productos = JSON.parse(localStorage.getItem('productos') || '[]');
            renderTable('productos-table-body', productos, renderProductoRow);
            if (productos.length > 0) showNotification('Usando datos locales de productos.', 'info');
            else showNotification('No hay datos locales de productos.', 'error');
        });
}

function loadCodigos() {
    apiCall('codigos.php')
        .done(codigos => {
            localStorage.setItem('codigos', JSON.stringify(codigos));
            renderTable('codigos-table-body', codigos, renderCodigoRow);
        })
        .fail(() => {
            const codigos = JSON.parse(localStorage.getItem('codigos') || '[]');
            renderTable('codigos-table-body', codigos, renderCodigoRow);
            if (codigos.length > 0) showNotification('Usando datos locales de códigos.', 'info');
            else showNotification('No hay datos locales de códigos.', 'error');
        });
}

function loadUsuarios() {
    apiCall('usuarios.php')
        .done(usuarios => {
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            renderTable('usuarios-table-body', usuarios, renderUsuarioRow);
        })
        .fail(() => {
            const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            renderTable('usuarios-table-body', usuarios, renderUsuarioRow);
            if (usuarios.length > 0) showNotification('Usando datos locales de usuarios.', 'info');
            else showNotification('No hay datos locales de usuarios.', 'error');
        });
}

// --- FUNCIONES DE RENDERIZADO ---
function renderEmpleadoRow(empleado) {
    return `
        <tr data-id="${empleado.id}">
            <td class="py-3 px-4">${empleado.id}</td>
            <td class="py-3 px-4">${empleado.nombres}</td>
            <td class="py-3 px-4">${empleado.apellidos}</td>
            <td class="py-3 px-4">C$${parseFloat(empleado.sueldo_base || 0).toFixed(2)}</td>
            <td class="py-3 px-4">${empleado.fecha_nacimiento || ''}</td>
            <td class="py-3 px-4">${empleado.cedula || ''}</td>
            <td class="py-3 px-4">${empleado.sexo || ''}</td>
            <td class="py-3 px-4">${empleado.estado_civil || ''}</td>
            <td class="py-3 px-4">${empleado.telefono || ''}</td>
            <td class="py-3 px-4">${empleado.direccion || ''}</td>
            <td class="py-3 px-4">${empleado.cargo || ''}</td>
            <td class="py-3 px-4 text-center">
                <button class="btn-edit-empleado text-blue-600 hover:text-blue-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-empleado text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;
}

function renderCategoriaRow(categoria) {
    return `
        <tr data-id="${categoria.id}">
            <td class="py-3 px-4">${categoria.id}</td>
            <td class="py-3 px-4">${categoria.nombre}</td>
            <td class="py-3 px-4">${categoria.descripcion || ''}</td>
            <td class="py-3 px-4 text-center">
                <button class="btn-edit-categoria text-green-600 hover:text-green-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-categoria text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;
}

function renderEstiloRow(estilo) {
    return `
        <tr data-id="${estilo.id}">
            <td class="py-3 px-4">${estilo.id}</td>
            <td class="py-3 px-4">${estilo.nombre}</td>
            <td class="py-3 px-4">${estilo.descripcion || ''}</td>
            <td class="py-3 px-4 text-center">
                <button class="btn-edit-estilo text-purple-600 hover:text-purple-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-estilo text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;
}

function renderProductoRow(producto) {
    const precioNum = parseFloat(producto.precio || 0);
    const precioFormateado = precioNum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `
        <tr data-id="${producto.id}">
            <td class="py-3 px-4">${producto.id}</td>
            <td class="py-3 px-4">${producto.marca || ''}</td>
            <td class="py-3 px-4">${producto.modelo || ''}</td>
            <td class="py-3 px-4">${producto.talla || ''}</td>
            <td class="py-3 px-4">${producto.color || ''}</td>
            <td class="py-3 px-4">C$${precioFormateado}</td>
            <td class="py-3 px-4">${producto.stock || 0}</td>
            <td class="py-3 px-4">${producto.categoria_nombre || ''}</td>
            <td class="py-3 px-4">${producto.estilo_nombre || ''}</td>
            <td class="py-3 px-4 text-center">
                <button class="btn-edit-producto text-indigo-600 hover:text-indigo-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-producto text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;
}

function renderCodigoRow(codigo) {
    const estadoBadge = codigo.estado == 1 ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>' : '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactivo</span>';
    return `
        <tr data-id="${codigo.id}">
            <td class="py-3 px-4">${codigo.id}</td>
            <td class="py-3 px-4 font-mono font-bold">${codigo.codigo}</td>
            <td class="py-3 px-4">${codigo.porcentaje_descuento}%</td>
            <td class="py-3 px-4">${codigo.fecha_inicio || ''}</td>
            <td class="py-3 px-4">${codigo.fecha_fin || ''}</td>
            <td class="py-3 px-4">${estadoBadge}</td>
            <td class="py-3 px-4">${codigo.descripcion || ''}</td>
            <td class="py-3 px-4 text-center">
                <button class="btn-edit-codigo text-orange-600 hover:text-orange-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-codigo text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;
}

function renderUsuarioRow(usuario) {
    return `
        <tr data-id="${usuario.id}">
            <td class="py-3 px-4">${usuario.username}</td>
            <td class="py-3 px-4">${usuario.role}</td>
            <td class="py-3 px-4 text-center">
                <button class="btn-edit-usuario text-blue-600 hover:text-blue-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-usuario text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;
}

// --- LÓGICA DE FACTURACIÓN ---
function loadFacturas() {
    const facturasGuardadas = JSON.parse(localStorage.getItem('facturas_guardadas') || '[]');
    renderTable('facturas-table-body', facturasGuardadas, renderFacturaRow);
}

function renderFacturaRow(factura) {
    return `
        <tr data-id="${factura.id}">
            <td class="py-3 px-4">${factura.id}</td>
            <td class="py-3 px-4">${factura.cliente}</td>
            <td class="py-3 px-4">${factura.fecha}</td>
            <td class="py-3 px-4">${factura.vendedor}</td>
            <td class="py-3 px-4 text-right font-semibold">${factura.total}</td>
            <td class="py-3 px-4 text-center">
                <button class="btn-ver-factura text-blue-600 hover:text-blue-800 mx-1" title="Ver" data-id="${factura.id}"><i class="fas fa-eye"></i></button>
                <button class="btn-eliminar-factura text-red-600 hover:text-red-800 mx-1" title="Eliminar" data-id="${factura.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `;
}

function resetFacturaForm() {
    carritoFactura = [];
    descuentoAplicado = { porcentaje: 0, codigo: '' };
    const $form = $("#form-factura");
    if ($form && $form.length) $form[0].reset();
    $("#factura-iva").prop('checked', true);
    $("#factura-numero").val(generateFacturaId());
    $("#factura-fecha").val(new Date().toLocaleString('es-ES'));
    $("#factura-vendedor").val(currentUser ? currentUser.username : '');
    renderizarTablaFactura();
    calcularTotales();
}

function generateFacturaId() {
    const dayNames = { 0: 'DO', 1: 'LU', 2: 'MA', 3: 'MI', 4: 'JU', 5: 'VI', 6: 'SA' };
    const dayAbbr = dayNames[new Date().getDay()] || 'NA';
    const counter = String(facturaIdCounter++).padStart(6, '0');
    return `FAC-${counter}-${dayAbbr}`;
}

function agregarProductoAFactura() {
    const productoId = $("#factura-producto-select").val();
    const cantidad = parseInt($("#factura-cantidad").val(), 10) || 0;
    if (!productoId || cantidad <= 0) {
        showNotification("Seleccione un producto y una cantidad válida.", "error");
        return;
    }
    const $selectedOption = $("#factura-producto-select option:selected");
    const nombreProducto = $selectedOption.text();
    const precioUnitario = parseFloat($selectedOption.data('precio')) || 0;
    const itemExistente = carritoFactura.find(item => item.id === productoId);
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carritoFactura.push({ id: productoId, nombre: nombreProducto, precio: precioUnitario, cantidad: cantidad });
    }
    $("#factura-producto-select").val('');
    $("#factura-cantidad").val(1);
    renderizarTablaFactura();
    calcularTotales();
}

function renderizarTablaFactura() {
    const $tbody = $("#factura-items-body");
    if (!$tbody || $tbody.length === 0) return;
    $tbody.empty();
    carritoFactura.forEach((item, index) => {
        const subtotal = (item.precio || 0) * (item.cantidad || 0);
        const row = `
            <tr>
                <td class="py-2 px-4">${item.nombre}</td>
                <td class="py-2 px-4">C$${(item.precio || 0).toFixed(2)}</td>
                <td class="py-2 px-4">${item.cantidad}</td>
                <td class="py-2 px-4">C$${subtotal.toFixed(2)}</td>
                <td class="py-2 px-4 text-center">
                    <button class="btn-eliminar-item-factura text-red-600 hover:text-red-800" data-index="${index}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        $tbody.append(row);
    });
}

function calcularTotales() {
    let subtotal = 0;
    carritoFactura.forEach(item => {
        subtotal += (item.precio || 0) * (item.cantidad || 0);
    });
    const montoDescuento = subtotal * (descuentoAplicado.porcentaje / 100);
    const subtotalConDescuento = subtotal - montoDescuento;
    const iva = $("#factura-iva").is(':checked') ? subtotalConDescuento * 0.15 : 0;
    const total = subtotalConDescuento + iva;
    $("#factura-subtotal").text(`C$${subtotal.toFixed(2)}`);
    $("#factura-monto-descuento").text(`-C$${montoDescuento.toFixed(2)}`);
    $("#factura-iva-monto").text(`C$${iva.toFixed(2)}`);
    $("#factura-total").text(`C$${total.toFixed(2)}`);
}

function guardarFactura(e) {
    e.preventDefault();
    if (carritoFactura.length === 0) {
        showNotification("Debe agregar al menos un producto a la factura.", "error");
        return;
    }
    const factura = {
        id: $("#factura-numero").val(),
        cliente: $("#factura-cliente").val(),
        vendedor: $("#factura-vendedor").val(),
        fecha: $("#factura-fecha").val(),
        items: [...carritoFactura],
        descuento: { ...descuentoAplicado },
        iva: $("#factura-iva").is(':checked'),
        subtotal: $("#factura-subtotal").text(),
        total: $("#factura-total").text()
    };
    const facturasGuardadas = JSON.parse(localStorage.getItem('facturas_guardadas') || '[]');
    const nuevasFacturas = [...facturasGuardadas, factura];
    localStorage.setItem('facturas_guardadas', JSON.stringify(nuevasFacturas));
    renderizarTablaFacturasGuardadas();
    showNotification(`Factura ${factura.id} guardada correctamente.`, "success");
    resetFacturaForm();
}

function renderizarTablaFacturasGuardadas() {
    const facturasGuardadas = JSON.parse(localStorage.getItem('facturas_guardadas') || '[]');
    renderTable('facturas-table-body', facturasGuardadas, renderFacturaRow);
}

function verFactura(id) {
    const facturasGuardadas = JSON.parse(localStorage.getItem('facturas_guardadas') || '[]');
    const factura = facturasGuardadas.find(f => f.id === id);
    if (!factura) return showNotification("Factura no encontrada", "error");

    let descuentoHtml = '';
    if (factura.descuento && factura.descuento.codigo) {
        const subtotalNum = parseFloat(String(factura.subtotal).replace(/[^0-9.\-]/g, '')) || 0;
        const porcentaje = Number(factura.descuento.porcentaje) || 0;
        const descuentoMonto = subtotalNum * (porcentaje / 100);
        descuentoHtml = `<p>Descuento (${factura.descuento.codigo}): -C$${descuentoMonto.toFixed(2)}</p>`;
    }

    const itemsHtml = (factura.items || []).map(item => `
        <tr>
            <td class="py-2 px-4">${item.nombre}</td>
            <td class="py-2 px-4">C$${parseFloat(item.precio || 0).toFixed(2)}</td>
            <td class="py-2 px-4">${item.cantidad}</td>
            <td class="py-2 px-4">C$${(parseFloat(item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</td>
            <td class="py-2 px-4 text-center"><button class="text-red-600">Eliminar</button></td>
        </tr>
    `).join('');

    const content = `
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div><strong>N° Factura:</strong> ${factura.id}</div>
            <div><strong>Fecha:</strong> ${factura.fecha}</div>
            <div><strong>Cliente:</strong> ${factura.cliente}</div>
            <div><strong>Vendedor:</strong> ${factura.vendedor}</div>
        </div>
        <table class="min-w-full bg-white border border-gray-200 mb-4">
            <thead class="bg-gray-50">
                <tr>
                    <th class="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</th>
                    <th class="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">P. Unitario</th>
                    <th class="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cantidad</th>
                    <th class="py-2 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Subtotal</th>
                    <th class="py-2 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div class="text-right">
            <p class="text-sm text-gray-600">Subtotal: ${factura.subtotal}</p>
            ${descuentoHtml}
            <p>IVA (15%): ${factura.iva ? $("#factura-iva-monto").text() : 'C$0.00'}</p>
            <p class="text-lg font-bold text-gray-800 pt-2 border-t">Total: ${factura.total}</p>
        </div>
    `;
    $("#ver-factura-content").html(content);
    $("#modal-ver-factura").fadeIn(200);
}

function eliminarFactura(id) {
    const facturasGuardadas = JSON.parse(localStorage.getItem('facturas_guardadas') || '[]');
    const nuevasFacturas = facturasGuardadas.filter(f => f.id !== id);
    localStorage.setItem('facturas_guardadas', JSON.stringify(nuevasFacturas));
    renderizarTablaFacturasGuardadas();
    showNotification("Factura eliminada.", "success");
}

// --- LÓGICA DE MÓDULOS COMPLETA ---

// --- EMPLEADOS ---
function setupEmpleadosListeners() {
    $('#btn-add-empleado').on('click', () => openEmpleadoModal());
    $(document).on('click', '.btn-edit-empleado', function() {
        const id = $(this).closest('tr').data('id');
        openEmpleadoModal(id);
    });
    $(document).on('click', '.btn-delete-empleado', function() {
        const id = $(this).closest('tr').data('id');
        if (!id) return;
        if (!confirm('¿Eliminar empleado?')) return;
        apiCall(`empleados.php?id=${id}`, 'DELETE').done(resp => {
            showNotification(resp.message || 'Empleado eliminado', resp.success ? 'success' : 'error');
            loadEmpleados();
        }).fail(() => {
            let arr = JSON.parse(localStorage.getItem('empleados') || '[]');
            arr = arr.filter(e => e.id != id);
            localStorage.setItem('empleados', JSON.stringify(arr));
            loadEmpleados();
            showNotification('Empleado eliminado (local)', 'success');
        });
    });
    $('#form-empleado').on('submit', handleEmpleadoSubmit);
}

function openEmpleadoModal(id = null) {
    resetForm('#form-empleado', '#empleado-id-form');
    $('#modal-empleado-title').text(id ? 'Editar Empleado' : 'Nuevo Empleado');
    if (id) {
        apiCall(`empleados.php?id=${id}`).done(data => {
            const emp = Array.isArray(data) ? data[0] : data;
            if (emp) {
                $('#empleado-id-form').val(emp.id || id);
                $('#empleado-nombres').val(emp.nombres || '');
                $('#empleado-apellidos').val(emp.apellidos || '');
                $('#empleado-sueldo').val(emp.sueldo ?? emp.sueldo_base ?? '');
                $('#empleado-nacimiento').val(emp.nacimiento || emp.fecha_nacimiento || '');
                $('#empleado-cedula').val(emp.cedula || '');
                $('#empleado-sexo').val(emp.sexo || '');
                $('#empleado-estado').val(emp.estado_civil || '');
                $('#empleado-telefono').val(emp.telefono || '');
                $('#empleado-direccion').val(emp.direccion || '');
                $('#empleado-cargo').val(emp.cargo || '');
            }
        }).fail(() => {
            const arr = JSON.parse(localStorage.getItem('empleados') || '[]');
            const emp = arr.find(x => x.id == id);
            if (emp) {
                $('#empleado-id-form').val(emp.id || id);
                $('#empleado-nombres').val(emp.nombres || '');
                $('#empleado-apellidos').val(emp.apellidos || '');
                $('#empleado-sueldo').val(emp.sueldo || '');
                $('#empleado-nacimiento').val(emp.nacimiento || '');
                $('#empleado-cedula').val(emp.cedula || '');
                $('#empleado-sexo').val(emp.sexo || '');
                $('#empleado-estado').val(emp.estado_civil || '');
                $('#empleado-telefono').val(emp.telefono || '');
                $('#empleado-direccion').val(emp.direccion || '');
                $('#empleado-cargo').val(emp.cargo || '');
            }
        });
    }
    $('#modal-empleado').fadeIn(200);
}

function handleEmpleadoSubmit(e) {
    e.preventDefault();
    const id = $('#empleado-id-form').val() || undefined;
    const payload = {
        id: id,
        nombres: $('#empleado-nombres').val().trim(),
        apellidos: $('#empleado-apellidos').val().trim(),
        sueldo: parseFloat($('#empleado-sueldo').val()) || 0,
        nacimiento: $('#empleado-nacimiento').val() || '',
        cedula: $('#empleado-cedula').val().trim(),
        sexo: $('#empleado-sexo').val() || '',
        estado_civil: $('#empleado-estado').val() || '',
        telefono: $('#empleado-telefono').val() || '',
        direccion: $('#empleado-direccion').val() || '',
        cargo: $('#empleado-cargo').val() || ''
    };
    const method = id ? 'PUT' : 'POST';
    apiCall(`empleados.php`, method, payload).done(resp => {
        if (resp && resp.success) {
            $('#modal-empleado').fadeOut(200);
            showNotification(resp.message || 'Empleado guardado', 'success');
            loadEmpleados();
            return;
        }
        showNotification(resp.message || 'Error al guardar empleado', 'error');
    }).fail(() => {
        let arr = JSON.parse(localStorage.getItem('empleados') || '[]');
        if (id) {
            arr = arr.map(x => x.id == id ? { ...x, ...payload } : x);
        } else {
            payload.id = payload.id || 'EMP-' + Date.now();
            arr.push(payload);
        }
        localStorage.setItem('empleados', JSON.stringify(arr));
        $('#modal-empleado').fadeOut(200);
        loadEmpleados();
        showNotification('Empleado guardado localmente', 'success');
    });
}

// --- CATEGORÍAS ---
function setupCategoriasListeners() {
    $('#btn-add-categoria').on('click', () => openCategoriaModal());
    $(document).on('click', '.btn-edit-categoria', function() {
        const id = $(this).closest('tr').data('id');
        openCategoriaModal(id);
    });
    $(document).on('click', '.btn-delete-categoria', function() {
        const id = $(this).closest('tr').data('id');
        if (!id) return;
        if (!confirm('¿Eliminar categoría?')) return;
        apiCall(`categorias.php?id=${id}`, 'DELETE').done(resp => {
            showNotification(resp.message || 'Categoría eliminada', resp.success ? 'success' : 'error');
            loadCategorias();
        }).fail(() => {
            let arr = JSON.parse(localStorage.getItem('categorias') || '[]');
            arr = arr.filter(e => e.id != id);
            localStorage.setItem('categorias', JSON.stringify(arr));
            loadCategorias();
            showNotification('Categoría eliminada (local)', 'success');
        });
    });
    $('#form-categoria').on('submit', handleCategoriaSubmit);
}

function openCategoriaModal(id = null) {
    resetForm('#form-categoria', '#categoria-id-form');
    $('#modal-categoria-title').text(id ? 'Editar Categoría' : 'Nueva Categoría');
    if (id) {
        apiCall(`categorias.php?id=${id}`).done(data => {
            const cat = Array.isArray(data) ? data[0] : data;
            if (cat) {
                $('#categoria-id-form').val(cat.id || id);
                $('#categoria-nombre').val(cat.nombre || '');
                $('#categoria-descripcion').val(cat.descripcion || '');
            }
        }).fail(() => {
            const arr = JSON.parse(localStorage.getItem('categorias') || '[]');
            const cat = arr.find(x => x.id == id);
            if (cat) {
                $('#categoria-id-form').val(cat.id || id);
                $('#categoria-nombre').val(cat.nombre || '');
                $('#categoria-descripcion').val(cat.descripcion || '');
            }
        });
    }
    $('#modal-categoria').fadeIn(200);
}

function handleCategoriaSubmit(e) {
    e.preventDefault();
    const id = $('#categoria-id-form').val() || undefined;
    const payload = {
        id: id,
        nombre: $('#categoria-nombre').val().trim(),
        descripcion: $('#categoria-descripcion').val().trim()
    };
    const method = id ? 'PUT' : 'POST';
    apiCall(`categorias.php`, method, payload).done(resp => {
        if (resp && resp.success) {
            $('#modal-categoria').fadeOut(200);
            showNotification(resp.message || 'Categoría guardada', 'success');
            loadCategorias();
            return;
        }
        showNotification(resp.message || 'Error al guardar categoría', 'error');
    }).fail(() => {
        let arr = JSON.parse(localStorage.getItem('categorias') || '[]');
        if (id) {
            arr = arr.map(x => x.id == id ? { ...x, ...payload } : x);
        } else {
            payload.id = payload.id || 'CAT-' + Date.now();
            arr.push(payload);
        }
        localStorage.setItem('categorias', JSON.stringify(arr));
        $('#modal-categoria').fadeOut(200);
        loadCategorias();
        showNotification('Categoría guardada localmente', 'success');
    });
}

// --- ESTILOS ---
function setupEstilosListeners() {
    $('#btn-add-estilo').on('click', () => openEstiloModal());
    $(document).on('click', '.btn-edit-estilo', function() {
        const id = $(this).closest('tr').data('id');
        openEstiloModal(id);
    });
    $(document).on('click', '.btn-delete-estilo', function() {
        const id = $(this).closest('tr').data('id');
        if (!id) return;
        if (!confirm('¿Eliminar estilo?')) return;
        apiCall(`estilos.php?id=${id}`, 'DELETE').done(resp => {
            showNotification(resp.message || 'Estilo eliminado', resp.success ? 'success' : 'error');
            loadEstilos();
        }).fail(() => {
            let arr = JSON.parse(localStorage.getItem('estilos') || '[]');
            arr = arr.filter(e => e.id != id);
            localStorage.setItem('estilos', JSON.stringify(arr));
            loadEstilos();
            showNotification('Estilo eliminado (local)', 'success');
        });
    });
    $('#form-estilo').on('submit', handleEstiloSubmit);
}

function openEstiloModal(id = null) {
    resetForm('#form-estilo', '#estilo-id-form');
    $('#modal-estilo-title').text(id ? 'Editar Estilo' : 'Nuevo Estilo');
    if (id) {
        apiCall(`estilos.php?id=${id}`).done(data => {
            const est = Array.isArray(data) ? data[0] : data;
            if (est) {
                $('#estilo-id-form').val(est.id || id);
                $('#estilo-nombre').val(est.nombre || '');
                $('#estilo-descripcion').val(est.descripcion || '');
            }
        }).fail(() => {
            const arr = JSON.parse(localStorage.getItem('estilos') || '[]');
            const est = arr.find(x => x.id == id);
            if (est) {
                $('#estilo-id-form').val(est.id || id);
                $('#estilo-nombre').val(est.nombre || '');
                $('#estilo-descripcion').val(est.descripcion || '');
            }
        });
    }
    $('#modal-estilo').fadeIn(200);
}

function handleEstiloSubmit(e) {
    e.preventDefault();
    const id = $('#estilo-id-form').val() || undefined;
    const payload = {
        id: id,
        nombre: $('#estilo-nombre').val().trim(),
        descripcion: $('#estilo-descripcion').val().trim()
    };
    const method = id ? 'PUT' : 'POST';
    apiCall(`estilos.php`, method, payload).done(resp => {
        if (resp && resp.success) {
            $('#modal-estilo').fadeOut(200);
            showNotification(resp.message || 'Estilo guardado', 'success');
            loadEstilos();
            return;
        }
        showNotification(resp.message || 'Error al guardar estilo', 'error');
    }).fail(() => {
        let arr = JSON.parse(localStorage.getItem('estilos') || '[]');
        if (id) {
            arr = arr.map(x => x.id == id ? { ...x, ...payload } : x);
        } else {
            payload.id = payload.id || 'EST-' + Date.now();
            arr.push(payload);
        }
        localStorage.setItem('estilos', JSON.stringify(arr));
        $('#modal-estilo').fadeOut(200);
        loadEstilos();
        showNotification('Estilo guardado localmente', 'success');
    });
}

// --- PRODUCTOS ---
function setupProductosListeners() {
    $('#btn-add-producto').on('click', () => openProductoModal());
    $(document).on('click', '.btn-edit-producto', function() {
        const id = $(this).closest('tr').data('id');
        openProductoModal(id);
    });
    $(document).on('click', '.btn-delete-producto', function() {
        const id = $(this).closest('tr').data('id');
        if (!id) return;
        if (!confirm('¿Eliminar producto?')) return;
        apiCall(`productos.php?id=${id}`, 'DELETE').done(resp => {
            showNotification(resp.message || 'Producto eliminado', resp.success ? 'success' : 'error');
            loadProductos();
        }).fail(() => {
            let arr = JSON.parse(localStorage.getItem('productos') || '[]');
            arr = arr.filter(e => e.id != id);
            localStorage.setItem('productos', JSON.stringify(arr));
            loadProductos();
            showNotification('Producto eliminado (local)', 'success');
        });
    });
    $('#form-producto').on('submit', handleProductoSubmit);
}

function openProductoModal(id = null) {
    resetForm('#form-producto', '#producto-id-form');
    $('#modal-producto-title').text(id ? 'Editar Producto' : 'Nuevo Producto');
    
    loadCategoriasForDropdown();
    loadEstilosForDropdown();
    
    if (id) {
        apiCall(`productos.php?id=${id}`).done(data => {
            const prod = Array.isArray(data) ? data[0] : data;
            if (prod) {
                $('#producto-id-form').val(prod.id || id);
                $('#producto-marca').val(prod.marca || '');
                $('#producto-modelo').val(prod.modelo || '');
                $('#producto-talla').val(prod.talla || '');
                $('#producto-color').val(prod.color || '');
                $('#producto-precio').val(prod.precio || '');
                $('#producto-stock').val(prod.stock || '');
                $('#producto-categoria').val(prod.categoria || '');
                $('#producto-estilo').val(prod.estilo || '');
            }
        }).fail(() => {
            const arr = JSON.parse(localStorage.getItem('productos') || '[]');
            const prod = arr.find(x => x.id == id);
            if (prod) {
                $('#producto-id-form').val(prod.id || id);
                $('#producto-marca').val(prod.marca || '');
                $('#producto-modelo').val(prod.modelo || '');
                $('#producto-talla').val(prod.talla || '');
                $('#producto-color').val(prod.color || '');
                $('#producto-precio').val(prod.precio || '');
                $('#producto-stock').val(prod.stock || '');
                $('#producto-categoria').val(prod.categoria || '');
                $('#producto-estilo').val(prod.estilo || '');
            }
        });
    }
    $('#modal-producto').fadeIn(200);
}

function handleProductoSubmit(e) {
    e.preventDefault();
    const id = $('#producto-id-form').val() || undefined;
    const payload = {
        id: id,
        marca: $('#producto-marca').val().trim(),
        modelo: $('#producto-modelo').val().trim(),
        talla: $('#producto-talla').val().trim(),
        color: $('#producto-color').val().trim(),
        precio: parseFloat($('#producto-precio').val()) || 0,
        stock: parseInt($('#producto-stock').val()) || 0,
        categoria: $('#producto-categoria').val(),
        estilo: $('#producto-estilo').val()
    };
    const method = id ? 'PUT' : 'POST';
    apiCall(`productos.php`, method, payload).done(resp => {
        if (resp && resp.success) {
            $('#modal-producto').fadeOut(200);
            showNotification(resp.message || 'Producto guardado', 'success');
            loadProductos();
            return;
        }
        showNotification(resp.message || 'Error al guardar producto', 'error');
    }).fail(() => {
        let arr = JSON.parse(localStorage.getItem('productos') || '[]');
        if (id) {
            arr = arr.map(x => x.id == id ? { ...x, ...payload } : x);
        } else {
            payload.id = payload.id || 'PROD-' + Date.now();
            arr.push(payload);
        }
        localStorage.setItem('productos', JSON.stringify(arr));
        $('#modal-producto').fadeOut(200);
        loadProductos();
        showNotification('Producto guardado localmente', 'success');
    });
}

// --- CÓDIGOS ---
function setupCodigosListeners() {
    $('#btn-add-codigo').on('click', () => openCodigoModal());
    $(document).on('click', '.btn-edit-codigo', function() {
        const id = $(this).closest('tr').data('id');
        openCodigoModal(id);
    });
    $(document).on('click', '.btn-delete-codigo', function() {
        const id = $(this).closest('tr').data('id');
        if (!id) return;
        if (!confirm('¿Eliminar código promocional?')) return;
        apiCall(`codigos.php?id=${id}`, 'DELETE').done(resp => {
            showNotification(resp.message || 'Código eliminado', resp.success ? 'success' : 'error');
            loadCodigos();
        }).fail(() => {
            let arr = JSON.parse(localStorage.getItem('codigos') || '[]');
            arr = arr.filter(e => e.id != id);
            localStorage.setItem('codigos', JSON.stringify(arr));
            loadCodigos();
            showNotification('Código eliminado (local)', 'success');
        });
    });
    $('#form-codigo').on('submit', handleCodigoSubmit);
}

function openCodigoModal(id = null) {
    resetForm('#form-codigo', '#codigo-id-form');
    $('#modal-codigo-title').text(id ? 'Editar Código' : 'Nuevo Código');
    
    if (id) {
        apiCall(`codigos.php?id=${id}`).done(data => {
            const cod = Array.isArray(data) ? data[0] : data;
            if (cod) {
                $('#codigo-id-form').val(cod.id || id);
                $('#codigo-codigo').val(cod.codigo || '');
                $('#codigo-descuento').val(cod.porcentaje_descuento || '');
                $('#codigo-fecha-inicio').val(cod.fecha_inicio || '');
                $('#codigo-fecha-fin').val(cod.fecha_fin || '');
                $('#codigo-estado').val(cod.estado || '1');
                $('#codigo-descripcion').val(cod.descripcion || '');
            }
        }).fail(() => {
            const arr = JSON.parse(localStorage.getItem('codigos') || '[]');
            const cod = arr.find(x => x.id == id);
            if (cod) {
                $('#codigo-id-form').val(cod.id || id);
                $('#codigo-codigo').val(cod.codigo || '');
                $('#codigo-descuento').val(cod.porcentaje_descuento || '');
                $('#codigo-fecha-inicio').val(cod.fecha_inicio || '');
                $('#codigo-fecha-fin').val(cod.fecha_fin || '');
                $('#codigo-estado').val(cod.estado || '1');
                $('#codigo-descripcion').val(cod.descripcion || '');
            }
        });
    }
    $('#modal-codigo').fadeIn(200);
}

function handleCodigoSubmit(e) {
    e.preventDefault();
    const id = $('#codigo-id-form').val() || undefined;
    const payload = {
        id: id,
        codigo: $('#codigo-codigo').val().trim(),
        porcentaje_descuento: parseInt($('#codigo-descuento').val()) || 0,
        fecha_inicio: $('#codigo-fecha-inicio').val(),
        fecha_fin: $('#codigo-fecha-fin').val(),
        estado: $('#codigo-estado').val() || '1',
        descripcion: $('#codigo-descripcion').val().trim()
    };
    const method = id ? 'PUT' : 'POST';
    apiCall(`codigos.php`, method, payload).done(resp => {
        if (resp && resp.success) {
            $('#modal-codigo').fadeOut(200);
            showNotification(resp.message || 'Código guardado', 'success');
            loadCodigos();
            return;
        }
        showNotification(resp.message || 'Error al guardar código', 'error');
    }).fail(() => {
        let arr = JSON.parse(localStorage.getItem('codigos') || '[]');
        if (id) {
            arr = arr.map(x => x.id == id ? { ...x, ...payload } : x);
        } else {
            payload.id = payload.id || 'COD-' + Date.now();
            arr.push(payload);
        }
        localStorage.setItem('codigos', JSON.stringify(arr));
        $('#modal-codigo').fadeOut(200);
        loadCodigos();
        showNotification('Código guardado localmente', 'success');
    });
}

// --- USUARIOS ---
function setupUsuariosListeners() {
    $("#btn-add-usuario").on("click", () => openUsuarioModal());
    $(document).on("click", ".btn-edit-usuario", function() {
        const id = $(this).closest("tr").data("id");
        openUsuarioModal(id);
    });
    $(document).on("click", ".btn-delete-usuario", function() {
        const id = $(this).closest("tr").data("id");
        if (confirm("¿Está seguro de que desea eliminar este usuario?")) {
            apiCall(`usuarios.php?id=${id}`, 'DELETE')
                .done(response => {
                    showNotification(response.message, response.success ? 'success' : 'error');
                    loadUsuarios();
                })
                .fail(() => showNotification('Error al eliminar usuario.', 'error'));
        }
    });
    $("#form-usuario").on("submit", handleUsuarioSubmit);
}

function openUsuarioModal(id = null) {
    resetForm('#form-usuario', '#usuario-id-form');
    $("#modal-usuario-title").text(id ? "Editar Usuario" : "Nuevo Usuario");
    if (id) {
        apiCall(`usuarios.php?id=${id}`).done(usuario => {
            $("#usuario-id-form").val(usuario.id);
            $("#usuario-usuario").val(usuario.username || '');
            $("#usuario-password").val(''); // Dejar la contraseña vacía al editar
            $("#usuario-role").val(usuario.role || '');
        }).fail(() => showNotification('Error al cargar usuario.', 'error'));
    }
    $("#modal-usuario").fadeIn(200);
}

function handleUsuarioSubmit(e) {
    e.preventDefault();
    const id = $("#usuario-id-form").val();
    const userData = {
        id: id,
        username: $("#usuario-usuario").val().trim(),
        password: $("#usuario-password").val(),
        role: $("#usuario-role").val()
    };
    const isEdit = !!id;
    const requestType = isEdit ? 'PUT' : 'POST';
    const requestUrl = `usuarios.php`;
    apiCall(requestUrl, requestType, userData)
        .done(response => {
            showNotification(response.message, response.success ? 'success' : 'error');
            $("#modal-usuario").fadeOut(200);
            loadUsuarios();
        })
        .fail(() => showNotification('Error al guardar usuario.', 'error'));
}

// --- FACTURACIÓN ---
function setupFacturacionListeners() {
    $('#btn-nueva-factura').on('click', resetFacturaForm);
    $('#btn-agregar-producto-factura').on('click', agregarProductoAFactura);
    $(document).on('click', '.btn-eliminar-item-factura', function() {
        const index = $(this).data('index');
        carritoFactura.splice(index, 1);
        renderizarTablaFactura();
        calcularTotales();
    });
    $('#form-factura').on('submit', guardarFactura);
    $('#btn-cancelar-factura').on('click', resetFacturaForm);
    
    $(document).on('click', '.btn-ver-factura', function() {
        const id = $(this).data('id');
        verFactura(id);
    });
    $(document).on('click', '.btn-eliminar-factura', function() {
        const id = $(this).data('id');
        if (confirm('¿Eliminar esta factura?')) {
            eliminarFactura(id);
        }
    });
    
    loadFacturas();
}

// --- FUNCIONES AUXILIARES ---
function populateDropdowns() {
    loadCategoriasForDropdown();
    loadEstilosForDropdown();
}

function loadCategoriasForDropdown() {
    apiCall('categorias.php')
        .done(categorias => {
            const $selectCategoria = $("#producto-categoria");
            $selectCategoria.find('option:not(:first)').remove();
            categorias.forEach(categoria => {
                $selectCategoria.append(`<option value="${categoria.id}">${categoria.nombre}</option>`);
            });
        })
        .fail(() => {
            const categorias = JSON.parse(localStorage.getItem('categorias') || '[]');
            const $selectCategoria = $("#producto-categoria");
            $selectCategoria.find('option:not(:first)').remove();
            categorias.forEach(categoria => {
                $selectCategoria.append(`<option value="${categoria.id}">${categoria.nombre}</option>`);
            });
        });
}

function loadEstilosForDropdown() {
    apiCall('estilos.php')
        .done(estilos => {
            const $selectEstilo = $("#producto-estilo");
            $selectEstilo.find('option:not(:first)').remove();
            estilos.forEach(estilo => {
                $selectEstilo.append(`<option value="${estilo.id}">${estilo.nombre}</option>`);
            });
        })
        .fail(() => {
            const estilos = JSON.parse(localStorage.getItem('estilos') || '[]');
            const $selectEstilo = $("#producto-estilo");
            $selectEstilo.find('option:not(:first)').remove();
            estilos.forEach(estilo => {
                $selectEstilo.append(`<option value="${estilo.id}">${estilo.nombre}</option>`);
            });
        });
}

function populateFacturaProductoSelect() {
    const $select = $("#factura-producto-select");
    if (!$select || $select.length === 0) return;
    $select.find('option:not(:first)').remove();
    $("#productos-table-body tr").each(function() {
        const id = $(this).data('id');
        const marca = $(this).find("td:eq(1)").text();
        const modelo = $(this).find("td:eq(2)").text();
        const precio = $(this).find("td:eq(5)").text().replace('C$', '').replace(/,/g, '');
        $select.append(`<option value="${id}" data-precio="${precio}">${marca} ${modelo}</option>`);
    });
}

function renderTable(tbodyId, data, rowRenderer) {
    const $tbody = $(`#${tbodyId}`);
    if (!$tbody || $tbody.length === 0) return;
    $tbody.empty();
    (data || []).forEach(item => $tbody.append(rowRenderer(item)));
}

function loadDashboardStats() {
    apiCall('stats.php').done(stats => {
        $('#stat-empleados').text(stats.empleados ?? 0);
        $('#stat-productos').text(stats.productos ?? 0);
        $('#stat-ventas').text(stats.ventas ?? 0);
    }).fail(() => {
        const empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
        $('#stat-empleados').text(empleados.length || $('#empleados-table-body tr').length || 0);
        $('#stat-productos').text($('#productos-table-body tr').length || 0);
        const facturas = JSON.parse(localStorage.getItem('facturas_guardadas') || '[]');
        $('#stat-ventas').text(facturas.length || $('#facturas-table-body tr').length || 0);
    });
}

// --- CARRUSEL DEL DASHBOARD ---
function setupCarousel() {
    let currentSlide = 0;
    const slides = $('.carousel-slide');
    const indicators = $('.carousel-indicator');
    const totalSlides = slides.length;
    
    if (totalSlides === 0) return;

    function showSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        
        slides.removeClass('opacity-100').addClass('opacity-0');
        indicators.removeClass('opacity-70').addClass('opacity-50');
        
        $(slides[index]).removeClass('opacity-0').addClass('opacity-100');
        $(indicators[index]).removeClass('opacity-50').addClass('opacity-70');
        
        currentSlide = index;
    }
    
    $('#prevBtn').on('click', () => showSlide(currentSlide - 1));
    $('#nextBtn').on('click', () => showSlide(currentSlide + 1));
    indicators.on('click', function() {
        showSlide($(this).data('slide'));
    });
    
    setInterval(() => showSlide(currentSlide + 1), 5000);
    showSlide(0);
}

// --- Delegados globales para botones "Nuevo" ---
 $(function() {
    $(document).on('click', '#btn-add-categoria, .btn-add-categoria, [data-action="add-categoria"]', function(e) {
        e.preventDefault();
        if (typeof openCategoriaModal === 'function') openCategoriaModal();
    });
    $(document).on('click', '#btn-add-estilo, .btn-add-estilo, [data-action="add-estilo"]', function(e) {
        e.preventDefault();
        if (typeof openEstiloModal === 'function') openEstiloModal();
    });
    $(document).on('click', '#btn-add-producto, .btn-add-producto, [data-action="add-producto"]', function(e) {
        e.preventDefault();
        if (typeof openProductoModal === 'function') openProductoModal();
    });
    $(document).on('click', '#btn-add-codigo, .btn-add-codigo, [data-action="add-codigo"]', function(e) {
        e.preventDefault();
        if (typeof openCodigoModal === 'function') openCodigoModal();
    });
    $(document).on('click', '#btn-add-usuario, .btn-add-usuario, [data-action="add-usuario"]', function(e) {
        e.preventDefault();
        if (typeof openUsuarioModal === 'function') openUsuarioModal();
    });
});