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
    loadDashboardStats();
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
    
    // Listeners para botones de exportación e impresión
    $(document).on('click', '.btn-export', handleExport);
    $(document).on('click', '.btn-print', handlePrint);

    // Acciones rápidas de administrador en el dashboard
    $('#btn-quick-add-usuario').on('click', function() {
        if (ensureAdminAction('crear un usuario')) {
            navigateTo('usuarios');
            openUsuarioModal();
        }
    });
    $('#btn-quick-add-codigo').on('click', function() {
        if (ensureAdminAction('crear un código')) {
            navigateTo('codigos');
            openCodigoModal();
        }
    });
    $('#btn-quick-add-producto').on('click', function() {
        if (ensureAdminAction('crear un producto')) {
            navigateTo('productos');
            openProductoModal();
        }
    });
    $('#btn-quick-add-estilo').on('click', function() {
        if (ensureAdminAction('crear un estilo')) {
            navigateTo('estilos');
            openEstiloModal();
        }
    });
    $('#btn-quick-add-categoria').on('click', function() {
        if (ensureAdminAction('crear una categoría')) {
            navigateTo('categorias');
            openCategoriaModal();
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
