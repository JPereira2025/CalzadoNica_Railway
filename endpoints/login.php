<?php
require_once __DIR__ . '/db.php';

// Configurar cabeceras para CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar petición preflight de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar método de petición
 $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
    exit;
}

// Verificar conexión a la base de datos
if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

// Intentar obtener datos como JSON primero
 $raw = file_get_contents('php://input');
 $data = json_decode($raw, true);

// Si no es JSON, intentar con datos de formulario
if (!is_array($data)) {
    $data = $_POST;
}

// Verificar que se hayan recibido los datos necesarios
if (!is_array($data) || empty($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Datos inválidos']);
    exit;
}

 $username = $data['username'];
 $password = $data['password'];

try {
    // Consulta preparada para prevenir inyección SQL
    $stmt = $conn->prepare("SELECT id, username, password, role FROM usuarios WHERE username = ? LIMIT 1");
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en la preparación de la consulta']);
        exit;
    }
    
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $stored = $row['password'];
        $ok = false;
        
        // Soporta hashes con password_verify o comparación en texto plano
        if (password_verify($password, $stored)) {
            $ok = true;
        } elseif ($password === $stored) {
            $ok = true;
        }

        if ($ok) {
            // Eliminar la contraseña del array antes de enviarlo
            unset($row['password']);
            echo json_encode([
                'success' => true, 
                'user' => $row,
                'message' => 'Login exitoso'
            ]);
            exit;
        }
    }

    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno: ' . $e->getMessage()]);
}
?>