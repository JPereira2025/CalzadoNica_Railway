<?php
require_once __DIR__ . '/db.php';

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

 $method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Si se pasa un ID, obtener un solo código. Si no, obtener todos.
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        try {
            if ($id) {
                // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
                $stmt = $conn->prepare("SELECT * FROM codigos_promocionales WHERE id = ?");
                $stmt->bind_param('i', $id);
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
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($data) || empty($data['codigo'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (codigo).']);
            exit;
        }
        
        try {
            // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
            $stmt = $conn->prepare("INSERT INTO codigos_promocionales (codigo, porcentaje_descuento, fecha_inicio, fecha_fin, estado, descripcion) VALUES (?, ?, ?, ?, ?, ?)");
            
            $codigo = $data['codigo'];
            $porcentaje_descuento = $data['porcentaje_descuento'];
            $fecha_inicio = $data['fecha_inicio'];
            $fecha_fin = $data['fecha_fin'];
            $estado = $data['estado'] ?? 1;
            $descripcion = $data['descripcion'] ?? null;
            
            $stmt->bind_param('siiiss', $codigo, $porcentaje_descuento, $fecha_inicio, $fecha_fin, $estado, $descripcion);
            
            if ($stmt->execute()) {
                $new_id = $conn->insert_id;
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Código promocional creado correctamente',
                    'data' => [
                        'id' => $new_id,
                        'codigo' => $codigo,
                        'porcentaje_descuento' => $porcentaje_descuento,
                        'fecha_inicio' => $fecha_inicio,
                        'fecha_fin' => $fecha_fin,
                        'estado' => $estado,
                        'descripcion' => $descripcion
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al crear código promocional']);
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
        
        try {
            // --- CAMBIO CLAVE AQUÍ: Usar el nombre de tabla REAL ---
            $stmt = $conn->prepare("UPDATE codigos_promocionales SET codigo = ?, porcentaje_descuento = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?, descripcion = ? WHERE id = ?");
            
            $id = $data['id'];
            $codigo = $data['codigo'];
            $porcentaje_descuento = $data['porcentaje_descuento'];
            $fecha_inicio = $data['fecha_inicio'];
            $fecha_fin = $data['fecha_fin'];
            $estado = $data['estado'] ?? 1;
            $descripcion = $data['descripcion'] ?? null;
            
            $stmt->bind_param('siiissi', $codigo, $porcentaje_descuento, $fecha_inicio, $fecha_fin, $estado, $descripcion, $id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Código promocional actualizado correctamente']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al actualizar código promocional']);
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
                $stmt->bind_param('i', $_GET['id']);
                
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