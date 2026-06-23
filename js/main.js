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
    $(document).on("click", "#sidebar-overlay", function(e) {
        e.preventDefault();
        closeMobileSidebar();
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
    $(document).on('click', '#btn-quick-manage-usuarios', function() {
        if (ensureAdminAction('gestionar usuarios')) {
            navigateTo('usuarios');
        }
    });
}

/**
 * Maneja la exportación de tablas a Excel (.xlsx) y PDF (.pdf)
 */
function handleExport(e) {
    e.preventDefault();
    const $btn = $(this);
    const tbodyId = $btn.data('table-id');
    const type = $btn.data('type'); // 'xlsx' o 'pdf'
    
    const $tbody = $(`#${tbodyId}`);
    if (!$tbody.length || $tbody.find('tr').length === 0 || $tbody.find('td').attr('colspan')) {
        showNotification('No hay datos en la tabla para exportar.', 'warning');
        return;
    }

    const titles = {
        'categorias-table-body': 'Categorías',
        'codigos-table-body': 'Códigos de Barra',
        'empleados-table-body': 'Empleados',
        'estilos-table-body': 'Estilos de Calzado',
        'productos-table-body': 'Productos',
        'usuarios-table-body': 'Usuarios',
        'facturas-table-body': 'Facturas / Ventas'
    };

    const title = titles[tbodyId] || 'Reporte';
    const $table = $tbody.closest('table');
    const $clonedTable = $table.clone();

    // Eliminar la columna de "Acciones" si existe para una exportación limpia
    let colIndex = -1;
    $clonedTable.find('thead th').each(function(index) {
        const text = $(this).text().trim().toLowerCase();
        if (text === 'acciones' || text === 'acción' || text === 'acciones ') {
            colIndex = index;
        }
    });

    if (colIndex !== -1) {
        $clonedTable.find('thead th:eq(' + colIndex + ')').remove();
        $clonedTable.find('tbody tr').each(function() {
            $(this).find('td:eq(' + colIndex + ')').remove();
        });
    }

    if (type === 'xlsx') {
        try {
            const wb = XLSX.utils.table_to_book($clonedTable[0], { sheet: title });
            XLSX.writeFile(wb, `reporte_${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
            showNotification(`Exportado a Excel correctamente: ${title}`, 'success');
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            showNotification('Error al exportar a Excel.', 'error');
        }
    } else if (type === 'pdf') {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');
            
            // Configuración estética del PDF
            doc.setFontSize(18);
            doc.setTextColor(31, 41, 55); // Gray 800
            doc.text(`Reporte de ${title}`, 40, 40);
            
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128); // Gray 500
            const dateStr = new Date().toLocaleString();
            doc.text(`Generado el: ${dateStr}`, 40, 55);

            doc.autoTable({
                html: $clonedTable[0],
                startY: 70,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 6 },
                headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] }, // Cabecera gris oscuro premium
                alternateRowStyles: { fillColor: [249, 250, 251] }, // Filas alternas
                margin: { left: 40, right: 40 }
            });

            doc.save(`reporte_${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
            showNotification(`Exportado a PDF correctamente: ${title}`, 'success');
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            showNotification('Error al exportar a PDF.', 'error');
        }
    }
}

/**
 * Maneja la impresión nativa de tablas
 */
function handlePrint(e) {
    e.preventDefault();
    const $btn = $(this);
    const tbodyId = $btn.data('table-id');
    
    const $tbody = $(`#${tbodyId}`);
    if (!$tbody.length || $tbody.find('tr').length === 0 || $tbody.find('td').attr('colspan')) {
        showNotification('No hay datos en la tabla para imprimir.', 'warning');
        return;
    }

    const titles = {
        'categorias-table-body': 'Categorías',
        'codigos-table-body': 'Códigos de Barra',
        'empleados-table-body': 'Empleados',
        'estilos-table-body': 'Estilos de Calzado',
        'productos-table-body': 'Productos',
        'usuarios-table-body': 'Usuarios',
        'facturas-table-body': 'Facturas / Ventas'
    };

    const title = titles[tbodyId] || 'Reporte';
    const $table = $tbody.closest('table');
    const $clonedTable = $table.clone();

    // Eliminar columna de "Acciones"
    let colIndex = -1;
    $clonedTable.find('thead th').each(function(index) {
        const text = $(this).text().trim().toLowerCase();
        if (text === 'acciones' || text === 'acción' || text === 'acciones ') {
            colIndex = index;
        }
    });

    if (colIndex !== -1) {
        $clonedTable.find('thead th:eq(' + colIndex + ')').remove();
        $clonedTable.find('tbody tr').each(function() {
            $(this).find('td:eq(' + colIndex + ')').remove();
        });
    }

    try {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            showNotification('Por favor, permite las ventanas emergentes (popups) para imprimir.', 'warning');
            return;
        }

        const dateStr = new Date().toLocaleString();

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Imprimir - ${title}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1f2937; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; color: #111827; margin: 0; }
                    .date { font-size: 12px; color: #6b7280; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
                    th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">Reporte de ${title}</h1>
                    <span class="date">Generado el: ${dateStr}</span>
                </div>
                ${$clonedTable[0].outerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
        showNotification('Documento enviado a la cola de impresión.', 'success');
    } catch (error) {
        console.error('Error al imprimir:', error);
        showNotification('Error al abrir la ventana de impresión.', 'error');
    }
}
