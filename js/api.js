// --- CONFIGURACIÓN DE LA API ---

const API_BASE = 'endpoints/';

/**
 * Realiza una llamada a la API
 */
function apiCall(endpoint, method = 'GET', data = null) {
    return $.ajax({
        url: `${API_BASE}${endpoint}`,
        method: method,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json',
        dataType: 'json'
    }).fail(function(xhr, status, error) {
        console.error(`Error en API call a ${endpoint}:`, status, error);
        console.error('Respuesta del servidor:', xhr.responseText);
        
        let errorMessage = `Error al comunicarse con el servidor: ${status}`;
        if (error === 'parsererror') {
            errorMessage = 'Error: La respuesta del servidor no es un JSON válido. Revisa la consola (F12) para ver los detalles del error en PHP.';
        }
        showNotification(errorMessage, 'error');
    });
}
