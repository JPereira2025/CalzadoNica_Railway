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
function navigateTo(page) {
    if (!page) page = 'dashboard';
    
    $(".page").hide();
    $(`#${page}-page`).show();
    $("#page-title").text(capitalizeFirstLetter(page.replace('-', ' ')));
    $(".sidebar-link").removeClass("active");
    $(`a[href="#${page}"]`).addClass("active");

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
                    resetFacturaForm();
                    loadFacturas();
                });
            });
            break;
    }

    if (typeof applyRolePermissions === 'function') {
        applyRolePermissions();
    }
}
