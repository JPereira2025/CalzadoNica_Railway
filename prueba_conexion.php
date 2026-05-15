<?php
$mysqli = @new mysqli('127.0.0.1', 'root', '', '', 3307);
if ($mysqli && !$mysqli->connect_error) {
    echo "Conexión OK. Server: " . $mysqli->server_info;
} else {
    echo "Fallo conexión: " . ($mysqli ? $mysqli->connect_error : mysqli_connect_error());
}
?>
