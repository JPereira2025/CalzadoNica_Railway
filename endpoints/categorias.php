<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Si se pasa un ID, obtener una sola categoría. Si no, obtener todas.
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        try {
            if ($id) {
                $stmt = $conn->prepare("SELECT * FROM categorias WHERE id = ?");
                $stmt->bind_param('s', $id); // Cambiado a 's' para aceptar IDs de texto
                $stmt->execute();
                $result = $stmt->get_result();
                $categoria = $result->fetch_assoc();
                echo json_encode($categoria ? $categoria : []);
            } else {
                $stmt = $conn->prepare("SELECT * FROM categorias ORDER BY id");
                $stmt->execute();
                $result = $stmt->get_result();
                $categorias = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($categorias);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al obtener categorías: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data['id']) || empty($data['nombre'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (id, nombre).']);
            exit;
        }
        try {
            $stmt = $conn->prepare("INSERT INTO categorias (id, nombre, descripcion) VALUES (?, ?, ?)");
            $id = $data['id'];
            $nombre = $data['nombre'];
            $descripcion = $data['descripcion'] ?? null;
            $stmt->bind_param('sss', $id, $nombre, $descripcion);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Categoría creada correctamente',
                    'data' => [ 'id' => $id, 'nombre' => $nombre, 'descripcion' => $descripcion ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear categoría: ' . $conn->error]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al crear categoría: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data['id']) || empty($data['nombre'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos (id, nombre).']);
            exit;
        }
        try {
            $stmt = $conn->prepare("UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?");
            $id = $data['id']; 
            $nombre = $data['nombre']; 
            $descripcion = $data['descripcion'] ?? null;
            $stmt->bind_param('sss', $nombre, $descripcion, $id); // Cambiado a 'sss'
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Categoría actualizada correctamente']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar categoría: ' . $conn->error]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar categoría: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            try {
                $stmt = $conn->prepare("DELETE FROM categorias WHERE id = ?");
                $stmt->bind_param('s', $_GET['id']); // Cambiado a 's'
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Categoría eliminada correctamente']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error al eliminar categoría: ' . $conn->error]);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al eliminar categoría: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de categoría no especificado']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        break;
}
$conn->close();
?>
