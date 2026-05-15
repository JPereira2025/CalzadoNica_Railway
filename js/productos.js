// --- MÓDULO: PRODUCTOS ---

/**
 * Configura los listeners para el módulo de productos
 */
function setupProductosListeners() {
    $('#btn-add-producto').on('click', () => openProductoModal());
    $(document).on('click', '.btn-edit-producto', function() { openProductoModal($(this).closest('tr').data('id')); });
    $(document).on('click', '.btn-delete-producto', function() {
        const id = $(this).closest('tr').data('id');
        if (confirm('¿Eliminar producto?')) {
            apiCall(`productos.php?id=${id}`, 'DELETE').done(resp => {
                showNotification(resp.message, 'success');
                loadProductos();
            });
        }
    });
    $('#form-producto').on('submit', handleProductoSubmit);
}

/**
 * Carga la lista de productos
 */
function loadProductos(callback) {
    apiCall('productos.php').done(data => {
        localStorage.setItem('productos', JSON.stringify(data));
        renderTable('productos-table-body', data, renderProductoRow);
        updateIdCounters();
        populateFacturaProductoSelect();
    }).fail(() => {
        const localData = JSON.parse(localStorage.getItem('productos') || '[]');
        renderTable('productos-table-body', localData, renderProductoRow);
        showNotification('Error de red. Mostrando datos locales de productos.', 'warning');
    }).always(() => {
        if (typeof callback === 'function') callback();
    });
}

/**
 * Abre el modal de producto
 */
function openProductoModal(id = null) {
    resetForm('#form-producto', '#producto-id-form');
    $('#modal-producto-title').text(id ? 'Editar Producto' : 'Nuevo Producto');
    $('#producto-id-form').val(id || '');

    const categoriasPromise = loadCategoriasForDropdown();
    const estilosPromise = loadEstilosForDropdown();

    Promise.all([categoriasPromise, estilosPromise]).then(() => {
        if (id) {
            apiCall(`productos.php?id=${id}`).done(data => {
                const prod = normalizeList(data)[0];
                if (prod) {
                    $('#producto-marca').val(prod.marca);
                    $('#producto-modelo').val(prod.modelo);
                    $('#producto-talla').val(prod.talla);
                    $('#producto-color').val(prod.color);
                    $('#producto-precio').val(prod.precio);
                    $('#producto-stock').val(prod.stock);
                    $('#producto-categoria').val(prod.categoria_id);
                    $('#producto-estilo').val(prod.estilo_id);
                }
                openModal('#modal-producto');
            });
        } else {
            openModal('#modal-producto');
        }
    }).catch(error => {
        console.error("Error al cargar datos para el modal de producto:", error);
        showNotification('No se pudieron cargar los datos necesarios para el formulario de productos.', 'error');
    });
}

/**
 * Maneja el envío del formulario de producto
 */
function handleProductoSubmit(e) {
    e.preventDefault();
    const id = $('#producto-id-form').val();
    const payload = {
        marca: $('#producto-marca').val(),
        modelo: $('#producto-modelo').val(),
        talla: $('#producto-talla').val(),
        color: $('#producto-color').val(),
        precio: parseFloat($('#producto-precio').val()) || 0,
        stock: parseInt($('#producto-stock').val()) || 0,
        categoria_id: String($('#producto-categoria').val()),
        estilo_id: String($('#producto-estilo').val())
    };
    
    if (!payload.categoria_id || !payload.estilo_id) {
        showNotification('Debe seleccionar una categoría y un estilo para el producto.', 'error');
        return;
    }

    const method = id ? 'PUT' : 'POST';

    if (method === 'POST') {
        payload.id = generateProductoId(payload);
    } else {
        payload.id = id;
    }

    console.log("Enviando payload de producto:", payload);

    apiCall('productos.php', method, payload).done(resp => {
        showNotification(resp.message, 'success');
        $('#modal-producto').fadeOut(200);
        loadProductos();
    }).fail(xhr => {
        if (xhr.responseJSON && xhr.responseJSON.message) {
            showNotification(xhr.responseJSON.message, 'error');
        } else {
            showNotification('Error desconocido al guardar el producto. Revisa la consola.', 'error');
        }
    });
}

/**
 * Renderiza una fila de producto
 */
function renderProductoRow(producto) {
    const precioF = parseFloat(producto.precio || 0).toFixed(2);
    return `
    <tr data-id="${producto.id}">
        <td class="py-3 px-4">${producto.id}</td>
        <td class="py-3 px-4">${producto.marca || ''}</td>
        <td class="py-3 px-4">${producto.modelo || ''}</td>
        <td class="py-3 px-4">${producto.talla || ''}</td>
        <td class="py-3 px-4">${producto.color || ''}</td>
        <td class="py-3 px-4">C$${precioF}</td>
        <td class="py-3 px-4">${producto.stock || 0}</td>
        <td class="py-3 px-4">${producto.categoria_nombre || ''}</td>
        <td class="py-3 px-4">${producto.estilo_nombre || ''}</td>
        <td class="py-3 px-4 text-center">
            <button class="btn-edit-producto text-indigo-600 hover:text-indigo-800 mx-1" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-delete-producto text-red-600 hover:text-red-800 mx-1" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
        </td>
    </tr>`;
}

/**
 * Genera ID único para producto
 */
function generateProductoId(payload) {
    const marca = payload.marca ? payload.marca.substring(0, 2).toUpperCase() : 'XX';
    const consecutivo = String(window.idCounters.productos++).padStart(3, '0');
    return `PROD-${marca}-${consecutivo}`;
}

/**
 * Popula el select de productos en la factura
 */
function populateFacturaProductoSelect() {
    const productosData = JSON.parse(localStorage.getItem('productos') || '[]');
    const productos = normalizeList(productosData);
    const $select = $("#factura-producto-select");
    $select.empty().append('<option value="">-- Seleccione --</option>');
    productos.forEach(p => {
        if (p.stock > 0) {
            $select.append(`<option value="${p.id}" data-precio="${p.precio}">${p.marca} - ${p.modelo} (Stock: ${p.stock})</option>`);
        }
    });
}
