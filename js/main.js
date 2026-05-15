// --- ARCHIVO PRINCIPAL: INICIALIZACIÓN ---

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
