// --- MÓDULO: EMPLEADOS ---
// Etapas del módulo:
// 1. setupEmpleadosListeners(): define listeners de UI para crear, editar y eliminar empleados.
// 2. loadEmpleados(): carga la lista desde la API y renderiza la tabla.
// 3. openEmpleadoModal(): abre el modal para creación o edición.
// 4. handleEmpleadoSubmit(): envía el formulario y refresca la lista.
// 5. renderEmpleadoRow(): construye la fila HTML de cada empleado.

/**
 * Configura los listeners para el módulo de empleados
 */
function setupEmpleadosListeners() {
    $(document).on('click', '#btn-add-empleado', () => {
        if (ensureAdminAction('crear un empleado')) openEmpleadoModal();
    });
    $(document).on('click', '.btn-edit-empleado', function() {
        if (ensureAdminAction('editar un empleado')) openEmpleadoModal($(this).closest('tr').data('id'));
    });
    $(document).on('click', '.btn-delete-empleado', function() {
        if (!ensureAdminAction('eliminar un empleado')) return;
        const id = $(this).closest('tr').data('id');
        if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
            apiCall(`/api/empleados?id=${id}`, 'DELETE').done(resp => {
                showNotification(resp.message || 'Empleado eliminado', 'success');
                loadEmpleados();
            });
        }
    });
    $(document).on('input', '#empleado-cedula', function() {
        $(this).val(maskCedulaInput($(this).val()));
    });
    $(document).on('paste', '#empleado-cedula', function() {
        const $input = $(this);
        setTimeout(() => {
            $input.val(maskCedulaInput($input.val()));
        }, 0);
    });
    $(document).on('blur', '#empleado-cedula', function() {
        $(this).val(maskCedulaInput($(this).val()));
    });
    $(document).on('submit', '#form-empleado', handleEmpleadoSubmit);
}

/**
 * Carga la lista de empleados
 */
/**
 * Helper: convierte varios formatos de fecha a ISO `yyyy-mm-dd` para inputs
 */
function parseDateToISO(dateVal) {
    if (!dateVal) return '';
    // Si ya es un objeto Date
    if (dateVal instanceof Date) {
        const y = dateVal.getFullYear();
        const m = String(dateVal.getMonth() + 1).padStart(2, '0');
        const d = String(dateVal.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    // Si viene como ISO completo o con hora
    const asString = String(dateVal);
    // Aceptar formats como 2026-05-25T00:00:00.000Z o 2026-05-25 00:00:00
    const isoMatch = asString.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    // Aceptar formatos con guiones ya en yyyy-mm-dd
    const simpleMatch = asString.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (simpleMatch) return simpleMatch[1];
    return '';
}

/**
 * Helper: convierte ISO `yyyy-mm-dd` a formato de pantalla `dd/mm/yyyy`
 */
function formatDateForDisplay(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Normaliza y valida cédula: quita timestamps pegados y fuerza mayúscula
 */
function formatCedulaRaw(cedula) {
    if (!cedula) return '';
    let s = String(cedula).replace(/T\d{2}:\d{2}:\d{2}.*$/i, '').trim();
    s = s.toUpperCase();
    return s;
}

function maskCedulaInput(value) {
    if (!value) return '';
    const raw = String(value).toUpperCase().replace(/[^0-9A-Z]/g, '');
    const part1 = raw.slice(0, 3);
    const part2 = raw.slice(3, 9);
    const part3 = raw.slice(9, 13);
    const part4 = raw.slice(13, 14);
    let masked = part1;
    if (part2) masked += '-' + part2;
    if (part3) masked += '-' + part3;
    if (part4) masked += part4;
    return masked;
}

function normalizeEmpleadoData(empleado) {
    const sueldo = empleado.sueldo_base ?? empleado.sueldo ?? empleado.salario ?? 0;
    const rawFecha = empleado.fecha_nacimiento ?? empleado.nacimiento ?? '';
    const fechaIso = parseDateToISO(rawFecha);
    const fechaDisplay = fechaIso ? formatDateForDisplay(fechaIso) : '';
    return {
        ...empleado,
        sueldo_base: sueldo,
        // fecha_nacimiento se mantiene en formato ISO (para inputs y envío al servidor)
        fecha_nacimiento: fechaIso,
        nacimiento: fechaIso,
        fecha_nacimiento_display: fechaDisplay
    };
}

function loadEmpleados() {
    apiCall('/api/empleados').done(data => {
        const normalized = normalizeList(data).map(normalizeEmpleadoData);
        localStorage.setItem('empleados', JSON.stringify(normalized));
        renderTable('empleados-table-body', normalized, renderEmpleadoRow);
        updateIdCounters();
    }).fail(() => {
        const localData = JSON.parse(localStorage.getItem('empleados') || '[]').map(normalizeEmpleadoData);
        renderTable('empleados-table-body', localData, renderEmpleadoRow);
        showNotification('Error de red. Mostrando datos locales de empleados.', 'warning');
    });
}

/**
 * Abre el modal de empleado para crear o editar
 */
function getEmpleadoSueldo(empleado) {
    return empleado.sueldo_base ?? empleado.sueldo ?? empleado.salario ?? 0;
}

function openEmpleadoModal(id = null) {
    if (!ensureAdminAction(id ? 'editar un empleado' : 'crear un empleado')) return;
    resetForm('#form-empleado', '#empleado-id-form');
    $('#modal-empleado-title').text(id ? 'Editar Empleado' : 'Nuevo Empleado');
    $('#empleado-id-form').val(id || '');
    if (id) {
        apiCall(`/api/empleados?id=${id}`).done(data => {
            const emp = normalizeList(data)[0];
            if (emp) {
                $('#empleado-nombres').val(emp.nombres);
                $('#empleado-apellidos').val(emp.apellidos);
                $('#empleado-sueldo').val(getEmpleadoSueldo(emp));
                const fechaIso = parseDateToISO(emp.fecha_nacimiento || emp.nacimiento || '');
                $('#empleado-nacimiento').val(fechaIso);
                $('#empleado-cedula').val(formatCedulaRaw(emp.cedula));
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
    if (!ensureAdminAction('guardar un empleado')) return;
    const id = $('#empleado-id-form').val();
    const sueldoValor = $('#empleado-sueldo').val();
    // Normalizar fecha a ISO (yyyy-mm-dd) antes de enviar para evitar corrupción en la BD
    const fechaInputRaw = $('#empleado-nacimiento').val();
    const fechaIso = parseDateToISO(fechaInputRaw);
    // Normalizar y validar cédula antes de enviar
    const cedulaRaw = $('#empleado-cedula').val() || '';
    const cedulaFormatted = maskCedulaInput(formatCedulaRaw(cedulaRaw));
    const cedulaPattern = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
    if (!cedulaPattern.test(cedulaFormatted)) {
        showNotification('Formato de cédula inválido. Use 111-111111-1111A', 'error');
        return;
    }

    const payload = {
        nombres: $('#empleado-nombres').val(),
        apellidos: $('#empleado-apellidos').val(),
        sueldo: sueldoValor,
        sueldo_base: sueldoValor,
        fecha_nacimiento: fechaIso,
        cedula: cedulaFormatted,
        sexo: $('#empleado-sexo').val(),
        estado_civil: $('#empleado-estado').val(),
        telefono: $('#empleado-telefono').val(),
        direccion: $('#empleado-direccion').val(),
        cargo: $('#empleado-cargo').val()
    };
    
    payload.id = id || generateEmpleadoId(payload);

    const method = id ? 'PUT' : 'POST';
    apiCall('/api/empleados', method, payload).done(resp => {
        showNotification(resp.message, 'success');
        $('#modal-empleado').fadeOut(200);
        loadEmpleados();
    });
}

/**
 * Renderiza una fila de empleado
 */
function renderEmpleadoRow(empleado) {
    const fechaRaw = empleado.fecha_nacimiento ?? empleado.nacimiento ?? '';
    const fechaIso = parseDateToISO(fechaRaw);
    const fechaDisplay = fechaIso ? formatDateForDisplay(fechaIso) : (empleado.fecha_nacimiento_display || '');
    return `
    <tr data-id="${empleado.id}">
        <td class="py-3 px-4">${empleado.id}</td>
        <td class="py-3 px-4">${empleado.nombres}</td>
        <td class="py-3 px-4">${empleado.apellidos}</td>
        <td class="py-3 px-4">C$${parseFloat(getEmpleadoSueldo(empleado)).toFixed(2)}</td>
        <td class="py-3 px-4">${fechaDisplay}</td>
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
    const fechaFormateada = payload.fecha_nacimiento ? payload.fecha_nacimiento.replace(/-/g, '') : '';
    const parts = [`EMP`, `${nombre1}${apellido1}${apellido2}`];
    if (fechaFormateada) parts.push(fechaFormateada);
    return parts.join('-');
}
