<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'DELETE'])) { requireAdmin(); }

function jsonErr($msg, $code = 500) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

function parseCurrency($text) {
    if ($text === null) return 0;
    $num = preg_replace('/[^\d\.\-]/u','', (string)$text); // El regex es correcto para eliminar caracteres no numéricos excepto punto y signo de menos.
    return is_numeric($num) ? floatval($num) : 0;
}

function existsProducto($conn, $id) {
    $stmt = $conn->prepare("SELECT id FROM productos WHERE id = ? LIMIT 1");
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    return ($result && $result->num_rows > 0);
}

 $method = $_SERVER['REQUEST_METHOD'];
 $tableName = 'facturas';

// Obtener columnas de la tabla para construir consultas dinámicas
 $colsRes = $conn->query("SHOW COLUMNS FROM `{$tableName}`");
if (!$colsRes) jsonErr("Error DB: " . $conn->error);
 $cols = [];
 $pk = null;
 $pkAuto = false;
while ($r = $colsRes->fetch_assoc()) {
    $cols[] = $r['Field'];
    if ($r['Key'] === 'PRI') {
        $pk = $r['Field'];
        if (stripos($r['Extra'], 'auto_increment') !== false) $pkAuto = true;
    }
}

switch ($method) {
    case 'GET':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        try {
            if ($id) {
                $stmt = $conn->prepare("SELECT * FROM facturas WHERE id = ?");
                $stmt->bind_param('s', $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $factura = $result->fetch_assoc();
                
                if ($factura) {
                    // Obtener los ítems de la factura
                    $itemStmt = $conn->prepare("SELECT id_producto, nombre_producto, cantidad, precio_unitario FROM factura_items WHERE id_factura = ?");
                    $itemStmt->bind_param('s', $id);
                    $itemStmt->execute();
                    $itemResult = $itemStmt->get_result();
                    $factura['items'] = $itemResult->fetch_all(MYSQLI_ASSOC);
                }
                
                echo json_encode($factura ?: []);
            } else {
                $stmt = $conn->prepare("SELECT * FROM facturas ORDER BY id DESC");
                $stmt->execute();
                $result = $stmt->get_result();
                $facturas = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($facturas);
            }
        } catch (Exception $e) {
            jsonErr('Error al obtener facturas: ' . $e->getMessage());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data['cliente'])) {
            jsonErr('Faltan datos requeridos (cliente).', 400);
        }

        $conn->begin_transaction();
        try {
           
            // Insertar la factura principal
            $stmt = $conn->prepare("INSERT INTO facturas (id, cliente, vendedor, fecha, subtotal, monto_descuento, iva, total, codigo_descuento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $cliente = $data['cliente'];
            $vendedor = $data['vendedor'] ?? '';
            $fecha = $data['fecha'] ?? date('Y-m-d H:i:s');
            $subtotal = parseCurrency($data['subtotal'] ?? 0);
            $monto_descuento = parseCurrency($data['monto_descuento'] ?? 0);
            $iva = parseCurrency($data['iva'] ?? 0);
            $total = parseCurrency($data['total'] ?? 0);
            $codigo_descuento = $data['descuento_codigo'] ?? null;

            $factura_id = $data['id'] ?? null;
            if (!$factura_id) throw new Exception('ID de factura no proporcionado desde el cliente.');
            $stmt->bind_param('ssssdddds', $factura_id, $cliente, $vendedor, $fecha, $subtotal, $monto_descuento, $iva, $total, $codigo_descuento);
            
            if ($stmt->execute()) {
                // $factura_id ya está definido arriba con el ID enviado por el cliente

                // Insertar los items de la factura
                if (!empty($data['items']) && is_array($data['items'])) {
                    $itemStmt = $conn->prepare("INSERT INTO factura_items (id_factura, id_producto, nombre_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)");
                    foreach ($data['items'] as $item) {
                        $id_producto = $item['id'] ?? null;
                        $nombre_producto = $item['nombre'] ?? '';
                        $cantidad = intval($item['cantidad'] ?? 0);
                        $precio_unitario = floatval($item['precio'] ?? 0);
                        
                        $itemStmt->bind_param('ssssi', $factura_id, $id_producto, $nombre_producto, $cantidad, $precio_unitario);
                        $itemStmt->execute();
                    }
                }

                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'Factura creada', 'id' => $factura_id]);
            } else {
                throw new Exception('Error al crear factura: ' . $stmt->error);
            }
        } catch (Exception $e) {
            $conn->rollback();
            jsonErr('Error al guardar factura: ' . $e->getMessage());
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) jsonErr('ID no proporcionado', 400);
        
        try {
            $stmt = $conn->prepare("DELETE FROM facturas WHERE id = ?");
            $stmt->bind_param('s', $id);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Factura eliminada correctamente']);
            } else {
                jsonErr('Error al eliminar factura: ' . $stmt->error);
            }
        } catch (Exception $e) {
            jsonErr('Error al eliminar factura: ' . $e->getMessage());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

 $conn->close();
?>