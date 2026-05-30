// --- ARCHIVO PRINCIPAL: INICIALIZACIÓN ---
// Etapas de inicialización:
// 1. checkSession(): determina si hay sesión activa y muestra login o app.
// 2. setupEventListeners(): registra todos los listeners de UI y módulos.
// 3. loadDashboardStats(): carga datos iniciales del dashboard.
// 4. setupCarousel(): prepara el carrusel de la pantalla principal.

// Estado global
window.idCounters = {
    empleados: 1,
    categorias: 1,
    estilos: 1,
    productos: 1,
    codigos: 1,
    facturas: 1
};

/**
 * Inicializa la aplicación
 */
$(document).ready(function() {
    checkSession();
    setupEventListeners();
    setupCarousel();
});

/**
 * Configura todos los listeners de eventos
 */
function setupEventListeners() {
    // Login y Logout
    $("#loginForm").on("submit", handleLogin);
    $("#logout-btn").on("click", handleLogout);
    $("#user-menu").on("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        $("#user-dropdown").toggleClass("hidden");
    });
    $(document).on("click", function(e) {
        if (!$(e.target).closest('#user-menu, #user-dropdown').length) {
            $("#user-dropdown").addClass("hidden");
        }
    });

    // Navegación: delegación segura
    $(document).on("click", "a.sidebar-link", handleNavigation);
    $(document).on("click", "#mobile-menu-toggle", function(e) {
        e.preventDefault();
        toggleMobileSidebar();
    });
    $(document).on("click", "#mobile-back-button", function(e) {
        e.preventDefault();
        navigateTo('dashboard');
    });

    // Modales
    $(document).on("click", ".modal-close", function() {
        $(this).closest('.modal').fadeOut(200);
    });

    // Cerrar menú móvil al redimensionar a pantallas grandes
    $(window).on('resize', function() {
        if (window.innerWidth >= 768) {
            $("#sidebar").removeClass("sidebar-open");
        }
    });

    // Módulos
    setupEmpleadosListeners();
    setupCategoriasListeners();
    setupEstilosListeners();
    setupProductosListeners();
    setupCodigosListeners();
    setupFacturacionListeners();
    setupUsuariosListeners();
    
    // Listeners para botones de exportación e impresión
    $(document).on('click', '.btn-export', handleExport);
    $(document).on('click', '.btn-print', handlePrint);

    // Acciones rápidas de administrador en el dashboard
    $(document).on('click', '#btn-quick-add-usuario', function() {
        if (ensureAdminAction('crear un usuario')) {
            navigateTo('usuarios', openUsuarioModal);
        }
    });
    $(document).on('click', '#btn-quick-add-codigo', function() {
        if (ensureAdminAction('crear un código')) {
            navigateTo('codigos', openCodigoModal);
        }
    });
    $(document).on('click', '#btn-quick-add-producto', function() {
        if (ensureAdminAction('crear un producto')) {
            navigateTo('productos', openProductoModal);
        }
    });
    $(document).on('click', '#btn-quick-add-estilo', function() {
        if (ensureAdminAction('crear un estilo')) {
            navigateTo('estilos', openEstiloModal);
        }
    });
    $(document).on('click', '#btn-quick-add-categoria', function() {
        if (ensureAdminAction('crear una categoría')) {
            navigateTo('categorias', openCategoriaModal);
        }
    });
}

/**
 * Maneja exportación (placeholder)
 */
function handleExport(e) {
    console.log('Export functionality placeholder');
}

/**
 * Maneja impresión (placeholder)
 */
function handlePrint(e) {
    console.log('Print functionality placeholder');
}
