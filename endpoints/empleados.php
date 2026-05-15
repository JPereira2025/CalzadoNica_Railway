<?php
// endpoints/empleados.php
require_once 'db.php';
require_once 'auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { http_response_code(200); echo json_encode(['success' => true]); exit; }
if (in_array($method, ['POST', 'PUT', 'DELETE'])) { requireAdmin(); }

// obtener lista de columnas de la tabla empleados
$allCols = [];
$colsRes = $conn->query("SHOW COLUMNS FROM empleados");
if ($colsRes) {
    while ($r = $colsRes->fetch_assoc()) $allCols[] = $r['Field'];
}

function detectCol($candidates, $allCols) {
    foreach ($candidates as $c) if (in_array($c, $allCols)) return $c;
    return null;
}

$sueldoCol = detectCol(['sueldo','sueldo_base','salario'], $allCols);
$nacimientoCol = detectCol(['nacimiento','fecha_nacimiento','fecha_nac'], $allCols);
$idCol = detectCol(['id','empleado_id'], $allCols);

// helper para armar insert/update con escape
function escapeVal($conn, $val) {
    if (is_null($val)) return "NULL";
    if (is_numeric($val) && $val !== '') return $val;
    return "'" . $conn->real_escape_string((string)$val) . "'";
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id']) && $_GET['id'] !== '') {
            $stmt = $conn->prepare("SELECT * FROM empleados WHERE " . ($idCol ?: 'id') . " = ? LIMIT 1");
            $stmt->bind_param('s', $_GET['id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            echo json_encode($row ?: []);
            break;
        }
        $sql = "SELECT * FROM empleados";
        $result = $conn->query($sql);
        $empleados = [];
        if ($result && $result->num_rows > 0) {
            while ($r = $result->fetch_assoc()) $empleados[] = $r;
        }
        echo json_encode($empleados);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        // construir mapa columna => valor según lo que exista en la tabla
        $map = [];
        if ($idCol) $map[$idCol] = $data['id'] ?? uniqid('EMP');
        if (in_array('nombres', $allCols)) $map['nombres'] = $data['nombres'] ?? '';
        if (in_array('apellidos', $allCols)) $map['apellidos'] = $data['apellidos'] ?? '';
        if ($sueldoCol) $map[$sueldoCol] = isset($data['sueldo']) ? floatval($data['sueldo']) : (isset($data['sueldo_base']) ? floatval($data['sueldo_base']) : 0);
        if ($nacimientoCol) $map[$nacimientoCol] = $data['nacimiento'] ?? $data['fecha_nacimiento'] ?? '';
        // campos comunes
        foreach (['cedula','sexo','estado_civil','telefono','direccion','cargo'] as $f) {
            if (in_array($f, $allCols)) $map[$f] = $data[$f] ?? '';
        }

        if (empty($map)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'No hay columnas válidas detectadas en la tabla empleados']); break; }

        $cols = array_keys($map);
        $placeholders = str_repeat('?,', count($map) - 1) . '?';
        $sql = "INSERT INTO empleados (" . implode(',', $cols) . ") VALUES ($placeholders)";
        $stmt = $conn->prepare($sql);
        $types = str_repeat('s', count($map)); // asumir string, ajustar si necesario
        $stmt->bind_param($types, ...array_values($map));
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Empleado creado correctamente', 'id' => $map[$idCol] ?? null]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error: ' . $stmt->error]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $id = $data['id'] ?? ($_GET['id'] ?? null);
        if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID no proporcionado']); break; }

        $map = [];
        if (in_array('nombres', $allCols)) $map['nombres'] = $data['nombres'] ?? '';
        if (in_array('apellidos', $allCols)) $map['apellidos'] = $data['apellidos'] ?? '';
        if ($sueldoCol) $map[$sueldoCol] = isset($data['sueldo']) ? floatval($data['sueldo']) : (isset($data['sueldo_base']) ? floatval($data['sueldo_base']) : null);
        if ($nacimientoCol) $map[$nacimientoCol] = $data['nacimiento'] ?? $data['fecha_nacimiento'] ?? null;
        foreach (['cedula','sexo','estado_civil','telefono','direccion','cargo'] as $f) {
            if (in_array($f, $allCols) && array_key_exists($f, $data)) $map[$f] = $data[$f];
        }

        if (empty($map)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Nada que actualizar']); break; }

        $sets = [];
        $values = [];
        $types = '';
        foreach ($map as $col => $val) {
            $sets[] = "$col = ?";
            $values[] = $val;
            $types .= 's'; // asumir string
        }
        $values[] = $id;
        $types .= 's';
        $whereCol = $idCol ?: 'id';
        $sql = "UPDATE empleados SET " . implode(',', $sets) . " WHERE {$whereCol} = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Empleado actualizado correctamente']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error: ' . $stmt->error]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID no proporcionado']); break; }
        $whereCol = $idCol ?: 'id';
        $sql = "DELETE FROM empleados WHERE {$whereCol} = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('s', $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Empleado eliminado']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error: ' . $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
        break;
}
