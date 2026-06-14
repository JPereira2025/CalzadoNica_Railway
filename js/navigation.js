// --- LÓGICA DE NAVEGACIÓN ---
// Etapas de navegación:
// 1. handleNavigation(): intercepta clicks en el sidebar y determina la página destino.
// 2. navigateTo(page): muestra la sección correcta y carga datos específicos.
// 3. applyRolePermissions(): re-aplica permisos luego de cambiar de página.

/**
 * Maneja el click en los links de navegación
 */
function handleNavigation(e) {
    e.preventDefault();
    const target = $(this).attr("href").substring(1);
    navigateTo(target);
}

/**
 * Navega a una página específica
 */
function loadPage(page, callback) {
    const pageElement = $(`#${page}-page`);
    if (pageElement.length) {
        if (typeof callback === 'function') callback();
        return;
    }

    $("#page-content").html('<div class="text-center py-20 text-gray-500">Cargando módulo...</div>');
    fetch(`pages/${page}.html`, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            $("#page-content").html(html);
            if (typeof callback === 'function') callback();
        })
        .catch(error => {
            $("#page-content").html(`<div class="text-center py-20 text-red-600">No se pudo cargar el módulo '${page}'. ${error.message}</div>`);
            console.error('Error loading page:', page, error);
        });
}

function showPage(page) {
    $(".page").hide();
    $(`#${page}-page`).show();
    $("#page-title").text(capitalizeFirstLetter(page.replace('-', ' ')));
    $(".sidebar-link").removeClass("active");
    $(`a[href="#${page}"]`).addClass("active");

    if (typeof applyRolePermissions === 'function') {
        applyRolePermissions();
    }

    updateMobileBackButton(page);
    closeMobileSidebar();
}

function initPage(page) {
    if (page === 'dashboard') {
        setupCarousel();
    }
}

function navigateTo(page, callback) {
    if (!page) page = 'dashboard';

    loadPage(page, function() {
        showPage(page);
        initPage(page);

        if (typeof callback === 'function') {
            callback();
        }

        // Cargar datos específicos de la página
        switch (page) {
            case 'dashboard':
                loadDashboardStats();
                break;
            case 'empleados':
                loadEmpleados();
                break;
            case 'categorias':
                loadCategorias();
                break;
            case 'estilos':
                loadEstilos();
                break;
            case 'productos':
                loadProductos();
                break;
            case 'codigos':
                loadCodigos();
                break;
            case 'usuarios':
                loadUsuarios();
                break;
            case 'facturacion':
                loadCodigos(() => {
                    loadProductos(() => {
                        loadFacturas(() => {
                            resetFacturaForm();
                        });
                    });
                });
                break;
        }
    });
}

function toggleMobileSidebar() {
    $("#sidebar").toggleClass("sidebar-open");
    $("#sidebar-overlay").toggleClass("hidden");
}

function closeMobileSidebar() {
    if (window.innerWidth < 768) {
        $("#sidebar").removeClass("sidebar-open");
        $("#sidebar-overlay").addClass("hidden");
    }
}

function updateMobileBackButton(page) {
    if (page && page !== 'dashboard') {
        $("#mobile-back-button").removeClass("hidden");
    } else {
        $("#mobile-back-button").addClass("hidden");
    }
}

