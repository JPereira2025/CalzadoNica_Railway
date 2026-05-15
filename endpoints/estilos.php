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
    exit(); 
}

$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'DELETE'])) { requireAdmin(); }

function jsonErr($msg, $code = 500) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

 $method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        try {
            if ($id) {
                $stmt = $conn->prepare("SELECT * FROM estilos WHERE id = ?");
                $stmt->bind_param('s', $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $estilo = $result->fetch_assoc();
                echo json_encode($estilo ?: []);
            } else {
                $stmt = $conn->prepare("SELECT * FROM estilos ORDER BY id");
                $stmt->execute();
                $result = $stmt->get_result();
                $estilos = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($estilos);
            }
        } catch (Exception $e) {
            jsonErr('Error al obtener estilos: ' . $e->getMessage());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data['id']) || empty($data['nombre'])) {
            jsonErr('Faltan datos requeridos (id, nombre).', 400);
        }
        try {
            $stmt = $conn->prepare("INSERT INTO estilos (id, nombre, descripcion) VALUES (?, ?, ?)");
            
            $id = $data['id'];
            $nombre = $data['nombre'];
            
            // --- CORRECCIÓN CLAVE ---
            // Asignar la expresión a una variable primero
            $descripcion = $data['descripcion'] ?? null;
            
            $stmt->bind_param('sss', $id, $nombre, $descripcion);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Estilo creado correctamente',
                    'data' => ['id' => $id, 'nombre' => $nombre, 'descripcion' => $descripcion]
                ]);
            } else {
                jsonErr('Error al crear estilo: ' . $stmt->error);
            }
        } catch (Exception $e) {
            jsonErr('Error al crear estilo: ' . $e->getMessage());
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data['id']) || empty($data['nombre'])) {
            jsonErr('Faltan datos requeridos (id, nombre).', 400);
        }
        try {
            $stmt = $conn->prepare("UPDATE estilos SET nombre = ?, descripcion = ? WHERE id = ?");
            
            $nombre = $data['nombre'];
            
            // --- CORRECCIÓN CLAVE ---
            // Asignar la expresión a una variable primero
            $descripcion = $data['descripcion'] ?? null;
            
            $stmt->bind_param('sss', $nombre, $descripcion, $data['id']);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Estilo actualizado correctamente']);
            } else {
                jsonErr('Error al actualizar estilo: ' . $stmt->error);
            }
        } catch (Exception $e) {
            jsonErr('Error al actualizar estilo: ' . $e->getMessage());
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonErr('ID no proporcionado', 400);
        }
        try {
            $stmt = $conn->prepare("DELETE FROM estilos WHERE id = ?");
            $stmt->bind_param('s', $_GET['id']);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Estilo eliminado correctamente']);
            } else {
                jsonErr('Error al eliminar estilo: ' . $stmt->error);
            }
        } catch (Exception $e) {
            jsonErr('Error al eliminar estilo: ' . $e->getMessage());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
}

 $conn->close();
?>