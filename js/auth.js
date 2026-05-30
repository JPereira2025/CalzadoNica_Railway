// --- LÓGICA DE AUTENTICACIÓN ---
// Etapas de autenticación:
// 1. checkSession(): verifica si el usuario ya está en sesión y carga la app.
// 2. handleLogin(): envía credenciales al backend y almacena el usuario.
// 3. showApp(): muestra la interfaz principal y aplica permisos de rol.
// 4. applyRolePermissions(): ajusta botones y accesos según usuario administrador o no.
// 5. handleLogout(): cierra sesión y regresa al login.

let currentUser = null;
let authToken = null;

function normalizeRoleClient(role) {
    const map = {
        'admin': 'Administrador',
        'administrador': 'Administrador',
        'vendedor': 'Vendedor',
        'gerente': 'Gerente'
    };
    const normalized = String(role || '').trim().toLowerCase();
    return map[normalized] || String(role || '');
}

/**
 * Verifica si hay sesión activa
 */
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    const savedToken = sessionStorage.getItem('authToken');

    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        authToken = savedToken;
        if (currentUser && currentUser.role) {
            currentUser.role = normalizeRoleClient(currentUser.role);
        }
        showApp();
        navigateTo('dashboard');
    } else {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        showLogin();
    }
}

/**
 * Muestra la aplicación
 */
function showApp() {
    applyRolePermissions();
    $("#loginModal").fadeOut(200);
    $("#app").fadeIn(200);
    $("#user-name").text(currentUser.username);
    $("#user-role").text(currentUser.role);

    $("#tokenContainer").addClass("hidden");

    if (typeof loadDashboardStats === 'function') {
        loadDashboardStats();
    }
}

function isAdminUser() {
    if (!currentUser) return false;
    const roleNorm = normalizeRoleClient(currentUser.role);
    return roleNorm === 'Administrador';
}

function ensureAdminAction(action = 'realizar esta acción') {
    const allowedNonAdminActions = [
        'agregar un producto a la factura',
        'aplicar un código de descuento',
        'guardar una factura'
    ];
    if (allowedNonAdminActions.includes(action)) return true;
    if (isAdminUser()) return true;
    showNotification(`Acceso denegado: no tienes permiso para ${action}.`, 'error');
    return false;
}

function applyRolePermissions() {
    if (!currentUser) return;

    const adminOnlyButtons = '#btn-add-empleado, #btn-add-categoria, #btn-add-estilo, #btn-add-producto, #btn-add-codigo, #btn-add-usuario, #btn-quick-add-usuario, #btn-quick-add-codigo, #btn-quick-add-producto, #btn-quick-add-estilo, #btn-quick-add-categoria';
    const adminQuickPanel = '#admin-quick-actions-panel';
    const adminTableButtons = '.btn-edit-empleado, .btn-delete-empleado, .btn-edit-categoria, .btn-delete-categoria, .btn-edit-estilo, .btn-delete-estilo, .btn-edit-producto, .btn-delete-producto, .btn-edit-codigo, .btn-delete-codigo, .btn-edit-usuario, .btn-delete-usuario, .btn-eliminar-factura';

    if (!isAdminUser()) {
        $(adminOnlyButtons).hide();
        $(adminQuickPanel).hide();
        $('#admin-quick-actions-note').removeClass('hidden');
        $(adminTableButtons).hide();
    } else {
        $(adminOnlyButtons).show();
        $(adminQuickPanel).show();
        $('#admin-quick-actions-note').addClass('hidden');
        $(adminTableButtons).show();
    }

    $('#user-name').text(currentUser.username);
    $('#user-role').text(currentUser.role);
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
            if (response.success && response.token) {
                currentUser = response.user;
                authToken = response.token;
                console.log('Login success token:', authToken);
                if (currentUser && currentUser.role) {
                    currentUser.role = normalizeRoleClient(currentUser.role);
                }
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                sessionStorage.setItem('authToken', authToken);
                $("#loginError").addClass('hidden');
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
    apiCall('logout.php', 'POST').always(() => {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        currentUser = null;
        authToken = null;
        window.carritoFactura = [];
        showLogin();
    });
}

// --- Registro y verificación ---
function showRegister() {
    $("#loginModal").fadeOut(150);
    $("#registerModal").fadeIn(150);
}

function hideRegister() {
    $("#registerModal").fadeOut(150);
    $("#loginModal").fadeIn(150);
}

function showVerify() {
    $("#loginModal").fadeOut(150);
    $("#verifyModal").fadeIn(150);
}

function hideVerify() {
    $("#verifyModal").fadeOut(150);
    $("#loginModal").fadeIn(150);
}

function handleRegister(e) {
    e.preventDefault();
    const username = $("#reg-username").val().trim();
    const email = $("#reg-email").val().trim();
    const password = $("#reg-password").val();
    if (!username || !email || !password) {
        $("#registerError").removeClass('hidden').text('Complete todos los campos');
        return;
    }
    $("#registerError").addClass('hidden');
    const $btn = $(e.target).find('button[type="submit"]');
    $btn.prop('disabled', true).text('Registrando...');
    apiCall('register.php', 'POST', { username, email, password })
        .then(res => {
            if (res && res.success) {
                showNotification('Usuario creado. Revisa tu correo para el código.', 'success');
                hideRegister();
            } else {
                $("#registerError").removeClass('hidden').text(res.message || 'Error al registrar');
            }
        })
        .fail(() => { $("#registerError").removeClass('hidden').text('Error de conexión'); })
        .always(() => $btn.prop('disabled', false).text('Registrarme'));
}

function handleVerify(e) {
    e.preventDefault();
    const usernameOrEmail = $("#verify-usernameOrEmail").val().trim();
    const token = $("#verify-token").val().trim();
    if (!usernameOrEmail || !token) {
        $("#verifyError").removeClass('hidden').text('Complete todos los campos');
        return;
    }
    $("#verifyError").addClass('hidden');
    const $btn = $(e.target).find('button[type="submit"]');
    $btn.prop('disabled', true).text('Verificando...');
    apiCall('verify-token.php', 'POST', { usernameOrEmail, token })
        .then(res => {
            if (res && res.success) {
                showNotification('Cuenta verificada. Ahora puedes iniciar sesión.', 'success');
                hideVerify();
            } else {
                $("#verifyError").removeClass('hidden').text(res.message || 'Token inválido');
            }
        })
        .fail(() => { $("#verifyError").removeClass('hidden').text('Error de conexión'); })
        .always(() => $btn.prop('disabled', false).text('Verificar'));
}

// Enlaces y binds
$(document).on('click', '#showRegisterLink', showRegister);
$(document).on('click', '#cancelRegister', function(){ hideRegister(); });
$(document).on('submit', '#registerForm', handleRegister);

$(document).on('click', '#showVerifyLink', showVerify);
$(document).on('click', '#cancelVerify', function(){ hideVerify(); });
$(document).on('submit', '#verifyForm', handleVerify);
