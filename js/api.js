// --- CONFIGURACIÓN DE LA API ---

// Determina la base de la API automáticamente.
// Si la web está siendo servida por Apache en localhost (puerto 80),
// redirigimos las llamadas al backend Node que corre en el puerto 3001.
const ORIGIN = window.location.origin;
let API_BASE = ORIGIN + '/';
if (window.location.hostname === 'localhost' && (window.location.port === '' || window.location.port === '80')) {
    API_BASE = 'http://localhost:3001/';
}

function mapEndpoint(endpoint) {
    if (!endpoint) return API_BASE;
    const [path, qs] = endpoint.split('?');
    // Normalizar: quitar cualquier barra inicial para evitar '//' en la URL
    const cleanPath = path.replace(/^\/+/, '');
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
    const base = mapping[cleanPath] || cleanPath;
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

        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [API_FAILURE] Path: ${endpoint} | Status: ${xhr.status} | Error: ${error}`);
        
        // Preferir el mensaje de error provisto por el servidor si está disponible
        let errorMessage = `Error al comunicarse con el servidor: ${status}`;
        try {
            const body = xhr.responseJSON || (xhr.responseText ? JSON.parse(xhr.responseText) : null);
            if (body && body.message) {
                errorMessage = body.message;
            } else if (error === 'parsererror') {
                errorMessage = 'Error: La respuesta del servidor no es un JSON válido. Revisa la consola (F12) para ver los detalles del error en PHP.';
            }
        } catch (e) {
            // ignore parse errors
        }

        showNotification(errorMessage, 'error');
    });
}
