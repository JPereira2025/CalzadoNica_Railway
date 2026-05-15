// --- MÓDULO: EMPLEADOS ---

/**
 * Configura los listeners para el módulo de empleados
 */
function setupEmpleadosListeners() {
    $('#btn-add-empleado').on('click', () => openEmpleadoModal());
    $(document).on('click', '.btn-edit-empleado', function() { openEmpleadoModal($(this).closest('tr').data('id')); });
    $(document).on('click', '.btn-delete-empleado', function() {
        const id = $(this).closest('tr').data('id');
        if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
            apiCall(`empleados.php?id=${id}`, 'DELETE').done(resp => {
                showNotification(resp.message || 'Empleado eliminado', 'success');
                loadEmpleados();
            });
        }
    });
    $('#form-empleado').on('submit', handleEmpleadoSubmit);
}

/**
 * Carga la lista de empleados
 */
function loadEmpleados() {
    apiCall('empleados.php').done(data => {
        localStorage.setItem('empleados', JSON.stringify(data));
        renderTable('empleados-table-body', data, renderEmpleadoRow);
        updateIdCounters();
    }).fail(() => {
        const localData = JSON.parse(localStorage.getItem('empleados') || '[]');
        renderTable('empleados-table-body', localData, renderEmpleadoRow);
        showNotification('Error de red. Mostrando datos locales de empleados.', 'warning');
    });
}

/**
 * Abre el modal de empleado para crear o editar
 */
function openEmpleadoModal(id = null) {
    resetForm('#form-empleado', '#empleado-id-form');
    $('#modal-empleado-title').text(id ? 'Editar Empleado' : 'Nuevo Empleado');
    $('#empleado-id-form').val(id || '');
    if (id) {
        apiCall(`empleados.php?id=${id}`).done(data => {
            const emp = normalizeList(data)[0];
            if (emp) {
                $('#empleado-nombres').val(emp.nombres);
                $('#empleado-apellidos').val(emp.apellidos);
                $('#empleado-sueldo').val(emp.sueldo_base);
                $('#empleado-nacimiento').val(emp.fecha_nacimiento);
                $('#empleado-cedula').val(emp.cedula);
                $('#empleado-sexo').val(emp.sexo);
                $('#empleado-estado').val(emp.estado_civil);
                $('#empleado-telefono').val(emp.telefono);
                $('#empleado-direccion').val(emp.direccion);
                $('#empleado-cargo').val(emp.cargo);
            }
        });
    }
    openModal('#modal-empleado');
}

/**
 * Maneja el envío del formulario de empleado
 */
function handleEmpleadoSubmit(e) {
    e.preventDefault();
    const id = $('#empleado-id-form').val();
    const payload = {
        nombres: $('#empleado-nombres').val(),
        apellidos: $('#empleado-apellidos').val(),
        sueldo_base: $('#empleado-sueldo').val(),
        fecha_nacimiento: $('#empleado-nacimiento').val(),
        cedula: $('#empleado-cedula').val(),
        sexo: $('#empleado-sexo').val(),
        estado_civil: $('#empleado-estado').val(),
        telefono: $('#empleado-telefono').val(),
        direccion: $('#empleado-direccion').val(),
        cargo: $('#empleado-cargo').val()
    };
    
    payload.id = id || generateEmpleadoId(payload);

    const method = id ? 'PUT' : 'POST';
    apiCall('empleados.php', method, payload).done(resp => {
        showNotification(resp.message, 'success');
        $('#modal-empleado').fadeOut(200);
        loadEmpleados();
    });
}

/**
 * Renderiza una fila de empleado
 */
function renderEmpleadoRow(empleado) {
    return `
    <tr data-id="${empleado.id}">
        <td class="py-3 px-4">${empleado.id}</td>
        <td class="py-3 px-4">${empleado.nombres}</td>
        <td class="py-3 px-4">${empleado.apellidos}</td>
        <td class="py-3 px-4">C$${parseFloat(empleado.sueldo_base || 0).toFixed(2)}</td>
        <td class="py-3 px-4">${empleado.fecha_nacimiento || ''}</td>
        <td class="py-3 px-4">${empleado.cedula || ''}</td>
        <td class="py-3 px-4">${empleado.sexo || ''}</td>
        <td class="py-3 px-4">${empleado.estado_civil || ''}</td>
        <td class="py-3 px-4">${empleado.telefono || ''}</td>
        <td class="py-3 px-4">${empleado.direccion || ''}</td>
        <td class="py-3 px-4">${empleado.cargo || ''}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-edit-empleado text-blue-600 hover:text-blue-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-delete-empleado text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}

/**
 * Genera ID único para empleado
 */
function generateEmpleadoId(payload) {
    const nombre1 = payload.nombres ? payload.nombres.substring(0, 1).toUpperCase() : 'X';
    const apellidos = payload.apellidos ? payload.apellidos.split(' ') : ['X', 'X'];
    const apellido1 = apellidos[0] ? apellidos[0].substring(0, 1).toUpperCase() : 'X';
    const apellido2 = apellidos[1] ? apellidos[1].substring(0, 1).toUpperCase() : 'X';
    const fechaFormateada = payload.fecha_nacimiento ? payload.fecha_nacimiento.replace(/-/g, '') : '00000000';
    return `EMP-${nombre1}${apellido1}${apellido2}-${fechaFormateada}`;
}
