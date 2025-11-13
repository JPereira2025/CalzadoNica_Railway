<?php
// api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_config.php';

// Obtener el endpoint solicitado
 $endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
 $method = $_SERVER['REQUEST_METHOD'];

// Enrutador simple
switch ($endpoint) {
    case 'login':
        require_once 'endpoints/login.php';
        break;
    case 'empleados':
        require_once 'endpoints/empleados.php';
        break;
    case 'categorias':
        require_once 'endpoints/categorias.php';
        break;
    case 'estilos':
        require_once 'endpoints/estilos.php';
        break;
    case 'productos':
        require_once 'endpoints/productos.php';
        break;
    case 'codigos':
        require_once 'endpoints/codigos.php';
        break;
    case 'facturas':
        require_once 'endpoints/facturas.php';
        break;
    case 'usuarios':
        require_once 'endpoints/usuarios.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['message' => 'Endpoint no encontrado']);
        break;
}

 $conn->close();
?>