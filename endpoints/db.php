<?php
// ¡NI UN ESPACIO ANTES DE ESTA LÍNEA!

// ---- INICIO DE MODO DEPURACIÓN ----
// Esto nos mostrará cualquier error de PHP en la pantalla
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// ---- FIN DE MODO DEPURACIÓN ----

define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'calzado_nica');
define('DB_PORT', 3306);

 $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

if ($conn->connect_error) {
    // Forzar una respuesta JSON limpia incluso en caso de error de conexión
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['success' => false, 'message' => 'Error de conexión a la BD', 'error' => $conn->connect_error]));
}

 $conn->set_charset("utf8mb4");

// ¡NI UN ESPACIO DESPUÉS DE ESTA LÍNEA!
?>