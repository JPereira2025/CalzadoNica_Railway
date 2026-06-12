// --- MÓDULO: PRODUCTOS ---
// Etapas del módulo:
// 1. setupProductosListeners(): define listeners de UI para crear, editar y eliminar productos.
// 2. loadProductos(): carga la lista desde la API y renderiza la tabla.
// 3. openProductoModal(): abre el modal para creación o edición.
// 4. handleProductoSubmit(): envía el formulario y refresca la lista.
// 5. renderProductoRow(): construye la fila HTML de cada producto.

/**
 * Configura los listeners para el módulo de productos
 */
function setupProductosListeners() {
    $(document).on('click', '#btn-add-producto', () => {
        if (ensureAdminAction('crear un producto')) openProductoModal();
    });
    $(document).on('click', '.btn-edit-producto', function() {
        if (ensureAdminAction('editar un producto')) openProductoModal($(this).closest('tr').data('id'));
    });
    $(document).on('click', '.btn-delete-producto', function() {
        if (!ensureAdminAction('eliminar un producto')) return;
        const id = $(this).closest('tr').data('id');
        if (confirm('¿Eliminar producto?')) {
            apiCall(`productos.php?id=${id}`, 'DELETE').done(resp => {
                showNotification(resp.message, 'success');
                loadProductos();
            });
        }
    });
    $(document).on('submit', '#form-producto', handleProductoSubmit);
    
    // También permitir que el botón de la imagen en la tabla abra el modal de edición directamente en la sección de fotos
    $(document).on('click', '.btn-images-producto', function() {
        const id = $(this).closest('tr').data('id');
        openProductoModal(id);
    });

    // listeners para gestionar imágenes
    setupProductImageManagementListeners(); // Nuevo listener para la sección de imágenes en el modal de producto
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
    if (!ensureAdminAction(id ? 'editar un producto' : 'crear un producto')) return;
    resetForm('#form-producto', '#producto-id-form');
    $('#modal-producto-title').text(id ? 'Editar Producto' : 'Nuevo Producto');
    $('#producto-id-form').val(id || '');

    // Resetear la sección de imágenes
    $('#producto-nueva-imagen').val(''); // Limpiar input de archivo
    $('#btn-upload-img').addClass('hidden'); // Ocultar botón de subir

    const categoriasPromise = loadCategoriasForDropdown();
    const estilosPromise = loadEstilosForDropdown();

    Promise.all([categoriasPromise, estilosPromise]).then(() => {
        if (id) {
            apiCall(`productos.php?id=${id}`).done(data => {
                const prod = normalizeList(data)[0];
                if (prod) {
                    $('#producto-marca').val(prod.marca);
                    $('#producto-modelo').val(prod.modelo);
                    // soportar tallas como array o string
                    if (Array.isArray(prod.tallas) && prod.tallas.length) {
                        $('#producto-talla').val(prod.tallas.join(','));
                    } else {
                        $('#producto-talla').val(prod.talla || '');
                    }
                    $('#producto-color').val(prod.color);
                    $('#producto-precio').val(prod.precio);
                    $('#producto-stock').val(prod.stock);
                    $('#producto-categoria').val(prod.categoria_id);
                    $('#producto-estilo').val(prod.estilo_id);
                }
                console.log("[DEBUG] Mostrando sección de imágenes para producto:", id);
                $('#producto-imagenes-section').removeClass('hidden'); // Mostrar sección de imágenes
                loadImagesForProductModal(id); // Cargar imágenes existentes
                openModal('#modal-producto');
            });
        } else {
            console.log("[DEBUG] Ocultando sección de imágenes (Nuevo Producto)");
            $('#producto-imagenes-section').addClass('hidden'); // Ocultar sección de imágenes para nuevo producto
            $('#producto-imagenes-list').html('<p class="col-span-full text-center text-gray-400 text-sm">No hay imágenes. Haz clic en "Elegir Foto" para comenzar.</p>');
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
    if (!ensureAdminAction('guardar un producto')) return;
    const id = $('#producto-id-form').val();
    const payload = {
        marca: $('#producto-marca').val(),
        modelo: $('#producto-modelo').val(),
        // aceptar múltiples tallas separadas por comas
        talla: $('#producto-talla').val(),
        tallas: ($('#producto-talla').val() || '').split(',').map(s => s.trim()).filter(Boolean),
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
                <button class="btn-images-producto text-green-600 hover:text-green-800 mx-1" title="Imágenes"><i class="fas fa-image"></i></button>
        </td>
    </tr>`;
}

/**
 * Configura los listeners para la gestión de imágenes dentro del modal de producto.
 */
function setupProductImageManagementListeners() {
    // Mostrar/ocultar botón de subir al seleccionar archivo
    $(document).on('change', '#producto-nueva-imagen', function() {
        if (this.files && this.files[0]) {
            $('#btn-upload-img').removeClass('hidden');
        } else {
            $('#btn-upload-img').addClass('hidden');
        }
    });

    // Subir imagen al servidor
    $(document).on('click', '#btn-upload-img', function() {
        const prodId = $('#producto-id-form').val();
        if (!prodId) {
            showNotification('Primero debe guardar el producto para poder subir imágenes.', 'error');
            return;
        }

        const fileEl = document.getElementById('producto-nueva-imagen');
        if (!fileEl || !fileEl.files || !fileEl.files.length) {
            showNotification('Seleccione un archivo para subir', 'error');
            return;
        }

        const fd = new FormData();
        fd.append('imagen', fileEl.files[0]);
        // Puedes añadir campos para es_principal y orden si los necesitas en el modal
        // fd.append('es_principal', '0'); 
        // fd.append('orden', '0');

        const token = sessionStorage.getItem('authToken');
        $.ajax({
            url: mapEndpoint(`api/productos/${prodId}/imagenes`),
            method: 'POST',
            data: fd,
            processData: false, // Importante para FormData
            contentType: false, // Importante para FormData
            headers: { 'Authorization': token ? 'Bearer ' + token : '' }
        }).done(resp => {
            showNotification(resp.message, 'success');
            $('#producto-nueva-imagen').val(''); // Limpiar input de archivo
            $('#btn-upload-img').addClass('hidden'); // Ocultar botón de subir
            loadImagesForProductModal(prodId); // Recargar lista de imágenes
            loadProductos(); // Para actualizar la imagen principal en la tabla
        }).fail((xhr) => {
            showNotification('Error subiendo imagen', 'error');
            console.error('Upload error', xhr.responseText || xhr);
        });
    });

    // Eliminar imagen
    $(document).on('click', '.btn-delete-imagen-modal', function() {
        if (!confirm('¿Eliminar esta imagen?')) return;
        const imgId = $(this).data('imgid');
        const prodId = $('#producto-id-form').val();
        const token = sessionStorage.getItem('authToken');
        $.ajax({
            url: mapEndpoint(`api/productos/${prodId}/imagenes/${imgId}`),
            method: 'DELETE',
            headers: { 'Authorization': token ? 'Bearer ' + token : '' }
        }).done(() => {
            showNotification('Imagen eliminada', 'success');
            loadImagesForProductModal(prodId);
            loadProductos(); // Para actualizar la imagen principal en la tabla
        }).fail((xhr) => {
            showNotification('Error eliminando imagen', 'error');
            console.error(xhr.responseText || xhr);
        });
    });

    // Marcar imagen como principal
    $(document).on('click', '.btn-set-principal-modal', function() {
        const imgId = $(this).data('imgid');
        const prodId = $('#producto-id-form').val();
        const token = sessionStorage.getItem('authToken');
        $.ajax({
            url: mapEndpoint(`api/productos/${prodId}/imagenes/${imgId}/principal`),
            method: 'POST',
            headers: { 'Authorization': token ? 'Bearer ' + token : '' }
        }).done(() => {
            showNotification('Imagen marcada como principal', 'success');
            loadImagesForProductModal(prodId);
            loadProductos(); // Para actualizar la imagen principal en la tabla
        }).fail((xhr) => {
            showNotification('Error marcando principal', 'error');
            console.error(xhr.responseText || xhr);
        });
    });
}

/**
 * Carga y renderiza las imágenes de un producto en el modal.
 */
function loadImagesForProductModal(prodId) {
    const token = sessionStorage.getItem('authToken');
    $.ajax({
        url: mapEndpoint(`api/productos/${prodId}/imagenes`),
        method: 'GET',
        headers: { 'Authorization': token ? 'Bearer ' + token : '' }
    }).done((imgs) => {
        const $list = $('#producto-imagenes-list');
        $list.empty();
        if (!imgs || !imgs.length) {
            $list.append('<p class="col-span-full text-center text-gray-400 text-sm">No hay imágenes. Haz clic en "Elegir Foto" para comenzar.</p>');
            return;
        }
        imgs.forEach(img => {
            const thumb = `<div class="border p-2 rounded relative">
                <img src="${img.url}" class="w-full h-32 object-cover rounded mb-2" />
                <div class="flex justify-between gap-2">
                  <button class="btn-set-principal-modal bg-blue-600 text-white py-1 px-2 rounded text-sm" data-imgid="${img.id}">${img.es_principal ? 'Principal' : 'Marcar'}</button>
                  <button class="btn-delete-imagen-modal bg-red-600 text-white py-1 px-2 rounded text-sm" data-imgid="${img.id}">Eliminar</button>
                </div>
            </div>`;
            $list.append(thumb);
        });
    }).fail((xhr) => {
        showNotification('Error cargando imágenes del producto', 'error');
        console.error(xhr.responseText || xhr);
    });
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
