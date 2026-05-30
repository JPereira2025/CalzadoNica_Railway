// --- MÓDULO: ESTILOS ---
// Etapas del módulo:
// 1. setupEstilosListeners(): define listeners de UI para crear, editar y eliminar estilos.
// 2. loadEstilos(): carga la lista desde la API y renderiza la tabla.
// 3. openEstiloModal(): abre el modal para creación o edición.
// 4. handleEstiloSubmit(): envía el formulario y refresca la lista.
// 5. renderEstiloRow(): construye la fila HTML de cada estilo.

/**
 * Configura los listeners para el módulo de estilos
 */
function setupEstilosListeners() {
    $(document).on('click', '#btn-add-estilo', () => {
        if (ensureAdminAction('crear un estilo')) openEstiloModal();
    });
    $(document).on('click', '.btn-edit-estilo', function() {
        if (ensureAdminAction('editar un estilo')) openEstiloModal($(this).closest('tr').data('id'));
    });
    $(document).on('click', '.btn-delete-estilo', function() {
        if (!ensureAdminAction('eliminar un estilo')) return;
        const id = $(this).closest('tr').data('id');
        if (confirm('¿Eliminar estilo?')) {
            apiCall(`estilos.php?id=${id}`, 'DELETE').done(resp => {
                showNotification(resp.message, 'success');
                loadEstilos();
            });
        }
    });
    $(document).on('submit', '#form-estilo', handleEstiloSubmit);
}

/**
 * Carga la lista de estilos
 */
function loadEstilos() {
    apiCall('estilos.php').done(data => {
        localStorage.setItem('estilos', JSON.stringify(data));
        renderTable('estilos-table-body', data, renderEstiloRow);
        updateIdCounters();
    }).fail(() => {
        const localData = JSON.parse(localStorage.getItem('estilos') || '[]');
        renderTable('estilos-table-body', localData, renderEstiloRow);
        showNotification('Error de red. Mostrando datos locales de estilos.', 'warning');
    });
}

/**
 * Abre el modal de estilo
 */
function openEstiloModal(id = null) {
    if (!ensureAdminAction(id ? 'editar un estilo' : 'crear un estilo')) return;
    resetForm('#form-estilo', '#estilo-id-form');
    $('#modal-estilo-title').text(id ? 'Editar Estilo' : 'Nuevo Estilo');
    $('#estilo-id-form').val(id || '');
    if (id) {
        apiCall(`estilos.php?id=${id}`).done(data => {
            const est = normalizeList(data)[0];
            if (est) {
                $('#estilo-nombre').val(est.nombre);
                $('#estilo-descripcion').val(est.descripcion);
            }
        });
    }
    openModal('#modal-estilo');
}

/**
 * Maneja el envío del formulario de estilo
 */
function handleEstiloSubmit(e) {
    e.preventDefault();
    if (!ensureAdminAction('guardar un estilo')) return;
    const id = $('#estilo-id-form').val();
    const nombre = $('#estilo-nombre').val();
    const payload = {
        nombre: nombre,
        descripcion: $('#estilo-descripcion').val()
    };
    
    payload.id = id || generateEstiloId(payload);

    const method = id ? 'PUT' : 'POST';
    apiCall('estilos.php', method, payload).done(resp => {
        showNotification(resp.message, 'success');
        $('#modal-estilo').fadeOut(200);
        loadEstilos();
    });
}

/**
 * Renderiza una fila de estilo
 */
function renderEstiloRow(estilo) {
    return `
    <tr data-id="${estilo.id}">
        <td class="py-3 px-4">${estilo.id}</td>
        <td class="py-3 px-4">${estilo.nombre}</td>
        <td class="py-3 px-4">${estilo.descripcion || ''}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-edit-estilo text-purple-600 hover:text-purple-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-delete-estilo text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}

/**
 * Genera ID único para estilo
 */
function generateEstiloId(payload) {
    const nombre = payload.nombre ? payload.nombre.substring(0, 3).toUpperCase() : 'XXX';
    const consecutivo = String(window.idCounters.estilos++).padStart(3, '0');
    return `EST-${nombre}-${consecutivo}`;
}

/**
 * Carga estilos para dropdown
 */
function loadEstilosForDropdown() {
    return apiCall('estilos.php').done(data => {
        const estilos = normalizeList(data);
        const $sel = $('#producto-estilo');
        $sel.empty().append('<option value="">Seleccionar</option>');
        estilos.forEach(est => { 
            console.log("Estilo encontrado para dropdown:", est);
            $sel.append(`<option value="${String(est.id).trim()}">${String(est.nombre).trim()}</option>`); 
        });
    }).fail(() => {
        showNotification('No se pudieron cargar los estilos para el desplegable.', 'error');
    });
}
