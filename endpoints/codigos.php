<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// Configurar cabeceras para CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar petición preflight de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function normalizePromoDate($date) {
    $date = trim($date);
    if ($date === '') return false;
    $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d'];
    foreach ($formats as $format) {
        $dt = DateTime::createFromFormat($format, $date);
        if ($dt && $dt->format($format) === $date) {
            return $dt->format('Y-m-d');
        }
    }
    return false;
}

$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'DELETE'])) { requireAdmin(); }

switch ($method) {
    case 'GET':
        // Si se pasa un ID, obtener un solo código. Si no, obtener todos.
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        try {
            if ($id) {
                // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
                $stmt = $conn->prepare("SELECT * FROM codigos_promocionales WHERE id = ?");
                $stmt->bind_param('s', $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $codigo = $result->fetch_assoc();
                echo json_encode(['success' => true, 'data' => $codigo]);
            } else {
                // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
                $stmt = $conn->prepare("SELECT * FROM codigos_promocionales ORDER BY id");
                $stmt->execute();
                $result = $stmt->get_result();
                $codigos = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode(['success' => true, 'data' => $codigos]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener códigos: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        $rawInput = file_get_contents('php://input');
        error_log('codigos POST raw input: ' . $rawInput);
        $data = json_decode($rawInput, true);
        
        if (!is_array($data) || empty($data['codigo'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (codigo).']);
            exit;
        }
        
        if (empty($data['fecha_inicio']) || empty($data['fecha_fin'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (fecha_inicio o fecha_fin).']);
            exit;
        }

        error_log('codigos POST raw fecha_inicio: ' . $data['fecha_inicio'] . ' fecha_fin: ' . $data['fecha_fin']);
        $fecha_inicio = normalizePromoDate($data['fecha_inicio']);
        $fecha_fin = normalizePromoDate($data['fecha_fin']);
        error_log('codigos POST normalized fecha_inicio: ' . var_export($fecha_inicio, true) . ' fecha_fin: ' . var_export($fecha_fin, true));
        if ($fecha_inicio === false || $fecha_fin === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Las fechas deben tener formato YYYY-MM-DD o DD/MM/YYYY válido.']);
            exit;
        }
        if ($fecha_fin < $fecha_inicio) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La fecha fin debe ser igual o posterior a la fecha inicio.']);
            exit;
        }
        
        try {
            // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
            $stmt = $conn->prepare("INSERT INTO codigos_promocionales (id, codigo, porcentaje_descuento, fecha_inicio, fecha_fin, estado, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)");
            
            $id = !empty($data['id']) ? $data['id'] : 'COD-' . substr(bin2hex(random_bytes(4)), 0, 12);
            $codigo = $data['codigo'];
            $porcentaje_descuento = isset($data['porcentaje_descuento']) ? (int)$data['porcentaje_descuento'] : 0;
            $estado = isset($data['estado']) ? (int)$data['estado'] : 1;
            $descripcion = $data['descripcion'] ?? null;
            
            $stmt->bind_param('ssissis', $id, $codigo, $porcentaje_descuento, $fecha_inicio, $fecha_fin, $estado, $descripcion);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Código promocional creado correctamente',
                    'data' => [
                        'id' => $id,
                        'codigo' => $codigo,
                        'porcentaje_descuento' => $porcentaje_descuento,
                        'fecha_inicio' => $fecha_inicio,
                        'fecha_fin' => $fecha_fin,
                        'estado' => $estado,
                        'descripcion' => $descripcion
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al crear código promocional: ' . $stmt->error]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al crear código promocional: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($data) || empty($data['id']) || empty($data['codigo'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (id, codigo).']);
            exit;
        }
        
        if (empty($data['fecha_inicio']) || empty($data['fecha_fin'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (fecha_inicio o fecha_fin).']);
            exit;
        }

        error_log('codigos PUT raw fecha_inicio: ' . $data['fecha_inicio'] . ' fecha_fin: ' . $data['fecha_fin']);
        $fecha_inicio = normalizePromoDate($data['fecha_inicio']);
        $fecha_fin = normalizePromoDate($data['fecha_fin']);
        error_log('codigos PUT normalized fecha_inicio: ' . var_export($fecha_inicio, true) . ' fecha_fin: ' . var_export($fecha_fin, true));
        if ($fecha_inicio === false || $fecha_fin === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Las fechas deben tener formato YYYY-MM-DD o DD/MM/YYYY válido.']);
            exit;
        }
        if ($fecha_fin < $fecha_inicio) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La fecha fin debe ser igual o posterior a la fecha inicio.']);
            exit;
        }
        
        try {
            // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
            $stmt = $conn->prepare("UPDATE codigos_promocionales SET codigo = ?, porcentaje_descuento = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?, descripcion = ? WHERE id = ?");
            
            $id = $data['id'];
            $codigo = $data['codigo'];
            $porcentaje_descuento = isset($data['porcentaje_descuento']) ? (int)$data['porcentaje_descuento'] : 0;
            $estado = isset($data['estado']) ? (int)$data['estado'] : 1;
            $descripcion = $data['descripcion'] ?? null;
            
            $stmt->bind_param('sississ', $codigo, $porcentaje_descuento, $fecha_inicio, $fecha_fin, $estado, $descripcion, $id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Código promocional actualizado correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al actualizar código promocional: ' . $stmt->error]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar código promocional: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            try {
                // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
                $stmt = $conn->prepare("DELETE FROM codigos_promocionales WHERE id = ?");
                $stmt->bind_param('s', $_GET['id']);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Código promocional eliminado correctamente']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al eliminar código promocional']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al eliminar código promocional: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de código promocional no especificado']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}

 $conn->close();
?>