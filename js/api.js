// --- CONFIGURACIÓN DE LA API ---

// Si estamos en el mismo servidor, usamos rutas relativas para evitar errores de origen
const API_BASE = window.location.origin + '/';

function mapEndpoint(endpoint) {
    if (!endpoint) return API_BASE;
    const [path, qs] = endpoint.split('?');
    const mapping = {
        'login.php': 'login',
        'register.php': 'register',
        'verify-token.php': 'verify-token',
        'logout.php': 'logout',
        'empleados.php': 'api/empleados',
        'productos.php': 'api/productos',
        'categorias.php': 'api/categorias',
        'estilos.php': 'api/estilos',
        'codigos.php': 'api/codigos',
        'facturas.php': 'api/facturas',
        'usuarios.php': 'api/usuarios',
        'stats.php': 'api/stats'
    };
    const base = mapping[path] || path;
    return API_BASE + base + (qs ? ('?' + qs) : '');
}

function getAuthToken() {
    return sessionStorage.getItem('authToken');
}

/**
 * Realiza una llamada a la API
 */
function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    return $.ajax({
        url: mapEndpoint(endpoint),
        method: method,
        headers: headers,
        data: data ? JSON.stringify(data) : null,
        contentType: 'application/json',
        dataType: 'json'
    }).fail(function(xhr, status, error) {
        if (xhr.status === 401 || xhr.status === 403) {
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('authToken');
            if (typeof showLogin === 'function') {
                showLogin();
            }
        }

        console.error(`Error en API call a ${endpoint}:`, status, error);
        console.error('Respuesta del servidor:', xhr.responseText);
        
        let errorMessage = `Error al comunicarse con el servidor: ${status}`;
        if (error === 'parsererror') {
            errorMessage = 'Error: La respuesta del servidor no es un JSON válido. Revisa la consola (F12) para ver los detalles del error en PHP.';
        }
        showNotification(errorMessage, 'error');
    });
}
