// --- UTILIDADES COMPARTIDAS ---

/**
 * Muestra notificaciones en la interfaz
 */
function showNotification(message, type = 'info') {
    const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
    const notificationId = 'notification-' + Date.now();
    const notification = $(`
        <div id="${notificationId}" class="${colors[type]} text-white p-4 rounded-lg shadow-lg mb-4 flex items-center justify-between relative" style="z-index: 9999; display: none;">
            <div class="flex items-center"><i class="fas fa-${icons[type]} mr-3"></i><span>${message}</span></div>
            <button class="ml-4 text-white hover:text-gray-200 notification-close" title="Cerrar"><i class="fas fa-times"></i></button>
        </div>
    `);
    $("#notification-area").append(notification);
    notification.slideDown(300);
    notification.find('.notification-close').on('click', function() { notification.slideUp(300, function() { $(this).remove(); }); });
    setTimeout(() => { notification.slideUp(300, function() { $(this).remove(); }); }, 6000);
}

/**
 * Normaliza datos de respuesta de API
 */
function normalizeList(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [data];
}

/**
 * Renderiza una tabla HTML desde datos
 */
function renderTable(tbodySelector, data, mapper) {
    const rows = normalizeList(data);
    const $tbody = $(`#${tbodySelector}`);
    $tbody.empty();
    if (rows.length === 0) {
        const colspan = $tbody.closest('table').find('thead th').length;
        $tbody.append(`<tr><td colspan="${colspan}" class="text-center py-4 text-gray-500">No hay datos para mostrar.</td></tr>`);
    } else {
        rows.forEach(item => { $tbody.append(mapper(item)); });
    }
}

/**
 * Actualiza los contadores de IDs desde localStorage
 */
function updateIdCounters() {
    ['categorias', 'estilos', 'productos', 'empleados', 'codigos'].forEach(module => {
        try {
            const items = JSON.parse(localStorage.getItem(module) || '[]');
            if (items.length > 0) {
                const maxId = Math.max(0, ...items.map(item => {
                    const parts = String(item.id).split('-');
                    return parseInt(parts[parts.length - 1], 10) || 0;
                }));
                window.idCounters[module] = maxId + 1;
            }
        } catch (e) { console.error(`Error updating counter for ${module}:`, e); }
    });
}

/**
 * Capitaliza primera letra de un string
 */
function capitalizeFirstLetter(string) {
    return String(string).charAt(0).toUpperCase() + String(string).slice(1);
}

/**
 * Resetea un formulario y su campo ID
 */
function resetForm(formSelector, idSelector) {
    $(formSelector)[0].reset();
    $(idSelector).val('');
}

/**
 * Abre un modal
 */
function openModal(modalId) {
    $(modalId).fadeIn(200);
}
