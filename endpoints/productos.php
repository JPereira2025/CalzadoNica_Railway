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

// Función para verificar si un ID existe en una tabla
function idExists($conn, $table, $id) {
    $stmt = $conn->prepare("SELECT id FROM $table WHERE id = ?");
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $stmt->store_result();
    $exists = $stmt->num_rows > 0;
    $stmt->close();
    return $exists;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        try {
            if ($id) {
                $stmt = $conn->prepare("SELECT p.*, c.nombre as categoria_nombre, e.nombre as estilo_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id LEFT JOIN estilos e ON p.estilo_id = e.id WHERE p.id = ?");
                $stmt->bind_param('s', $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $producto = $result->fetch_assoc();
                echo json_encode($producto ?: []);
            } else {
                $stmt = $conn->prepare("SELECT p.*, c.nombre as categoria_nombre, e.nombre as estilo_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id LEFT JOIN estilos e ON p.estilo_id = e.id ORDER BY p.id");
                $stmt->execute();
                $result = $stmt->get_result();
                $productos = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($productos);
            }
        } catch (Exception $e) {
            jsonErr('Error al obtener productos: ' . $e->getMessage());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data['id']) || empty($data['marca']) || empty($data['categoria_id']) || empty($data['estilo_id'])) {
            jsonErr('Faltan datos requeridos (id, marca, categoria, estilo).', 400);
        }

        // --- VALIDACIÓN DE CLAVES FORÁNEAS ---
        if (!idExists($conn, 'categorias', $data['categoria_id'])) {
            jsonErr('Error: La categoría seleccionada no existe.', 400);
        }
        if (!idExists($conn, 'estilos', $data['estilo_id'])) {
            jsonErr('Error: El estilo seleccionado no existe.', 400);
        }
        // --- FIN DE VALIDACIÓN ---

        try {
            $stmt = $conn->prepare("INSERT INTO productos (id, marca, modelo, talla, color, precio, stock, categoria_id, estilo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $id = $data['id'];
            $marca = $data['marca'];
            $modelo = $data['modelo'] ?? null;
            $talla = $data['talla'] ?? null;
            $color = $data['color'] ?? null;
            $precio = $data['precio'] ?? 0;
            $stock = $data['stock'] ?? 0;
            $categoria_id = $data['categoria_id'];
            $estilo_id = $data['estilo_id'];

            $stmt->bind_param('sssssdiss', $id, $marca, $modelo, $talla, $color, $precio, $stock, $categoria_id, $estilo_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Producto creado correctamente',
                    'data' => $data
                ]);
            } else {
                jsonErr('Error al crear producto: ' . $stmt->error);
            }
        } catch (Exception $e) {
            jsonErr('Error al crear producto: ' . $e->getMessage());
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data['id']) || empty($data['marca']) || empty($data['categoria_id']) || empty($data['estilo_id'])) {
            jsonErr('Faltan datos requeridos (id, marca, categoria, estilo).', 400);
        }

        // --- VALIDACIÓN DE CLAVES FORÁNEAS ---
        if (!idExists($conn, 'categorias', $data['categoria_id'])) {
            jsonErr('Error: La categoría seleccionada no existe.', 400);
        }
        if (!idExists($conn, 'estilos', $data['estilo_id'])) {
            jsonErr('Error: El estilo seleccionado no existe.', 400);
        }
        // --- FIN DE VALIDACIÓN ---

        try {
            $stmt = $conn->prepare("UPDATE productos SET marca = ?, modelo = ?, talla = ?, color = ?, precio = ?, stock = ?, categoria_id = ?, estilo_id = ? WHERE id = ?");
            
            $id = $data['id'];
            $marca = $data['marca'];
            $modelo = $data['modelo'] ?? null;
            $talla = $data['talla'] ?? null;
            $color = $data['color'] ?? null;
            $precio = $data['precio'] ?? 0;
            $stock = $data['stock'] ?? 0;
            $categoria_id = $data['categoria_id'];
            $estilo_id = $data['estilo_id'];

            $stmt->bind_param('sssssdiss', $marca, $modelo, $talla, $color, $precio, $stock, $categoria_id, $estilo_id, $id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);
            } else {
                jsonErr('Error al actualizar producto: ' . $stmt->error);
            }
        } catch (Exception $e) {
            jsonErr('Error al actualizar producto: ' . $e->getMessage());
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            jsonErr('ID no proporcionado', 400);
        }
        try {
            $stmt = $conn->prepare("DELETE FROM productos WHERE id = ?");
            $stmt->bind_param('s', $_GET['id']);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Producto eliminado correctamente']);
            } else {
                jsonErr('Error al eliminar producto: ' . $stmt->error);
            }
        } catch (Exception $e) {
            jsonErr('Error al eliminar producto: ' . $e->getMessage());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
}

$conn->close();
?>