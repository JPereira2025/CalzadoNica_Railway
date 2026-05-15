// --- MÓDULO: FACTURACIÓN ---

let carritoFactura = [];
let descuentoAplicado = { porcentaje: 0, codigo: '' };

/**
 * Configura los listeners para el módulo de facturación
 */
function setupFacturacionListeners() {
    $('#btn-nueva-factura').on('click', resetFacturaForm);
    $('#btn-agregar-producto-factura').on('click', agregarProductoAFactura);
    $(document).on('click', '.btn-eliminar-item-factura', function() {
        carritoFactura.splice($(this).data('index'), 1);
        renderizarTablaFactura();
    });
    $(document).on('click', '#btn-aplicar-codigo', function(e) { e.preventDefault(); aplicarCodigoDescuento(); });
    $('#factura-descuento').on('keypress', function(e) { if (e.which === 13) { e.preventDefault(); aplicarCodigoDescuento(); } });
    $('#factura-iva').on('change', calcularTotales);
    $('#form-factura').on('submit', guardarFactura);
    $('#btn-cancelar-factura').on('click', resetFacturaForm);
    $(document).on('click', '.btn-ver-factura', function() { verFactura($(this).data('id')); });
    $(document).on('click', '.btn-eliminar-factura', function() { eliminarFactura($(this).data('id')); });
}

/**
 * Carga la lista de facturas
 */
function loadFacturas() {
    apiCall('facturas.php').done(data => {
        renderTable('facturas-table-body', data, renderFacturaRow);
    }).fail(() => {
        showNotification('No se pudieron cargar las facturas guardadas.', 'error');
    });
}

/**
 * Resetea el formulario de factura
 */
function resetFacturaForm() {
    carritoFactura = [];
    descuentoAplicado = { porcentaje: 0, codigo: '' };
    $('#form-factura')[0].reset();
    $("#factura-iva").prop('checked', true);
    $("#factura-numero").val(`FAC-${Date.now()}`);
    $("#factura-fecha").val(new Date().toLocaleString('es-NI'));
    $("#factura-vendedor").val(currentUser ? currentUser.username : 'N/A');
    renderizarTablaFactura();
}

/**
 * Agrega un producto al carrito
 */
function agregarProductoAFactura() {
    const productoId = $("#factura-producto-select").val();
    const cantidad = parseInt($("#factura-cantidad").val()) || 0;
    if (!productoId || cantidad <= 0) {
        showNotification("Seleccione un producto y cantidad válida.", "error");
        return;
    }
    const $option = $("#factura-producto-select option:selected");
    const nombre = $option.text();
    const precio = parseFloat($option.data('precio'));
    const itemExistente = carritoFactura.find(item => item.id === productoId);
    if (itemExistente) { itemExistente.cantidad += cantidad; } 
    else { carritoFactura.push({ id: productoId, nombre: nombre, precio: precio, cantidad: cantidad }); }
    $("#factura-producto-select").val('');
    $("#factura-cantidad").val(1);
    renderizarTablaFactura();
}

/**
 * Renderiza la tabla de items de factura
 */
function renderizarTablaFactura() {
    const $tbody = $("#factura-items-body");
    $tbody.empty();
    carritoFactura.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        const row = `
        <tr>
            <td class="py-2 px-4">${item.nombre}</td>
            <td class="py-2 px-4">C$${item.precio.toFixed(2)}</td>
            <td class="py-2 px-4">${item.cantidad}</td>
            <td class="py-2 px-4">C$${subtotal.toFixed(2)}</td>
            <td class="py-2 px-4 text-center">
                <button type="button" class="btn-eliminar-item-factura text-red-600 hover:text-red-800" data-index="${index}" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
        $tbody.append(row);
    });
    calcularTotales();
}

/**
 * Calcula los totales de la factura
 */
function calcularTotales() {
    const subtotal = carritoFactura.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const montoDescuento = subtotal * (descuentoAplicado.porcentaje / 100);
    const baseIva = subtotal - montoDescuento;
    const iva = $("#factura-iva").is(':checked') ? baseIva * 0.15 : 0;
    const total = subtotal - montoDescuento + iva;
    $("#factura-subtotal").text(`C$${subtotal.toFixed(2)}`);
    $("#factura-monto-descuento").text(`-C$${montoDescuento.toFixed(2)}`);
    $("#factura-iva-monto").text(`C$${iva.toFixed(2)}`);
    $("#factura-total").text(`C$${total.toFixed(2)}`);
}

/**
 * Aplica un código de descuento
 */
function aplicarCodigoDescuento() {
    const codigoIngresado = $("#factura-descuento").val().trim().toUpperCase();
    if (!codigoIngresado) {
        descuentoAplicado = { porcentaje: 0, codigo: '' };
        showNotification("Descuento removido.", "info");
        calcularTotales();
        return;
    }
    const codigoValido = codigosDescuento.find(c => c.codigo.toUpperCase() === codigoIngresado);
    if (codigoValido && codigoValido.estado == 1) {
        const hoy = new Date().toISOString().split('T')[0];
        if (codigoValido.fecha_inicio <= hoy && codigoValido.fecha_fin >= hoy) {
            descuentoAplicado = { porcentaje: parseFloat(codigoValido.porcentaje_descuento), codigo: codigoValido.codigo };
            showNotification(`Código "${codigoValido.codigo}" aplicado!`, 'success');
        } else {
            showNotification("El código de descuento está fuera de su fecha de vigencia.", "error");
        }
    } else {
        showNotification("Código de descuento no válido o inactivo.", "error");
    }
    calcularTotales();
}

/**
 * Guarda la factura
 */
function guardarFactura(e) {
    e.preventDefault();
    if (carritoFactura.length === 0) {
        showNotification("Agregue productos a la factura.", "error");
        return;
    }
    const facturaId = generateFacturaId();
    const facturaData = {
        id: facturaId,
        cliente: $("#factura-cliente").val(),
        vendedor: $("#factura-vendedor").val(),
        items: carritoFactura,
        descuento_codigo: descuentoAplicado.codigo || null,
        descuento_porcentaje: descuentoAplicado.porcentaje,
        aplica_iva: $("#factura-iva").is(':checked'),
        subtotal: $("#factura-subtotal").text().replace('C$', ''),
        monto_descuento: $("#factura-monto-descuento").text().replace('-C$', ''),
        iva: $("#factura-iva-monto").text().replace('C$', ''),
        total: $("#factura-total").text().replace('C$', '')
    };
    apiCall('facturas.php', 'POST', facturaData).done(resp => {
        showNotification(resp.message, 'success');
        loadFacturas();
        resetFacturaForm();
        loadProductos();
    });
}

/**
 * Ve una factura específica
 */
function verFactura(id) {
    apiCall(`facturas.php?id=${id}`).done(factura => {
        const itemsHtml = (factura.items || []).map(item => `
            <tr>
                <td class="py-2 px-4">${item.nombre_producto}</td>
                <td class="py-2 px-4">C$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                <td class="py-2 px-4">${item.cantidad}</td>
                <td class="py-2 px-4">C$${(item.precio_unitario * item.cantidad).toFixed(2)}</td>
            </tr>`).join('');
        const content = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div><strong>N° Factura:</strong> ${factura.id}</div>
                <div><strong>Fecha:</strong> ${factura.fecha}</div>
                <div><strong>Cliente:</strong> ${factura.cliente}</div>
                <div><strong>Vendedor:</strong> ${factura.vendedor}</div>
            </div>
            <table class="min-w-full bg-white border border-gray-200 mb-4">
                <thead class="bg-gray-50"><tr><th>Producto</th><th>P. Unitario</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="text-right">
                <p>Subtotal: C$${parseFloat(factura.subtotal || 0).toFixed(2)}</p>
                <p>Descuento: -C$${parseFloat(factura.monto_descuento || 0).toFixed(2)}</p>
                <p>IVA (15%): C$${parseFloat(factura.iva || 0).toFixed(2)}</p>
                <p class="text-lg font-bold">Total: C$${parseFloat(factura.total || 0).toFixed(2)}</p>
            </div>
        `;
        $("#ver-factura-content").html(content);
        openModal("#modal-ver-factura");
    });
}

/**
 * Elimina una factura
 */
function eliminarFactura(id) {
    if (confirm('¿Eliminar esta factura? Esta acción es permanente.')) {
        apiCall(`facturas.php?id=${id}`, 'DELETE').done(resp => {
            showNotification(resp.message, 'success');
            loadFacturas();
        });
    }
}

/**
 * Renderiza una fila de factura
 */
function renderFacturaRow(factura) {
    const totalF = parseFloat(factura.total || 0).toFixed(2);
    const fechaF = new Date(factura.fecha).toLocaleString('es-NI');
    return `
    <tr data-id="${factura.id}">
        <td class="py-3 px-4">${factura.id}</td>
        <td class="py-3 px-4">${factura.cliente}</td>
        <td class="py-3 px-4">${fechaF}</td>
        <td class="py-3 px-4">${factura.vendedor}</td>
        <td class="py-3 px-4 text-right">C$${totalF}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-ver-factura text-blue-600 hover:text-blue-800 mx-1" data-id="${factura.id}" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            <button class="btn-eliminar-factura text-red-600 hover:text-red-800 mx-1" data-id="${factura.id}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}

/**
 * Genera ID único para factura
 */
function generateFacturaId() {
    const consecutivo = String(window.idCounters.facturas++).padStart(4, '0');
    return `FACT-${consecutivo}`;
}
