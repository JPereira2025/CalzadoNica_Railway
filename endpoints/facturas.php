<?php
// endpoints/facturas.php
require_once 'db.php';
switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = $conn->real_escape_string($_GET['id']);
            
            // Obtener factura
            $sql = "SELECT * FROM facturas WHERE id='$id'";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                $factura = $result->fetch_assoc();
                
                // Obtener items de la factura
                $sql_items = "SELECT * FROM factura_items WHERE factura_id='$id'";
                $result_items = $conn->query($sql_items);
                $items = [];
                
                if ($result_items->num_rows > 0) {
                    while($row = $result_items->fetch_assoc()) {
                        $items[] = $row;
                    }
                }
                
                $factura['items'] = $items;
                echo json_encode($factura);
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Factura no encontrada']);
            }
        } else {
            // Obtener todas las facturas
            $sql = "SELECT * FROM facturas ORDER BY created_at DESC";
            $result = $conn->query($sql);
            $facturas = [];
            
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $facturas[] = $row;
                }
            }
            
            echo json_encode($facturas);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $cliente = $conn->real_escape_string($data['cliente']);
        $vendedor = $conn->real_escape_string($data['vendedor']);
        $fecha = $conn->real_escape_string($data['fecha']);
        $subtotal = $conn->real_escape_string($data['subtotal']);
        $monto_descuento = $conn->real_escape_string($data['monto_descuento']);
        $iva = $conn->real_escape_string($data['iva']);
        $total = $conn->real_escape_string($data['total']);
        $codigo_descuento = isset($data['codigo_descuento']) ? $conn->real_escape_string($data['codigo_descuento']) : NULL;
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Insertar factura
            $sql = "INSERT INTO facturas (id, cliente, vendedor, fecha, subtotal, monto_descuento, iva, total, codigo_descuento) 
                    VALUES ('$id', '$cliente', '$vendedor', '$fecha', $subtotal, $monto_descuento, $iva, $total, '$codigo_descuento')";
            
            if (!$conn->query($sql)) {
                throw new Exception("Error al crear factura: " . $conn->error);
            }
            
            // Insertar items de la factura
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $producto_id = $conn->real_escape_string($item['id']);
                    $nombre_producto = $conn->real_escape_string($item['nombre']);
                    $precio_unitario = $conn->real_escape_string($item['precio']);
                    $cantidad = $conn->real_escape_string($item['cantidad']);
                    $subtotal_item = $conn->real_escape_string($item['precio'] * $item['cantidad']);
                    
                    $sql_item = "INSERT INTO factura_items (factura_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal) 
                                VALUES ('$id', '$producto_id', '$nombre_producto', $precio_unitario, $cantidad, $subtotal_item)";
                    
                    if (!$conn->query($sql_item)) {
                        throw new Exception("Error al insertar item: " . $conn->error);
                    }
                    
                    // Actualizar stock del producto
                    $sql_update_stock = "UPDATE productos SET stock = stock - $cantidad WHERE id = '$producto_id'";
                    if (!$conn->query($sql_update_stock)) {
                        throw new Exception("Error al actualizar stock: " . $conn->error);
                    }
                }
            }
            
            // Confirmar transacción
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Factura creada correctamente']);
        } catch (Exception $e) {
            // Revertir transacción
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        $id = $conn->real_escape_string($_GET['id']);
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Obtener items de la factura para devolver stock
            $sql_items = "SELECT * FROM factura_items WHERE factura_id='$id'";
            $result_items = $conn->query($sql_items);
            
            if ($result_items->num_rows > 0) {
                while($row = $result_items->fetch_assoc()) {
                    $producto_id = $row['producto_id'];
                    $cantidad = $row['cantidad'];
                    
                    // Devolver stock al producto
                    $sql_update_stock = "UPDATE productos SET stock = stock + $cantidad WHERE id = '$producto_id'";
                    if (!$conn->query($sql_update_stock)) {
                        throw new Exception("Error al devolver stock: " . $conn->error);
                    }
                }
            }
            
            // Eliminar items de la factura
            $sql_delete_items = "DELETE FROM factura_items WHERE factura_id='$id'";
            if (!$conn->query($sql_delete_items)) {
                throw new Exception("Error al eliminar items: " . $conn->error);
            }
            
            // Eliminar factura
            $sql = "DELETE FROM facturas WHERE id='$id'";
            if (!$conn->query($sql)) {
                throw new Exception("Error al eliminar factura: " . $conn->error);
            }
            
            // Confirmar transacción
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Factura eliminada correctamente']);
        } catch (Exception $e) {
            // Revertir transacción
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método no permitido']);
        break;
}
?>