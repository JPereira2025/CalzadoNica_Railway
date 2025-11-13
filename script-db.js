// --- VERSIÓN CON CONEXIÓN A BASE DE DATOS Y CARRUSEL ---

// Variables globales
let currentUser = null;
const API_URL = 'api.php?endpoint=';

// Inicialización de la aplicación
 $(document).ready(function() {
    // Verificar si hay una sesión activa
    checkSession();
    
    // Login form submission
    $("#loginForm").on("submit", function(e) {
        e.preventDefault();
        const username = $("#username").val();
        const password = $("#password").val();
        
        $.ajax({
            url: API_URL + 'login',
            method: 'POST',
            data: JSON.stringify({ username, password }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    currentUser = response.user;
                    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                    $("#loginModal").fadeOut(200, function() {
                        $("#app").fadeIn(200);
                        $("#user-name").text(currentUser.username);
                        $("#user-role").text(currentUser.role);
                        showNotification(`Bienvenido, ${currentUser.username}!`, "success");
                        loadInitialData();
                    });
                } else {
                    $("#loginError").removeClass("hidden");
                }
            },
            error: function() {
                showNotification("Error de conexión. Inténtelo más tarde.", "error");
            }
        });
    });

    // Navegación del sidebar
    $(".sidebar-link").on("click", function(e) {
        e.preventDefault();
        const target = $(this).attr("href").substring(1);
        navigateTo(target);
    });
    
    // Logout button
    $("#logout-btn").on("click", function(e) {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        $("#app").fadeOut(200, function() {
            $("#loginModal").fadeIn(200);
            $("#username").val("");
            $("#password").val("");
            $("#loginError").addClass("hidden");
        });
    });

    // --- LÓGICA DE EMPLEADOS ---
    $("#btn-add-empleado").on("click", function() {
        resetForm();
        $("#modal-empleado-title").text("Nuevo Empleado");
        $("#modal-empleado").fadeIn(200);
    });

    $(document).on("click", ".btn-edit-empleado", function() {
        const id = $(this).closest("tr").data("id");
        
        $.ajax({
            url: API_URL + 'empleados',
            method: 'GET',
            success: function(empleados) {
                const empleado = empleados.find(e => e.id === id);
                if (empleado) {
                    $("#empleado-id-form").val(empleado.id);
                    $("#empleado-nombres").val(empleado.nombres);
                    $("#empleado-apellidos").val(empleado.apellidos);
                    $("#empleado-sueldo").val(empleado.sueldo_base);
                    $("#empleado-nacimiento").val(empleado.fecha_nacimiento);
                    $("#empleado-cedula").val(empleado.cedula);
                    $("#empleado-sexo").val(empleado.sexo);
                    $("#empleado-estado-civil").val(empleado.estado_civil);
                    $("#empleado-telefono").val(empleado.telefono);
                    $("#empleado-direccion").val(empleado.direccion);
                    $("#empleado-cargo").val(empleado.cargo);
                    $("#modal-empleado-title").text("Editar Empleado");
                    $("#modal-empleado").fadeIn(200);
                }
            },
            error: function() {
                showNotification("Error al cargar datos del empleado.", "error");
            }
        });
    });

    $('#empleado-cedula').on('input', function(e) {
        let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
        let formattedValue = '';
        if (value.length > 0) formattedValue = value.substring(0, 3);
        if (value.length > 3) formattedValue += '-' + value.substring(3, 9);
        if (value.length > 9) formattedValue += '-' + value.substring(9, 13);
        if (value.length > 13) formattedValue += value.substring(13, 14).toUpperCase();
        e.target.value = formattedValue;
    });

    $('#empleado-telefono').on('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        if (value.length > 0) formattedValue = value.substring(0, 4);
        if (value.length > 4) formattedValue += '-' + value.substring(4, 8);
        e.target.value = formattedValue;
    });

    $("#form-empleado").on("submit", function(e) {
        e.preventDefault();
        const id = $("#empleado-id-form").val();
        const nombres = $("#empleado-nombres").val();
        const apellidos = $("#empleado-apellidos").val();
        const sueldo = $("#empleado-sueldo").val();
        const nacimiento = $("#empleado-nacimiento").val();
        const cedula = $("#empleado-cedula").val();
        const sexo = $("#empleado-sexo").val();
        const estadoCivil = $("#empleado-estado-civil").val();
        const telefono = $("#empleado-telefono").val();
        const direccion = $("#empleado-direccion").val();
        const cargo = $("#empleado-cargo").val();
        
        const empleadoData = {
            id: id || `CN${nombres.charAt(0).toUpperCase()}${apellidos.charAt(0).toUpperCase()}${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
            nombres,
            apellidos,
            sueldo_base: parseFloat(sueldo),
            fecha_nacimiento: nacimiento,
            cedula,
            sexo,
            estado_civil: estadoCivil,
            telefono,
            direccion,
            cargo
        };
        
        const method = id ? 'PUT' : 'POST';
        const url = id ? API_URL + 'empleados' : API_URL + 'empleados';
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(empleadoData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    showNotification(`Empleado ${nombres} ${apellidos} ${id ? 'actualizado' : 'guardado'} correctamente.`, "success");
                    $("#modal-empleado").fadeOut(200);
                    loadEmpleados();
                } else {
                    showNotification(response.message || "Error al guardar empleado.", "error");
                }
            },
            error: function() {
                showNotification("Error de conexión. Inténtelo más tarde.", "error");
            }
        });
    });

    $(document).on("click", ".btn-delete-empleado", function() {
        if (confirm("¿Está seguro de que desea eliminar este empleado? Esta acción no se puede deshacer.")) {
            const id = $(this).closest("tr").data("id");
            
            $.ajax({
                url: API_URL + 'empleados&id=' + id,
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showNotification("Empleado eliminado correctamente.", "success");
                        loadEmpleados();
                    } else {
                        showNotification(response.message || "Error al eliminar empleado.", "error");
                    }
                },
                error: function() {
                    showNotification("Error de conexión. Inténtelo más tarde.", "error");
                }
            });
        }
    });

    // --- LÓGICA DE CATEGORÍAS ---
    $("#btn-add-categoria").on("click", function() {
        resetCategoriaForm();
        $("#modal-categoria-title").text("Nueva Categoría");
        $("#modal-categoria").fadeIn(200);
    });

    $(document).on("click", ".btn-edit-categoria", function() {
        const id = $(this).closest("tr").data("id");
        
        $.ajax({
            url: API_URL + 'categorias',
            method: 'GET',
            success: function(categorias) {
                const categoria = categorias.find(c => c.id === id);
                if (categoria) {
                    $("#categoria-id-form").val(categoria.id);
                    $("#categoria-nombre").val(categoria.nombre);
                    $("#categoria-descripcion").val(categoria.descripcion);
                    $("#modal-categoria-title").text("Editar Categoría");
                    $("#modal-categoria").fadeIn(200);
                }
            },
            error: function() {
                showNotification("Error al cargar datos de la categoría.", "error");
            }
        });
    });

    $("#form-categoria").on("submit", function(e) {
        e.preventDefault();
        const id = $("#categoria-id-form").val();
        const nombre = $("#categoria-nombre").val();
        const descripcion = $("#categoria-descripcion").val();
        
        const categoriaData = {
            id: id || `${nombre.substring(0, 2).toUpperCase()}${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
            nombre,
            descripcion
        };
        
        const method = id ? 'PUT' : 'POST';
        
        $.ajax({
            url: API_URL + 'categorias',
            method: method,
            data: JSON.stringify(categoriaData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    showNotification(`Categoría "${nombre}" ${id ? 'actualizada' : 'guardada'} correctamente.`, "success");
                    $("#modal-categoria").fadeOut(200);
                    loadCategorias();
                } else {
                    showNotification(response.message || "Error al guardar categoría.", "error");
                }
            },
            error: function() {
                showNotification("Error de conexión. Inténtelo más tarde.", "error");
            }
        });
    });

    $(document).on("click", ".btn-delete-categoria", function() {
        if (confirm("¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.")) {
            const id = $(this).closest("tr").data("id");
            
            $.ajax({
                url: API_URL + 'categorias&id=' + id,
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showNotification("Categoría eliminada correctamente.", "success");
                        loadCategorias();
                    } else {
                        showNotification(response.message || "Error al eliminar categoría.", "error");
                    }
                },
                error: function() {
                    showNotification("Error de conexión. Inténtelo más tarde.", "error");
                }
            });
        }
    });

    // --- LÓGICA DE ESTILOS ---
    $("#btn-add-estilo").on("click", function() {
        resetEstiloForm();
        $("#modal-estilo-title").text("Nuevo Estilo");
        $("#modal-estilo").fadeIn(200);
    });

    $(document).on("click", ".btn-edit-estilo", function() {
        const id = $(this).closest("tr").data("id");
        
        $.ajax({
            url: API_URL + 'estilos',
            method: 'GET',
            success: function(estilos) {
                const estilo = estilos.find(e => e.id === id);
                if (estilo) {
                    $("#estilo-id-form").val(estilo.id);
                    $("#estilo-nombre").val(estilo.nombre);
                    $("#estilo-descripcion").val(estilo.descripcion);
                    $("#modal-estilo-title").text("Editar Estilo");
                    $("#modal-estilo").fadeIn(200);
                }
            },
            error: function() {
                showNotification("Error al cargar datos del estilo.", "error");
            }
        });
    });

    $("#form-estilo").on("submit", function(e) {
        e.preventDefault();
        const id = $("#estilo-id-form").val();
        const nombre = $("#estilo-nombre").val();
        const descripcion = $("#estilo-descripcion").val();
        
        const estiloData = {
            id: id || `${nombre.substring(0, 2).toUpperCase()}${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
            nombre,
            descripcion
        };
        
        const method = id ? 'PUT' : 'POST';
        
        $.ajax({
            url: API_URL + 'estilos',
            method: method,
            data: JSON.stringify(estiloData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    showNotification(`Estilo "${nombre}" ${id ? 'actualizado' : 'guardado'} correctamente.`, "success");
                    $("#modal-estilo").fadeOut(200);
                    loadEstilos();
                } else {
                    showNotification(response.message || "Error al guardar estilo.", "error");
                }
            },
            error: function() {
                showNotification("Error de conexión. Inténtelo más tarde.", "error");
            }
        });
    });

    $(document).on("click", ".btn-delete-estilo", function() {
        if (confirm("¿Está seguro de que desea eliminar este estilo? Esta acción no se puede deshacer.")) {
            const id = $(this).closest("tr").data("id");
            
            $.ajax({
                url: API_URL + 'estilos&id=' + id,
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showNotification("Estilo eliminado correctamente.", "success");
                        loadEstilos();
                    } else {
                        showNotification(response.message || "Error al eliminar estilo.", "error");
                    }
                },
                error: function() {
                    showNotification("Error de conexión. Inténtelo más tarde.", "error");
                }
            });
        }
    });

    // --- LÓGICA DE PRODUCTOS ---
    $("#btn-add-producto").on("click", function() {
        resetProductoForm();
        $("#modal-producto-title").text("Nuevo Producto");
        $("#modal-producto").fadeIn(200);
    });

    $(document).on("click", ".btn-edit-producto", function() {
        const id = $(this).closest("tr").data("id");
        
        $.ajax({
            url: API_URL + 'productos',
            method: 'GET',
            success: function(productos) {
                const producto = productos.find(p => p.id === id);
                if (producto) {
                    $("#producto-id-form").val(producto.id);
                    $("#producto-marca").val(producto.marca);
                    $("#producto-modelo").val(producto.modelo);
                    $("#producto-talla").val(producto.talla);
                    $("#producto-color").val(producto.color);
                    $("#producto-precio").val(producto.precio);
                    $("#producto-stock").val(producto.stock);
                    $("#producto-categoria").val(producto.categoria_id);
                    $("#producto-estilo").val(producto.estilo_id);
                    $("#modal-producto-title").text("Editar Producto");
                    $("#modal-producto").fadeIn(200);
                }
            },
            error: function() {
                showNotification("Error al cargar datos del producto.", "error");
            }
        });
    });

    $("#form-producto").on("submit", function(e) {
        e.preventDefault();
        const id = $("#producto-id-form").val();
        const marca = $("#producto-marca").val();
        const modelo = $("#producto-modelo").val();
        const talla = $("#producto-talla").val();
        const color = $("#producto-color").val();
        const precio = $("#producto-precio").val();
        const stock = $("#producto-stock").val();
        const categoriaId = $("#producto-categoria").val();
        const estiloId = $("#producto-estilo").val();
        
        const productoData = {
            id: id || `${marca.substring(0, 2).toUpperCase()}${modelo.substring(0, 2).toUpperCase()}-${talla}${color.substring(0, 1).toUpperCase()}`,
            marca,
            modelo,
            talla,
            color,
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoria_id: categoriaId,
            estilo_id: estiloId
        };
        
        const method = id ? 'PUT' : 'POST';
        
        $.ajax({
            url: API_URL + 'productos',
            method: method,
            data: JSON.stringify(productoData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    showNotification(`Producto "${marca} ${modelo}" ${id ? 'actualizado' : 'guardado'} correctamente.`, "success");
                    $("#modal-producto").fadeOut(200);
                    loadProductos();
                } else {
                    showNotification(response.message || "Error al guardar producto.", "error");
                }
            },
            error: function() {
                showNotification("Error de conexión. Inténtelo más tarde.", "error");
            }
        });
    });

    $(document).on("click", ".btn-delete-producto", function() {
        if (confirm("¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.")) {
            const id = $(this).closest("tr").data("id");
            
            $.ajax({
                url: API_URL + 'productos&id=' + id,
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showNotification("Producto eliminado correctamente.", "success");
                        loadProductos();
                    } else {
                        showNotification(response.message || "Error al eliminar producto.", "error");
                    }
                },
                error: function() {
                    showNotification("Error de conexión. Inténtelo más tarde.", "error");
                }
            });
        }
    });

    // --- LÓGICA DE CÓDIGOS PROMOCIONALES ---
    $("#btn-add-codigo").on("click", function() {
        resetCodigoForm();
        $("#modal-codigo-title").text("Nuevo Código Promocional");
        $("#modal-codigo").fadeIn(200);
    });

    $(document).on("click", ".btn-edit-codigo", function() {
        const id = $(this).closest("tr").data("id");
        
        $.ajax({
            url: API_URL + 'codigos',
            method: 'GET',
            success: function(codigos) {
                const codigo = codigos.find(c => c.id === id);
                if (codigo) {
                    $("#codigo-id-form").val(codigo.id);
                    $("#codigo-descuento").val(codigo.codigo);
                    $("#codigo-porcentaje").val(codigo.porcentaje_descuento);
                    $("#codigo-inicio").val(codigo.fecha_inicio);
                    $("#codigo-fin").val(codigo.fecha_fin);
                    $("#codigo-estado").prop('checked', codigo.estado == 1);
                    $("#codigo-descripcion").val(codigo.descripcion);
                    $("#modal-codigo-title").text("Editar Código Promocional");
                    $("#modal-codigo").fadeIn(200);
                }
            },
            error: function() {
                showNotification("Error al cargar datos del código promocional.", "error");
            }
        });
    });

    $("#form-codigo").on("submit", function(e) {
        e.preventDefault();
        const id = $("#codigo-id-form").val();
        const descuento = $("#codigo-descuento").val();
        const porcentaje = $("#codigo-porcentaje").val();
        const inicio = $("#codigo-inicio").val();
        const fin = $("#codigo-fin").val();
        const estado = $("#codigo-estado").is(':checked') ? 1 : 0;
        const descripcion = $("#codigo-descripcion").val();
        
        const codigoData = {
            id: id || generateCodigoId(),
            codigo: descuento,
            porcentaje_descuento: parseInt(porcentaje),
            fecha_inicio: inicio,
            fecha_fin: fin,
            estado,
            descripcion
        };
        
        const method = id ? 'PUT' : 'POST';
        
        $.ajax({
            url: API_URL + 'codigos',
            method: method,
            data: JSON.stringify(codigoData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    showNotification(`Código "${descuento}" ${id ? 'actualizado' : 'guardado'} correctamente.`, "success");
                    $("#modal-codigo").fadeOut(200);
                    loadCodigos();
                } else {
                    showNotification(response.message || "Error al guardar código promocional.", "error");
                }
            },
            error: function() {
                showNotification("Error de conexión. Inténtelo más tarde.", "error");
            }
        });
    });

    $(document).on("click", ".btn-delete-codigo", function() {
        if (confirm("¿Está seguro de que desea eliminar este código promocional? Esta acción no se puede deshacer.")) {
            const id = $(this).closest("tr").data("id");
            
            $.ajax({
                url: API_URL + 'codigos&id=' + id,
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showNotification("Código promocional eliminado correctamente.", "success");
                        loadCodigos();
                    } else {
                        showNotification(response.message || "Error al eliminar código promocional.", "error");
                    }
                },
                error: function() {
                    showNotification("Error de conexión. Inténtelo más tarde.", "error");
                }
            });
        }
    });

    // --- LÓGICA DE FACTURACIÓN ---
    $("#btn-nueva-factura").on("click", resetFacturaForm);
    $("#btn-cancelar-factura").on("click", resetFacturaForm);
    $("#btn-agregar-producto-factura").on("click", agregarProductoAFactura);
    $(document).on("click", ".btn-eliminar-item-factura", function() { 
        const index = $(this).data('index'); 
        eliminarProductoDeFactura(index); 
    });
    $("#factura-descuento").on("blur", aplicarDescuento);
    $("#factura-iva").on("change", calcularTotales);
    $("#form-factura").on("submit", guardarFactura);
    $(document).on("click", ".btn-ver-factura", function() { 
        const id = $(this).data('id'); 
        verFactura(id); 
    });
    $(document).on("click", ".btn-eliminar-factura", function() { 
        const id = $(this).data('id'); 
        if (confirm("¿Está seguro de que desea eliminar esta factura?")) { 
            eliminarFactura(id); 
        } 
    });

    // --- LÓGICA DE USUARIOS ---
    $("#btn-add-usuario").on("click", function() {
        resetUsuarioForm();
        $("#modal-usuario-title").text("Nuevo Usuario");
        $("#modal-usuario").fadeIn(200);
    });

    $(document).on("click", ".btn-edit-usuario", function() {
        const id = $(this).closest("tr").data("id");
        
        $.ajax({
            url: API_URL + 'usuarios',
            method: 'GET',
            success: function(usuarios) {
                const usuario = usuarios.find(u => u.id == id);
                if (usuario) {
                    $("#usuario-id-form").val(usuario.id);
                    $("#usuario-username").val(usuario.username);
                    $("#usuario-password").val("");
                    $("#usuario-role").val(usuario.role);
                    $("#modal-usuario-title").text("Editar Usuario");
                    $("#modal-usuario").fadeIn(200);
                }
            },
            error: function() {
                showNotification("Error al cargar datos del usuario.", "error");
            }
        });
    });

    $("#form-usuario").on("submit", function(e) {
        e.preventDefault();
        const id = $("#usuario-id-form").val();
        const username = $("#usuario-username").val();
        const password = $("#usuario-password").val();
        const role = $("#usuario-role").val();
        
        const usuarioData = {
            id: id,
            username,
            role
        };
        
        if (password) {
            usuarioData.password = password;
        }
        
        const method = id ? 'PUT' : 'POST';
        
        $.ajax({
            url: API_URL + 'usuarios',
            method: method,
            data: JSON.stringify(usuarioData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    showNotification(`Usuario "${username}" ${id ? 'actualizado' : 'creado'} correctamente.`, "success");
                    $("#modal-usuario").fadeOut(200);
                    loadUsuarios();
                } else {
                    showNotification(response.message || "Error al guardar usuario.", "error");
                }
            },
            error: function() {
                showNotification("Error de conexión. Inténtelo más tarde.", "error");
            }
        });
    });

    $(document).on("click", ".btn-delete-usuario", function() {
        if (confirm("¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.")) {
            const id = $(this).closest("tr").data("id");
            
            $.ajax({
                url: API_URL + 'usuarios&id=' + id,
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showNotification("Usuario eliminado correctamente.", "success");
                        loadUsuarios();
                    } else {
                        showNotification(response.message || "Error al eliminar usuario.", "error");
                    }
                },
                error: function() {
                    showNotification("Error de conexión. Inténtelo más tarde.", "error");
                }
            });
        }
    });

    // Cerrar modales (compartido para todos)
    $(".modal-close").on("click", function() {
        $(this).closest('.modal').fadeOut(200);
    });

    // Funciones de exportación e impresión
    $(".btn-export").on("click", function() {
        const tableId = $(this).data("table-id");
        const type = $(this).data("type");
        
        // Aquí puedes implementar la lógica de exportación
        // Por ahora solo mostramos una notificación
        showNotification(`Función de exportación a ${type.toUpperCase()} en desarrollo.`, "info");
    });
    
    $(".btn-print").on("click", function() {
        const tableId = $(this).data("table-id");
        
        // Aquí puedes implementar la lógica de impresión
        // Por ahora solo mostramos una notificación
        showNotification("Función de impresión en desarrollo.", "info");
    });
});

// --- FUNCIONES AUXILIARES ---

function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        $("#loginModal").hide();
        $("#app").show();
        $("#user-name").text(currentUser.username);
        $("#user-role").text(currentUser.role);
        loadInitialData();
    }
}

function loadInitialData() {
    loadEmpleados();
    loadCategorias();
    loadEstilos();
    loadProductos();
    loadCodigos();
    loadFacturas();
    loadUsuarios();
}

function loadEmpleados() {
    $.ajax({
        url: API_URL + 'empleados',
        method: 'GET',
        success: function(empleados) {
            const $tbody = $("#empleados-table-body");
            $tbody.empty();
            
            empleados.forEach(empleado => {
                const row = `
                    <tr data-id="${empleado.id}">
                        <td class="py-3 px-4">${empleado.id}</td>
                        <td class="py-3 px-4">${empleado.nombres}</td>
                        <td class="py-3 px-4">${empleado.apellidos}</td>
                        <td class="py-3 px-4">C$${parseFloat(empleado.sueldo_base).toFixed(2)}</td>
                        <td class="py-3 px-4">${empleado.fecha_nacimiento}</td>
                        <td class="py-3 px-4">${empleado.cedula}</td>
                        <td class="py-3 px-4">${empleado.sexo}</td>
                        <td class="py-3 px-4">${empleado.estado_civil}</td>
                        <td class="py-3 px-4">${empleado.telefono}</td>
                        <td class="py-3 px-4">${empleado.direccion}</td>
                        <td class="py-3 px-4">${empleado.cargo}</td>
                        <td class="py-3 px-4 text-center">
                            <button class="btn-edit-empleado text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-empleado text-red-600 hover:text-red-800 mx-1" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                $tbody.append(row);
            });
        },
        error: function() {
            showNotification("Error al cargar empleados.", "error");
        }
    });
}

function loadCategorias() {
    $.ajax({
        url: API_URL + 'categorias',
        method: 'GET',
        success: function(categorias) {
            const $tbody = $("#categorias-table-body");
            $tbody.empty();
            
            categorias.forEach(categoria => {
                const row = `
                    <tr data-id="${categoria.id}">
                        <td class="py-3 px-4">${categoria.id}</td>
                        <td class="py-3 px-4">${categoria.nombre}</td>
                        <td class="py-3 px-4">${categoria.descripcion}</td>
                        <td class="py-3 px-4 text-center">
                            <button class="btn-edit-categoria text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-categoria text-red-600 hover:text-red-800 mx-1" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                $tbody.append(row);
            });
            
            // Actualizar dropdowns
            populateDropdowns();
        },
        error: function() {
            showNotification("Error al cargar categorías.", "error");
        }
    });
}

function loadEstilos() {
    $.ajax({
        url: API_URL + 'estilos',
        method: 'GET',
        success: function(estilos) {
            const $tbody = $("#estilos-table-body");
            $tbody.empty();
            
            estilos.forEach(estilo => {
                const row = `
                    <tr data-id="${estilo.id}">
                        <td class="py-3 px-4">${estilo.id}</td>
                        <td class="py-3 px-4">${estilo.nombre}</td>
                        <td class="py-3 px-4">${estilo.descripcion}</td>
                        <td class="py-3 px-4 text-center">
                            <button class="btn-edit-estilo text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-estilo text-red-600 hover:text-red-800 mx-1" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                $tbody.append(row);
            });
            
            // Actualizar dropdowns
            populateDropdowns();
        },
        error: function() {
            showNotification("Error al cargar estilos.", "error");
        }
    });
}

function loadProductos() {
    $.ajax({
        url: API_URL + 'productos',
        method: 'GET',
        success: function(productos) {
            const $tbody = $("#productos-table-body");
            $tbody.empty();
            
            productos.forEach(producto => {
                const row = `
                    <tr data-id="${producto.id}">
                        <td class="py-3 px-4">${producto.id}</td>
                        <td class="py-3 px-4">${producto.marca}</td>
                        <td class="py-3 px-4">${producto.modelo}</td>
                        <td class="py-3 px-4">${producto.talla}</td>
                        <td class="py-3 px-4">${producto.color}</td>
                        <td class="py-3 px-4">C$${parseFloat(producto.precio).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                        <td class="py-3 px-4">${producto.stock}</td>
                        <td class="py-3 px-4">${producto.categoria_nombre || ''}</td>
                        <td class="py-3 px-4">${producto.estilo_nombre || ''}</td>
                        <td class="py-3 px-4 text-center">
                            <button class="btn-edit-producto text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-producto text-red-600 hover:text-red-800 mx-1" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                $tbody.append(row);
            });
            
            // Actualizar dropdowns
            populateFacturaProductoSelect();
        },
        error: function() {
            showNotification("Error al cargar productos.", "error");
        }
    });
}

function loadCodigos() {
    $.ajax({
        url: API_URL + 'codigos',
        method: 'GET',
        success: function(codigos) {
            const $tbody = $("#codigos-table-body");
            $tbody.empty();
            
            codigos.forEach(codigo => {
                const estadoBadge = codigo.estado == 1 ? 
                    '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>' : 
                    '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactivo</span>';
                    
                const row = `
                    <tr data-id="${codigo.id}">
                        <td class="py-3 px-4">${codigo.id}</td>
                        <td class="py-3 px-4 font-mono font-bold">${codigo.codigo}</td>
                        <td class="py-3 px-4">${codigo.porcentaje_descuento}%</td>
                        <td class="py-3 px-4">${codigo.fecha_inicio}</td>
                        <td class="py-3 px-4">${codigo.fecha_fin}</td>
                        <td class="py-3 px-4">${estadoBadge}</td>
                        <td class="py-3 px-4">${codigo.descripcion}</td>
                        <td class="py-3 px-4 text-center">
                            <button class="btn-edit-codigo text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-codigo text-red-600 hover:text-red-800 mx-1" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                $tbody.append(row);
            });
        },
        error: function() {
            showNotification("Error al cargar códigos promocionales.", "error");
        }
    });
}

function loadFacturas() {
    $.ajax({
        url: API_URL + 'facturas',
        method: 'GET',
        success: function(facturas) {
            const $tbody = $("#facturas-table-body");
            $tbody.empty();
            
            facturas.forEach(factura => {
                const row = `
                    <tr data-id="${factura.id}">
                        <td class="py-3 px-4">${factura.id}</td>
                        <td class="py-3 px-4">${factura.cliente}</td>
                        <td class="py-3 px-4">${factura.fecha}</td>
                        <td class="py-3 px-4">${factura.vendedor}</td>
                        <td class="py-3 px-4 text-right font-semibold">C$${parseFloat(factura.total).toFixed(2)}</td>
                        <td class="py-3 px-4 text-center">
                            <button class="btn-ver-factura text-blue-600 hover:text-blue-800 mx-1" title="Ver" data-id="${factura.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-eliminar-factura text-red-600 hover:text-red-800 mx-1" title="Eliminar" data-id="${factura.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                $tbody.append(row);
            });
        },
        error: function() {
            showNotification("Error al cargar facturas.", "error");
        }
    });
}

function loadUsuarios() {
    $.ajax({
        url: API_URL + 'usuarios',
        method: 'GET',
        success: function(usuarios) {
            const $tbody = $("#usuarios-table-body");
            $tbody.empty();
            
            usuarios.forEach(usuario => {
                const row = `
                    <tr data-id="${usuario.id}">
                        <td class="py-3 px-4">${usuario.username}</td>
                        <td class="py-3 px-4">${usuario.role}</td>
                        <td class="py-3 px-4 text-center">
                            <button class="btn-edit-usuario text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-usuario text-red-600 hover:text-red-800 mx-1" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                $tbody.append(row);
            });
        },
        error: function() {
            showNotification("Error al cargar usuarios.", "error");
        }
    });
}

function resetForm() { 
    $("#form-empleado")[0].reset(); 
    $("#empleado-id-form").val(''); 
}

function resetCategoriaForm() { 
    $("#form-categoria")[0].reset(); 
    $("#categoria-id-form").val(''); 
}

function resetEstiloForm() { 
    $("#form-estilo")[0].reset(); 
    $("#estilo-id-form").val(''); 
}

function resetProductoForm() { 
    $("#form-producto")[0].reset(); 
    $("#producto-id-form").val(''); 
}

function resetCodigoForm() { 
    $("#form-codigo")[0].reset(); 
    $("#codigo-id-form").val(''); 
    $("#codigo-estado").prop('checked', true); 
}

function resetUsuarioForm() { 
    $("#form-usuario")[0].reset(); 
    $("#usuario-id-form").val(''); 
}

function generateCodigoId() { 
    const now = new Date(); 
    const year = String(now.getFullYear()).slice(2); 
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0'); 
    const counter = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0'); 
    return `CP${year}${month}${day}${counter}`; 
}

function populateDropdowns() {
    // Cargar categorías
    $.ajax({
        url: API_URL + 'categorias',
        method: 'GET',
        success: function(categorias) {
            const $categoriaSelect = $("#producto-categoria");
            $categoriaSelect.find('option:not(:first)').remove();
            
            categorias.forEach(categoria => {
                $categoriaSelect.append(`<option value="${categoria.id}">${categoria.nombre}</option>`);
            });
        }
    });
    
    // Cargar estilos
    $.ajax({
        url: API_URL + 'estilos',
        method: 'GET',
        success: function(estilos) {
            const $estiloSelect = $("#producto-estilo");
            $estiloSelect.find('option:not(:first)').remove();
            
            estilos.forEach(estilo => {
                $estiloSelect.append(`<option value="${estilo.id}">${estilo.nombre}</option>`);
            });
        }
    });
    
    populateFacturaProductoSelect();
}

function populateFacturaProductoSelect() {
    $.ajax({
        url: API_URL + 'productos',
        method: 'GET',
        success: function(productos) {
            const $select = $("#factura-producto-select");
            $select.find('option:not(:first)').remove();
            
            productos.forEach(producto => {
                $select.append(`<option value="${producto.id}" data-precio="${producto.precio}">${producto.marca} ${producto.modelo}</option>`);
            });
        }
    });
}

function navigateTo(page) {
    $(".page").hide();
    $(`#${page}-page`).show();
    $("#page-title").text(capitalizeFirstLetter(page));
    $(".sidebar-link").removeClass("active");
    $(`a[href="#${page}"]`).addClass("active");
    
    if (page === 'facturacion') {
        resetFacturaForm();
        loadFacturas();
    } else if (page === 'dashboard') {
        loadDashboardStats();
    }
}

function capitalizeFirstLetter(string) { 
    return string.charAt(0).toUpperCase() + string.slice(1); 
}

function showNotification(message, type) { 
    const icon = type === "success" ? "check-circle" : type === "error" ? "times-circle" : "info-circle"; 
    const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"; 
    const notification = `<div class="notification ${bgColor} text-white p-4 rounded-lg shadow-lg mb-4 flex items-center success-message"><i class="fas fa-${icon} mr-3"></i><span>${message}</span></div>`; 
    $("#notification-area").append(notification); 
    setTimeout(() => { 
        $("#notification-area .notification").first().remove(); 
    }, 5000); 
}

// --- FUNCIONES AUXILIARES DE FACTURACIÓN ---
let carritoFactura = [];
let descuentoAplicado = { porcentaje: 0, codigo: '' };

function resetFacturaForm() {
    carritoFactura = [];
    descuentoAplicado = { porcentaje: 0, codigo: '' };
    $("#form-factura")[0].reset();
    $("#factura-iva").prop('checked', true);
    $("#factura-numero").val(generateFacturaId());
    $("#factura-fecha").val(new Date().toLocaleString('es-ES'));
    $("#factura-vendedor").val(currentUser ? currentUser.username : '');
    renderizarTablaFactura();
    calcularTotales();
}

function generateFacturaId() {
    const dayNames = { 0: 'DO', 1: 'LU', 2: 'MA', 3: 'MI', 4: 'JU', 5: 'VI', 6: 'SA' };
    const dayAbbr = dayNames[new Date().getDay()];
    const counter = String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0');
    return `FAC-${counter}-${dayAbbr}`;
}

function agregarProductoAFactura() {
    const productoId = $("#factura-producto-select").val();
    const cantidad = parseInt($("#factura-cantidad").val());
    
    if (!productoId || cantidad <= 0) { 
        showNotification("Seleccione un producto y una cantidad válida.", "error"); 
        return; 
    }
    
    const $selectedOption = $("#factura-producto-select option:selected");
    const nombreProducto = $selectedOption.text();
    const precioUnitario = parseFloat($selectedOption.data('precio'));
    
    const itemExistente = carritoFactura.find(item => item.id === productoId);
    
    if (itemExistente) { 
        itemExistente.cantidad += cantidad; 
    } else { 
        carritoFactura.push({ 
            id: productoId, 
            nombre: nombreProducto, 
            precio: precioUnitario, 
            cantidad: cantidad 
        }); 
    }
    
    $("#factura-producto-select").val(''); 
    $("#factura-cantidad").val(1);
    renderizarTablaFactura(); 
    calcularTotales();
}

function eliminarProductoDeFactura(index) {
    carritoFactura.splice(index, 1);
    renderizarTablaFactura();
    calcularTotales();
}

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
                    <button class="btn-eliminar-item-factura text-red-600 hover:text-red-800" data-index="${index}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        $tbody.append(row);
    });
}

function aplicarDescuento() {
    const codigoIngresado = $("#factura-descuento").val().trim().toUpperCase();
    descuentoAplicado = { porcentaje: 0, codigo: '' };
    
    if (!codigoIngresado) { 
        calcularTotales(); 
        return; 
    }
    
    $.ajax({
        url: API_URL + 'codigos',
        method: 'GET',
        success: function(codigos) {
            let codigoValido = null;
            
            codigos.forEach(codigo => {
                if (codigo.codigo === codigoIngresado) {
                    const hoy = new Date();
                    const inicio = new Date(codigo.fecha_inicio);
                    const fin = new Date(codigo.fecha_fin);
                    
                    if (codigo.estado == 1 && hoy >= inicio && hoy <= fin) { 
                        codigoValido = { 
                            porcentaje: codigo.porcentaje_descuento, 
                            codigo: codigo.codigo 
                        }; 
                    }
                }
            });
            
            if (codigoValido) { 
                descuentoAplicado = codigoValido; 
                showNotification(`Código "${codigoValido.codigo}" aplicado.`, "success"); 
            } else { 
                showNotification("Código de descuento inválido o vencido.", "error"); 
            }
            
            calcularTotales();
        },
        error: function() {
            showNotification("Error al validar código de descuento.", "error");
        }
    });
}

function calcularTotales() {
    let subtotal = 0; 
    
    carritoFactura.forEach(item => { 
        subtotal += item.precio * item.cantidad; 
    });
    
    const montoDescuento = subtotal * (descuentoAplicado.porcentaje / 100);
    const subtotalConDescuento = subtotal - montoDescuento;
    const iva = $("#factura-iva").is(':checked') ? subtotalConDescuento * 0.15 : 0;
    const total = subtotalConDescuento + iva;
    
    $("#factura-subtotal").text(`C$${subtotal.toFixed(2)}`);
    $("#factura-monto-descuento").text(`-C$${montoDescuento.toFixed(2)}`);
    $("#factura-iva-monto").text(`C$${iva.toFixed(2)}`);
    $("#factura-total").text(`C$${total.toFixed(2)}`);
}

function guardarFactura(e) {
    e.preventDefault();
    
    if (carritoFactura.length === 0) { 
        showNotification("Debe agregar al menos un producto a la factura.", "error"); 
        return; 
    }
    
    const factura = { 
        id: $("#factura-numero").val(), 
        cliente: $("#factura-cliente").val(), 
        vendedor: $("#factura-vendedor").val(), 
        fecha: $("#factura-fecha").val(), 
        items: carritoFactura.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad
        })), 
        descuento: descuentoAplicado.codigo, 
        iva: $("#factura-iva").is(':checked'), 
        subtotal: $("#factura-subtotal").text().replace('C$', ''), 
        monto_descuento: $("#factura-monto-descuento").text().replace('-C$', ''), 
        total: $("#factura-total").text().replace('C$', '') 
    };
    
    $.ajax({
        url: API_URL + 'facturas',
        method: 'POST',
        data: JSON.stringify(factura),
        contentType: 'application/json',
        success: function(response) {
            if (response.success) {
                showNotification(`Factura ${factura.id} guardada correctamente.`, "success");
                resetFacturaForm();
                loadFacturas();
            } else {
                showNotification(response.message || "Error al guardar factura.", "error");
            }
        },
        error: function() {
            showNotification("Error de conexión. Inténtelo más tarde.", "error");
        }
    });
}

function verFactura(id) {
    $.ajax({
        url: API_URL + 'facturas&id=' + id,
        method: 'GET',
        success: function(factura) {
            let itemsHtml = ''; 
            
            factura.items.forEach(item => { 
                itemsHtml += `
                    <tr>
                        <td>${item.nombre_producto}</td>
                        <td>C$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                        <td>${item.cantidad}</td>
                        <td>C$${parseFloat(item.subtotal).toFixed(2)}</td>
                    </tr>
                `; 
            });
            
            const content = `
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div><strong>N° Factura:</strong> ${factura.id}</div>
                    <div><strong>Fecha:</strong> ${factura.fecha}</div>
                    <div><strong>Cliente:</strong> ${factura.cliente}</div>
                    <div><strong>Vendedor:</strong> ${factura.vendedor}</div>
                </div>
                <table class="min-w-full bg-white border border-gray-200 mb-4">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="py-2 px-4 text-left">Producto</th>
                            <th class="py-2 px-4 text-left">P. Unitario</th>
                            <th class="py-2 px-4 text-left">Cantidad</th>
                            <th class="py-2 px-4 text-left">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div class="text-right">
                    <p>Subtotal: ${factura.subtotal}</p>
                    ${factura.codigo_descuento ? `<p>Descuento (${factura.codigo_descuento}): -C$${parseFloat(factura.monto_descuento).toFixed(2)}</p>` : ''}
                    <p>IVA: ${factura.iva ? `C$${parseFloat(factura.iva).toFixed(2)}` : 'C$0.00'}</p>
                    <p class="text-xl font-bold">Total: C$${parseFloat(factura.total).toFixed(2)}</p>
                </div>
            `;
            
            $("#ver-factura-content").html(content);
            $("#modal-ver-factura").fadeIn(200);
        },
        error: function() {
            showNotification("Error al cargar detalles de la factura.", "error");
        }
    });
}

function eliminarFactura(id) {
    $.ajax({
        url: API_URL + 'facturas&id=' + id,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                showNotification("Factura eliminada.", "success");
                loadFacturas();
            } else {
                showNotification(response.message || "Error al eliminar factura.", "error");
            }
        },
        error: function() {
            showNotification("Error de conexión. Inténtelo más tarde.", "error");
        }
    });
}

// --- FUNCIONES PARA CARGAR ESTADÍSTICAS ---
function loadDashboardStats() {
    // Contar productos
    $.ajax({
        url: API_URL + 'productos',
        method: 'GET',
        success: function(productos) {
            $('#stat-productos').text(productos.length);
        },
        error: function() {
            $('#stat-productos').text('0');
        }
    });
    
    // Contar empleados
    $.ajax({
        url: API_URL + 'empleados',
        method: 'GET',
        success: function(empleados) {
            $('#stat-empleados').text(empleados.length);
        },
        error: function() {
            $('#stat-empleados').text('0');
        }
    });
    
    // Contar facturas del mes actual
    $.ajax({
        url: API_URL + 'facturas',
        method: 'GET',
        success: function(facturas) {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const ventasMes = facturas.filter(factura => {
                const facturaDate = new Date(factura.fecha);
                return facturaDate.getMonth() === currentMonth && facturaDate.getFullYear() === currentYear;
            });
            
            $('#stat-ventas').text(ventasMes.length);
            
            // Calcular ingresos totales
            const totalIngresos = ventasMes.reduce((total, factura) => {
                return total + parseFloat(factura.total.replace('C$', ''));
            }, 0);
            
            // LÍNEA CORREGIDA:
            $('#stat-ingresos').text('C$' + totalIngresos.toFixed(2).replace(new RegExp('\\B(?=(\\d{3})+(?!\\d))', 'g'), ","));
        },
        error: function() {
            $('#stat-ventas').text('0');
            $('#stat-ingresos').text('C$0');
        }
    });
}