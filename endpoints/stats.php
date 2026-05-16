<?php
// endpoints/stats.php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$counts = ['empleados' => 0, 'productos' => 0, 'facturas' => 0, 'categorias' => 0, 'estilos' => 0, 'ventas' => 0, 'ventas_total' => 0.0, 'ventas_pares' => 0];

$type = isset($_GET['type']) ? trim($_GET['type']) : null;
try {
    if ($type) {
        switch ($type) {
            case 'empleados':
                $res = $conn->query("SELECT COUNT(*) AS c FROM empleados");
                break;
            case 'productos':
                $res = $conn->query("SELECT COUNT(*) AS c FROM productos");
                break;
            case 'categorias':
                $res = $conn->query("SELECT COUNT(*) AS c FROM categorias");
                break;
            case 'estilos':
                $res = $conn->query("SELECT COUNT(*) AS c FROM estilos");
                break;
            case 'facturas':
                $res = $conn->query("SELECT COUNT(*) AS c FROM facturas");
                break;
            case 'ventas':
                $res = $conn->query(
                    "SELECT COUNT(*) AS c, IFNULL(SUM(sub.total),0) AS s, IFNULL(SUM(sub.pairs),0) AS pairs FROM (" .
                    "SELECT f.id, f.total, IFNULL(SUM(fi.cantidad),0) AS pairs " .
                    "FROM facturas f LEFT JOIN factura_items fi ON fi.id_factura = f.id " .
                    "WHERE YEAR(f.fecha)=YEAR(CURDATE()) AND MONTH(f.fecha)=MONTH(CURDATE()) " .
                    "GROUP BY f.id" .
                    ") AS sub"
                );
                break;
            default:
                $res = false;
        }

        if ($res) {
            $row = $res->fetch_assoc();
            if ($type === 'ventas') {
                echo json_encode([
                    'count' => intval($row['c'] ?? 0),
                    'total' => floatval($row['s'] ?? 0),
                    'pairs' => intval($row['pairs'] ?? 0)
                ]);
            } else {
                echo json_encode(['count' => intval($row['c'])]);
            }
            exit;
        } else {
            if ($type === 'ventas') echo json_encode(['count' => 0, 'total' => 0.0, 'pairs' => 0]);
            else echo json_encode(['count' => 0]);
            exit;
        }
    }

    // Si no se pidió un tipo específico, devolver todos los contadores
    $res = $conn->query("SELECT COUNT(*) AS c FROM empleados");
    if ($res) { $row = $res->fetch_assoc(); $counts['empleados'] = intval($row['c']); }

    $res = $conn->query("SELECT COUNT(*) AS c FROM productos");
    if ($res) { $row = $res->fetch_assoc(); $counts['productos'] = intval($row['c']); }

    $res = $conn->query("SELECT COUNT(*) AS c FROM categorias");
    if ($res) { $row = $res->fetch_assoc(); $counts['categorias'] = intval($row['c']); }

    $res = $conn->query("SELECT COUNT(*) AS c FROM estilos");
    if ($res) { $row = $res->fetch_assoc(); $counts['estilos'] = intval($row['c']); }

    $res = $conn->query("SELECT COUNT(*) AS c FROM facturas");
    if ($res) { $row = $res->fetch_assoc(); $counts['facturas'] = intval($row['c']); }

    // Calcular ventas del mes actual (cantidad de facturas y total)
    $res = $conn->query(
        "SELECT COUNT(*) AS c, IFNULL(SUM(sub.total),0) AS s, IFNULL(SUM(sub.pairs),0) AS pairs FROM (" .
        "SELECT f.id, f.total, IFNULL(SUM(fi.cantidad),0) AS pairs " .
        "FROM facturas f LEFT JOIN factura_items fi ON fi.id_factura = f.id " .
        "WHERE YEAR(f.fecha)=YEAR(CURDATE()) AND MONTH(f.fecha)=MONTH(CURDATE()) " .
        "GROUP BY f.id" .
        ") AS sub"
    );
    if ($res) { $row = $res->fetch_assoc(); $counts['ventas'] = intval($row['c']); $counts['ventas_total'] = floatval($row['s']); $counts['ventas_pares'] = intval($row['pairs']); }

} catch (Exception $e) {
    // mantener valores por defecto en caso de error
}

echo json_encode($counts);
