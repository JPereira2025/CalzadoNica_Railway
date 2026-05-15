// --- MÓDULO: CÓDIGOS PROMOCIONALES ---

let codigosDescuento = [];

/**
 * Configura los listeners para el módulo de códigos
 */
function setupCodigosListeners() {
    $('#btn-add-codigo').on('click', () => openCodigoModal());
    $(document).on('click', '.btn-edit-codigo', function() { openCodigoModal($(this).closest('tr').data('id')); });
    $(document).on('click', '.btn-delete-codigo', function() {
        const id = $(this).closest('tr').data('id');
        if (confirm('¿Eliminar código?')) {
            apiCall(`codigos.php?id=${id}`, 'DELETE').done(resp => {
                showNotification(resp.message, 'success');
                loadCodigos();
            });
        }
    });
    $('#form-codigo').on('submit', handleCodigoSubmit);
}

/**
 * Carga la lista de códigos de descuento
 */
function loadCodigos(callback) {
    apiCall('codigos.php').done(data => {
        codigosDescuento = normalizeList(data);
        localStorage.setItem('codigos', JSON.stringify(data));
        updateIdCounters();
        renderTable('codigos-table-body', data, renderCodigoRow);
    }).fail(() => {
        const localData = JSON.parse(localStorage.getItem('codigos') || '[]');
        codigosDescuento = normalizeList(localData);
        renderTable('codigos-table-body', localData, renderCodigoRow);
        showNotification('Error de red. Mostrando datos locales de códigos.', 'warning');
    }).always(() => {
        if (typeof callback === 'function') callback();
    });
}

/**
 * Abre el modal de código
 */
function openCodigoModal(id = null) {
    resetForm('#form-codigo', '#codigo-id-form');
    $('#modal-codigo-title').text(id ? 'Editar Código' : 'Nuevo Código');
    $('#codigo-id-form').val(id || '');
    if (id) {
        apiCall(`codigos.php?id=${id}`).done(data => {
            const cod = normalizeList(data)[0];
            if (cod) {
                $('#codigo-codigo').val(cod.codigo);
                $('#codigo-descuento').val(cod.porcentaje_descuento);
                $('#codigo-fecha-inicio').val(cod.fecha_inicio);
                $('#codigo-fecha-fin').val(cod.fecha_fin);
                $('#codigo-estado').val(cod.estado);
                $('#codigo-descripcion').val(cod.descripcion);
            }
        });
    }
    openModal('#modal-codigo');
}

/**
 * Maneja el envío del formulario de código
 */
function handleCodigoSubmit(e) {
    e.preventDefault();
    const id = $('#codigo-id-form').val();
    const payload = {
        codigo: $('#codigo-codigo').val(),
        porcentaje_descuento: $('#codigo-descuento').val(),
        fecha_inicio: $('#codigo-fecha-inicio').val(),
        fecha_fin: $('#codigo-fecha-fin').val(),
        estado: $('#codigo-estado').val(),
        descripcion: $('#codigo-descripcion').val()
    };
    payload.id = id || generateCodigoId();
    const method = id ? 'PUT' : 'POST';
    apiCall('codigos.php', method, payload).done(resp => {
        showNotification(resp.message, 'success');
        $('#modal-codigo').fadeOut(200);
        loadCodigos();
    });
}

/**
 * Renderiza una fila de código
 */
function renderCodigoRow(codigo) {
    const estadoBadge = codigo.estado == 1 
        ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>' 
        : '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactivo</span>';
    return `
    <tr data-id="${codigo.id}">
        <td class="py-3 px-4">${codigo.id}</td>
        <td class="py-3 px-4 font-mono font-bold">${codigo.codigo}</td>
        <td class="py-3 px-4">${codigo.porcentaje_descuento}%</td>
        <td class="py-3 px-4">${codigo.fecha_inicio || ''}</td>
        <td class="py-3 px-4">${codigo.fecha_fin || ''}</td>
        <td class="py-3 px-4">${estadoBadge}</td>
        <td class="py-3 px-4">${codigo.descripcion || ''}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-edit-codigo text-orange-600 hover:text-orange-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-delete-codigo text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}

/**
 * Genera ID único para código
 */
function generateCodigoId() {
    const consecutivo = String(window.idCounters.codigos++).padStart(3, '0');
    return `DESC-${consecutivo}`;
}
