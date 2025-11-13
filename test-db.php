<?php
$host = 'localhost';
$user = 'root';
$pass = ''; // La contraseña por defecto de root en XAMPP es vacía
$db = 'calzado_nica'; // Reemplazar con el nombre de tu base de datos

try {
    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        die("Error de conexión: " . $conn->connect_error);
    }
    echo "¡Conexión a la base de datos exitosa!";
} catch (Exception $e) {
    die("Error: " . $e->getMessage());
}
?>