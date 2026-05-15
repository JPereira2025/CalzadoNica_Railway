<?php
// db_config.php
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // El usuario por defecto de XAMPP es 'root'
define('DB_PASS', ''); // La contraseña por defecto de XAMPP es vacía
define('DB_NAME', 'calzado_nica');
define('DB_PORT', 3306);

// Crear conexión
 $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Establecer charset
 $conn->set_charset("utf8mb4");
?>