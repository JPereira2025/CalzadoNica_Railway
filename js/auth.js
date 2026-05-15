// --- LÓGICA DE AUTENTICACIÓN ---

let currentUser = null;

/**
 * Verifica si hay sesión activa
 */
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        navigateTo('dashboard');
    } else {
        showLogin();
    }
}

/**
 * Muestra la aplicación
 */
function showApp() {
    $("#loginModal").fadeOut(200);
    $("#app").fadeIn(200);
    $("#user-name").text(currentUser.username);
    $("#user-role").text(currentUser.role);
}

/**
 * Muestra el login
 */
function showLogin() {
    $("#app").fadeOut(200);
    $("#loginModal").fadeIn(200);
}

/**
 * Maneja el login
 */
function handleLogin(e) {
    e.preventDefault();
    const username = $("#username").val().trim();
    const password = $("#password").val();

    if (!username || !password) {
        $("#loginError").removeClass("hidden").text('Por favor, complete todos los campos.');
        return;
    }

    const $submitBtn = $(e.target).find('button[type="submit"]');
    $submitBtn.prop('disabled', true).text('Iniciando...');

    apiCall('login.php', 'POST', { username, password })
        .then(response => {
            if (response.success) {
                currentUser = response.user;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                showNotification(`Bienvenido, ${currentUser.username}!`, "success");
                showApp();
                navigateTo('dashboard');
            } else {
                $("#loginError").removeClass("hidden").text(response.message || 'Usuario o contraseña incorrectos. Inténtelo nuevamente.');
            }
        })
        .fail(() => showNotification('Error de conexión. Revisa la consola (F12).', 'error'))
        .always(() => $submitBtn.prop('disabled', false).text('Iniciar Sesión'));
}

/**
 * Maneja el logout
 */
function handleLogout(e) {
    e.preventDefault();
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    window.carritoFactura = [];
    showLogin();
}
