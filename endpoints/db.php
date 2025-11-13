<?php
// endpoints/db.php

// Configuración de conexión
define('DB_HOST', '127.0.0.1');   // usar 127.0.0.1 para forzar TCP
define('DB_USER', 'root');
define('DB_PASS', 'Japh2025');  // <- ajusta si tu password es distinto
define('DB_NAME', 'calzado_nica');
define('DB_PORT', 3307);          // puerto cambiado

// Crear conexión (nota: mysqli acepta el puerto como 5º parámetro)
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");

?>