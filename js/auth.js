// --- LÓGICA DE AUTENTICACIÓN ---
/**
 * Gestión de Sesión y Seguridad Frontend
 * @description Controla el acceso a la WebApp administrativa.
 */
// Etapas de autenticación:
// 1. checkSession(): verifica si el usuario ya está en sesión y carga la app.
// 2. handleLogin(): envía credenciales al backend y almacena el usuario.
// 3. showApp(): muestra la interfaz principal y aplica permisos de rol.
// 4. applyRolePermissions(): ajusta botones y accesos según usuario administrador o no.
// 5. handleLogout(): cierra sesión y regresa al login.

let currentUser = null;
let authToken = null;

/**
 * Estandariza los nombres de roles para consistencia entre DB y UI
 */
function normalizeRoleClient(role) {
    const map = {
        'admin': 'Administrador',
        'administrador': 'Administrador',
        'vendedor': 'Vendedor',
        'gerente': 'Gerente',
        'cliente': 'Cliente'
    };
    const normalized = String(role || '').trim().toLowerCase();
    return map[normalized] || String(role || '');
}

/**
 * Verifica si existe un token y datos de usuario guardados en sessionStorage.
 * Si los hay, inicializa la aplicación; de lo contrario, muestra el Login.
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
 * Oculta el login y muestra el panel principal.
 * Actualiza los elementos del Header con los datos del usuario.
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

/**
 * Helper booleano para verificar si el usuario logueado es Administrador
 */
function isAdminUser() {
    if (!currentUser) return false;
    const roleNorm = normalizeRoleClient(currentUser.role);
    return roleNorm === 'Administrador';
}

/**
 * Intercepta acciones que requieren privilegios de administrador.
 */
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

/**
 * Manipula el DOM para ocultar o mostrar botones y paneles según el rol.
 * Implementa la seguridad visual en el frontend.
 */
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
    // Evitar registro público desde la interfaz administrativa: solo administradores pueden crear usuarios.
    $("#showRegisterLink").show();
}

/**
 * Captura el evento del formulario de Login, envía los datos a la API
 * y gestiona el almacenamiento de la respuesta (Token JWT).
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

    console.log(`[AUDIT] Intento de login para usuario: ${username} a las ${new Date().toISOString()}`);

    apiCall('/login', 'POST', { username, password, source: 'AdminPanel_v2.6' })
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
                console.info(`[AUDIT] Login exitoso: ${currentUser.username} con rol ${currentUser.role}`);
                navigateTo('dashboard');
            } else {
                $("#loginError").removeClass("hidden").text(response.message || 'Usuario o contraseña incorrectos. Inténtelo nuevamente.');
            }
        })
        .fail((xhr) => {
            if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
                $('#loginError').removeClass('hidden').text(xhr.responseJSON.message);
            } else {
                showNotification('Error de conexión. Revisa la consola (F12).', 'error');
            }
        })
        .always(() => $submitBtn.prop('disabled', false).text('Iniciar Sesión'));
}

/**
 * Limpia todas las variables de sesión y redirige al modal de login.
 */
function handleLogout(e) {
    e.preventDefault();
    apiCall('/logout', 'POST').always(() => {
        console.info(`[AUDIT] Sesión cerrada para: ${currentUser ? currentUser.username : 'Usuario desconocido'} a las ${new Date().toISOString()}`);
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
    $("#registerModal").removeClass('hidden').fadeIn(150);
}

function hideRegister() {
    $("#registerModal").fadeOut(150, function() {
        $(this).addClass('hidden');
    });
    $("#loginModal").removeClass('hidden').fadeIn(150);
}

function showVerify() {
    $("#loginModal").fadeOut(150);
    $("#verifyModal").removeClass('hidden').fadeIn(150);
}

function hideVerify() {
    $("#verifyModal").fadeOut(150, function() {
        $(this).addClass('hidden');
    });
    $("#registerModal").fadeOut(150, function() {
        $(this).addClass('hidden');
    });
    $("#loginModal").removeClass('hidden').fadeIn(150);
}

/**
 * Transitions from the register modal to the verify modal after successful
 * registration. Clears any stale token input, pre-fills the email/username,
 * and ensures the Tailwind `hidden` class is removed before fading in so the
 * modal is not blocked by `display: none !important`.
 *
 * @param {string} emailOrUsername - The email (or username fallback) to pre-fill.
 */
function openVerifyModalFromRegister(emailOrUsername) {
    // Clear stale data from a previous verification attempt
    $("#verify-token").val('');
    $("#verifyError").addClass('hidden').text('');

    // Pre-fill the identifier field
    $("#verify-usernameOrEmail").val(emailOrUsername || '');

    // Fade out the register modal, then reveal the verify modal once the
    // animation completes so both modals are never visible simultaneously.
    $("#registerModal").fadeOut(200, function() {
        $(this).addClass('hidden');
        $("#verifyModal").removeClass('hidden').hide().fadeIn(200);
    });
}

// Expose globally so it can be called from outside this module if needed
window.openVerifyModalFromRegister = openVerifyModalFromRegister;

function handleRegister(e) {
    e.preventDefault();
    const username = $("#reg-username").val().trim();
    const nombres = $("#reg-nombres").val().trim();
    const apellidos = $("#reg-apellidos").val().trim();
    const email = $("#reg-email").val().trim();
    const password = $("#reg-password").val();
    if (!username || !email || !password) {
        $("#registerError").removeClass('hidden').text('Complete todos los campos');
        return;
    }
    $("#registerError").addClass('hidden');
    const $btn = $(e.target).find('button[type="submit"]');
    $btn.prop('disabled', true).text('Registrando...');
    // recoger direcciones si están presentes en el formulario
    const provincia = $("#reg-provincia").val() ? $("#reg-provincia").val().trim() : '';
    const ciudad = $("#reg-ciudad").val() ? $("#reg-ciudad").val().trim() : '';
    const direccion = $("#reg-direccion").val() ? $("#reg-direccion").val().trim() : '';
    const guardarDireccion = $("#reg-guardarDireccion").is(':checked');

    const payload = { username, email, password, nombres, apellidos };
    if (direccion || provincia || ciudad) {
        payload.direccion = { provincia, ciudad, direccion, predeterminada: !!guardarDireccion };
    }

    apiCall('/register', 'POST', payload)
        .then(res => {
            if (res && res.success) {
                showNotification('Usuario creado. Revisa tu correo para el código.', 'success');
                // Transition to the verify modal, using the dedicated helper so
                // the Tailwind `hidden` class is properly removed before fadeIn.
                openVerifyModalFromRegister(email || username);
            } else {
                $("#registerError").removeClass('hidden').text('Servidor dice: ' + (res.message || 'Error desconocido'));
                $btn.prop('disabled', false).text('Registrarme');
            }
        })
        .fail((xhr) => {
            console.error('Error en registro:', xhr);
            const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) 
                || 'Error de red: El servidor de Railway tardó demasiado o no responde.';
            $("#registerError").removeClass('hidden').text(msg); 
        })
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
    apiCall('/verify-token', 'POST', { usernameOrEmail, token })
        .then(res => {
            if (res && res.success) {
                showNotification('Cuenta verificada. Ahora puedes iniciar sesión.', 'success');
                hideVerify();
            } else {
                $("#verifyError").removeClass('hidden').text(res.message || 'Token inválido');
            }
        })
        .fail((xhr) => {
            if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
                $("#verifyError").removeClass('hidden').text(xhr.responseJSON.message);
            } else {
                $("#verifyError").removeClass('hidden').text('Error de conexión');
            }
        })
        .always(() => $btn.prop('disabled', false).text('Verificar'));
}

// Enlaces y binds
$(document).on('click', '#showRegisterLink', showRegister);
$(document).on('click', '#cancelRegister', function(){ hideRegister(); });
$(document).on('submit', '#registerForm', handleRegister);

$(document).on('click', '#showVerifyLink', showVerify);
$(document).on('click', '#cancelVerify', function(){ hideVerify(); });
$(document).on('submit', '#verifyForm', handleVerify);

// Reenviar token desde el modal de verificación (usuarios que no han iniciado sesión)
$(document).on('click', '#btnResendVerify', function(e) {
    e.preventDefault();
    const usernameOrEmail = $('#verify-usernameOrEmail').val().trim();
    if (!usernameOrEmail) {
        $('#verifyError').removeClass('hidden').text('Ingresa tu usuario o correo para reenviar el token');
        return;
    }
    $('#verifyError').addClass('hidden');
    const $btn = $(this);
    const prevHtml = $btn.html();
    $btn.prop('disabled', true).text('Enviando...');
    apiCall('/resend-token', 'POST', { usernameOrEmail })
        .done(res => {
            // Si el servidor devuelve el token en modo debug, rellenarlo en el input
            if (res && res.token) {
                $('#verify-token').val(res.token);
                $('#verifyError').addClass('hidden');
                showNotification('Token reenviado (debug). Se ha rellenado el campo.', 'info');
                // enfocar el campo token para que el usuario pueda verificar rápidamente
                $('#verify-token').focus();
            } else {
                showNotification(res.message || 'Token reenviado. Revisa tu correo.', 'success');
            }
        })
        .fail((xhr) => {
            const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) || 'Error reenviando token';
            $('#verifyError').removeClass('hidden').text(msg);
        })
        .always(() => {
            $btn.prop('disabled', false).html(prevHtml);
        });
});
