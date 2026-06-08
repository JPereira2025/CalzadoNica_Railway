// --- MÓDULO: USUARIOS ---
// Etapas del módulo:
// 1. setupUsuariosListeners(): define listeners de UI para crear, editar y eliminar usuarios.
// 2. loadUsuarios(): carga la lista desde la API y renderiza la tabla.
// 3. openUsuarioModal(): abre el modal para creación o edición.
// 4. handleUsuarioSubmit(): envía el formulario y refresca la lista.
// 5. renderUsuarioRow(): construye la fila HTML de cada usuario.

/**
 * Configura los listeners para el módulo de usuarios
 */
function setupUsuariosListeners() {
    $(document).on("click", "#btn-add-usuario", function(e) {
        e.preventDefault();
        if (ensureAdminAction('crear un usuario')) openUsuarioModal();
    });
    $(document).on("click", ".btn-edit-usuario", function(e) {
        e.preventDefault();
        if (ensureAdminAction('editar un usuario')) openUsuarioModal($(this).closest("tr").data("id"));
    });
    $(document).on("click", ".btn-delete-usuario", function(e) {
        e.preventDefault();
        if (!ensureAdminAction('eliminar un usuario')) return;
        const id = $(this).closest("tr").data("id");
        if (confirm("¿Eliminar este usuario?")) {
            apiCall(`usuarios.php?id=${id}`, 'DELETE').done(response => {
                showNotification(response.message, 'success');
                loadUsuarios();
            });
        }
    });
    $(document).on("click", ".btn-resend-token", function(e) {
        e.preventDefault();
        if (!ensureAdminAction('reenviar token')) return;
        const $row = $(this).closest('tr');
        const id = $row.data('id');
        const email = $row.find('td').eq(2).text().trim();
        const username = $row.find('td').eq(1).text().trim();
        const target = email || username;
        if (!target) {
            showNotification('No hay email ni usuario disponible para reenviar token', 'error');
            return;
        }
        const $btn = $(this);
        const prevHtml = $btn.html();
        $btn.prop('disabled', true).html('Enviando...');
        apiCall('/resend-token', 'POST', { usernameOrEmail: target })
            .done(res => {
                showNotification(res.message || 'Token reenviado. Revisa el correo.', 'success');
            })
            .fail((xhr) => {
                const msg = (xhr && xhr.responseJSON && xhr.responseJSON.message) || 'Error reenviando token';
                showNotification(msg, 'error');
            })
            .always(() => {
                $btn.prop('disabled', false).html(prevHtml);
            });
    });
    $(document).on("submit", "#form-usuario", function(e) {
        e.preventDefault();
        handleUsuarioSubmit(e);
    });
}

/**
 * Carga la lista de usuarios
 */
function loadUsuarios() {
    apiCall('usuarios.php').done(data => {
        renderTable('usuarios-table-body', data, renderUsuarioRow);
    });
}

/**
 * Abre el modal de usuario
 */
function openUsuarioModal(id = null) {
    if (!ensureAdminAction(id ? 'editar un usuario' : 'crear un usuario')) return;
    resetForm('#form-usuario', '#usuario-id-form');
    $('#modal-usuario-title').text(id ? "Editar Usuario" : "Nuevo Usuario");
    $('#usuario-id-form').val(id || '');
    if (id) {
        apiCall(`usuarios.php?id=${id}`).done(data => {
            const user = normalizeList(data)[0];
            if (user) {
                $("#usuario-usuario").val(user.username);
                $("#usuario-email").val(user.email || '');
                $("#usuario-role").val(user.role);
                $("#usuario-verified").prop('checked', !!user.verified);
                $("#usuario-password").attr('placeholder', 'Dejar en blanco para no cambiar');
            }
        });
    } else {
        $("#usuario-email").val('');
        $("#usuario-role").val('Vendedor');
        $("#usuario-verified").prop('checked', false);
        $("#usuario-password").attr('placeholder', '');
    }
    openModal("#modal-usuario");
}

/**
 * Maneja el envío del formulario de usuario
 */
function handleUsuarioSubmit(e) {
    e.preventDefault();
    if (!ensureAdminAction('guardar un usuario')) return;
    const id = $("#usuario-id-form").val() || null;
    const username = $("#usuario-usuario").val().trim();
    const email = $("#usuario-email").val().trim();
    const password = $("#usuario-password").val();
    const role = $("#usuario-role").val();
    const verified = $("#usuario-verified").is(":checked");

    if (!username || !email || !role) {
        showNotification('Por favor completa usuario, email y rol.', 'error');
        return;
    }

    if (!id && !password) {
        showNotification('La contraseña es requerida para un nuevo usuario.', 'error');
        return;
    }

    const userData = {
        id: id,
        username,
        email,
        role,
        verified
    };

    if (password) {
        userData.password = password;
    }

    const method = id ? 'PUT' : 'POST';
    apiCall('usuarios.php', method, userData).done(response => {
        showNotification(response.message, 'success');
        if (response.verificationToken) {
            console.log('Verification token generated for user:', response.verificationToken);
            showNotification('Se generó un token de verificación JWT. Revisa la consola.', 'info');
        }
        $("#modal-usuario").fadeOut(200);
        loadUsuarios();
    });
}

/**
 * Renderiza una fila de usuario
 */
function renderUsuarioRow(usuario) {
    return `
    <tr data-id="${usuario.id}">
        <td class="py-3 px-4">${usuario.id}</td>
        <td class="py-3 px-4">${usuario.username}</td>
        <td class="py-3 px-4">${usuario.email || ''}</td>
        <td class="py-3 px-4">${usuario.role}</td>
        <td class="py-3 px-4">${usuario.verified ? 'Sí' : 'No'}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-edit-usuario text-blue-600 hover:text-blue-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-resend-token text-green-600 hover:text-green-800 mx-1" title="Reenviar token"><i class="fas fa-paper-plane"></i></button>
            <button class="btn-delete-usuario text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}
