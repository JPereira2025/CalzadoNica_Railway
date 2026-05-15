<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/password_utils.php';
require_once __DIR__ . '/auth.php';

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

        $authenticated = false;
        $needs_rehash = false;

        // Verificar con password_verify si está hasheada
        if (password_verify($password, $stored)) {
            $authenticated = true;
            // Revisar si el hash necesita rehash a parámetros más fuertes
            if (password_needs_rehash_secure($stored)) {
                $needs_rehash = true;
            }
        } else {
            // Soporte para contraseñas legadas en texto plano: comparar directamente
            if ($password === $stored) {
                $authenticated = true;
                $needs_rehash = true; // siempre rehashear texto plano
            }
        }

        if ($authenticated) {
            // Rehashear si es necesario (migración automática)
            if ($needs_rehash) {
                try {
                    $newHash = hash_password_secure($password);
                    $upd = $conn->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
                    if ($upd) {
                        $upd->bind_param('si', $newHash, $row['id']);
                        $upd->execute();
                        $upd->close();
                    }
                } catch (Exception $e) {
                    // No bloquear el login si falla el update; solo loguear
                    error_log('No se pudo rehash/update password: ' . $e->getMessage());
                }
            }

            unset($row['password']);
            setSessionUser($row);
            echo json_encode([
                'success' => true,
                'user' => getSessionUser(),
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
