// --- MÓDULO: CATEGORÍAS ---
// Etapas del módulo:
// 1. setupCategoriasListeners(): define listeners de UI para crear, editar y eliminar categorías.
// 2. loadCategorias(): carga la lista desde la API y renderiza la tabla.
// 3. openCategoriaModal(): abre el modal para creación o edición.
// 4. handleCategoriaSubmit(): envía el formulario y refresca la lista.
// 5. renderCategoriaRow(): construye la fila HTML de cada categoría.

/**
 * Configura los listeners para el módulo de categorías
 */
function setupCategoriasListeners() {
    $('#btn-add-categoria').on('click', () => {
        if (ensureAdminAction('crear una categoría')) openCategoriaModal();
    });
    $(document).on('click', '.btn-edit-categoria', function() {
        if (ensureAdminAction('editar una categoría')) openCategoriaModal($(this).closest('tr').data('id'));
    });
    $(document).on('click', '.btn-delete-categoria', function() {
        if (!ensureAdminAction('eliminar una categoría')) return;
        const id = $(this).closest('tr').data('id');
        if (confirm('¿Eliminar categoría?')) {
            apiCall(`categorias.php?id=${id}`, 'DELETE').done(resp => {
                showNotification(resp.message, 'success');
                loadCategorias();
            });
        }
    });
    $('#form-categoria').on('submit', handleCategoriaSubmit);
}

/**
 * Carga la lista de categorías
 */
function loadCategorias() {
    apiCall('categorias.php').done(data => {
        localStorage.setItem('categorias', JSON.stringify(data));
        renderTable('categorias-table-body', data, renderCategoriaRow);
        updateIdCounters();
    }).fail(() => {
        const localData = JSON.parse(localStorage.getItem('categorias') || '[]');
        renderTable('categorias-table-body', localData, renderCategoriaRow);
        showNotification('Error de red. Mostrando datos locales de categorías.', 'warning');
    });
}

/**
 * Abre el modal de categoría
 */
function openCategoriaModal(id = null) {
    if (!ensureAdminAction(id ? 'editar una categoría' : 'crear una categoría')) return;
    resetForm('#form-categoria', '#categoria-id-form');
    $('#modal-categoria-title').text(id ? 'Editar Categoría' : 'Nueva Categoría');
    $('#categoria-id-form').val(id || '');
    if (id) {
        apiCall(`categorias.php?id=${id}`).done(data => {
            const cat = normalizeList(data)[0];
            if (cat) {
                $('#categoria-nombre').val(cat.nombre);
                $('#categoria-descripcion').val(cat.descripcion);
            }
        });
    }
    openModal('#modal-categoria');
}

/**
 * Maneja el envío del formulario de categoría
 */
function handleCategoriaSubmit(e) {
    e.preventDefault();
    if (!ensureAdminAction('guardar una categoría')) return;
    const id = $('#categoria-id-form').val();
    const nombre = $('#categoria-nombre').val();
    const payload = {
        nombre: nombre,
        descripcion: $('#categoria-descripcion').val()
    };
    
    payload.id = id || generateCategoriaId(payload);

    const method = id ? 'PUT' : 'POST';
    apiCall('categorias.php', method, payload).done(resp => {
        showNotification(resp.message, 'success');
        $('#modal-categoria').fadeOut(200);
        loadCategorias();
    });
}

/**
 * Renderiza una fila de categoría
 */
function renderCategoriaRow(categoria) {
    return `
    <tr data-id="${categoria.id}">
        <td class="py-3 px-4">${categoria.id}</td>
        <td class="py-3 px-4">${categoria.nombre}</td>
        <td class="py-3 px-4">${categoria.descripcion || ''}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-edit-categoria text-green-600 hover:text-green-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-delete-categoria text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}

/**
 * Genera ID único para categoría
 */
function generateCategoriaId(payload) {
    const nombre = payload.nombre ? payload.nombre.substring(0, 3).toUpperCase() : 'XXX';
    const consecutivo = String(window.idCounters.categorias++).padStart(3, '0');
    return `CAT-${nombre}-${consecutivo}`;
}

/**
 * Carga categorías para dropdown
 */
function loadCategoriasForDropdown() {
    return apiCall('categorias.php').done(data => {
        const categorias = normalizeList(data);
        const $sel = $('#producto-categoria');
        $sel.empty().append('<option value="">Seleccionar</option>');
        categorias.forEach(cat => { 
            console.log("Categoría encontrada para dropdown:", cat);
            $sel.append(`<option value="${String(cat.id).trim()}">${String(cat.nombre).trim()}</option>`); 
        });
    }).fail(() => {
        showNotification('No se pudieron cargar las categorías para el desplegable.', 'error');
    });
}
