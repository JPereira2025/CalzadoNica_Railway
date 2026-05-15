<?php
// endpoints/stats.php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$counts = ['empleados' => 0, 'productos' => 0, 'facturas' => 0];

try {
    $res = $conn->query("SELECT COUNT(*) AS c FROM empleados");
    if ($res) { $row = $res->fetch_assoc(); $counts['empleados'] = intval($row['c']); }

    $res = $conn->query("SELECT COUNT(*) AS c FROM productos");
    if ($res) { $row = $res->fetch_assoc(); $counts['productos'] = intval($row['c']); }

    // Si la tabla facturas no existe, se mantiene 0
    $res = $conn->query("SELECT COUNT(*) AS c FROM facturas");
    if ($res) { $row = $res->fetch_assoc(); $counts['facturas'] = intval($row['c']); }
} catch (Exception $e) {
    // mantener valores por defecto en caso de error
}

echo json_encode($counts);
