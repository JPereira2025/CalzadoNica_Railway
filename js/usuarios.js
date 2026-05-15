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
    $("#btn-add-usuario").on("click", () => {
        if (ensureAdminAction('crear un usuario')) openUsuarioModal();
    });
    $(document).on("click", ".btn-edit-usuario", function() {
        if (ensureAdminAction('editar un usuario')) openUsuarioModal($(this).closest("tr").data("id"));
    });
    $(document).on("click", ".btn-delete-usuario", function() {
        if (!ensureAdminAction('eliminar un usuario')) return;
        const id = $(this).closest("tr").data("id");
        if (confirm("¿Eliminar este usuario?")) {
            apiCall(`usuarios.php?id=${id}`, 'DELETE').done(response => {
                showNotification(response.message, 'success');
                loadUsuarios();
            });
        }
    });
    $("#form-usuario").on("submit", handleUsuarioSubmit);
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
                $("#usuario-role").val(user.role);
                $("#usuario-password").attr('placeholder', 'Dejar en blanco para no cambiar');
            }
        });
    } else {
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
    const userData = {
        id: id,
        username: $("#usuario-usuario").val(),
        password: $("#usuario-password").val(),
        role: $("#usuario-role").val()
    };
    const method = id ? 'PUT' : 'POST';
    apiCall('usuarios.php', method, userData).done(response => {
        showNotification(response.message, 'success');
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
        <td class="py-3 px-4">${usuario.role}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-edit-usuario text-blue-600 hover:text-blue-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-delete-usuario text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}
