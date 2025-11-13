<?php
// endpoints/codigos.php
require_once 'db.php';
switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM codigos_promocionales";
        $result = $conn->query($sql);
        $codigos = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $codigos[] = $row;
            }
        }
        
        echo json_encode($codigos);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $codigo = $conn->real_escape_string($data['codigo']);
        $porcentaje_descuento = $conn->real_escape_string($data['porcentaje_descuento']);
        $fecha_inicio = $conn->real_escape_string($data['fecha_inicio']);
        $fecha_fin = $conn->real_escape_string($data['fecha_fin']);
        $estado = isset($data['estado']) ? $data['estado'] : 1;
        $descripcion = $conn->real_escape_string($data['descripcion']);
        
        $sql = "INSERT INTO codigos_promocionales (id, codigo, porcentaje_descuento, fecha_inicio, fecha_fin, estado, descripcion) 
                VALUES ('$id', '$codigo', $porcentaje_descuento, '$fecha_inicio', '$fecha_fin', $estado, '$descripcion')";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Código promocional creado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $codigo = $conn->real_escape_string($data['codigo']);
        $porcentaje_descuento = $conn->real_escape_string($data['porcentaje_descuento']);
        $fecha_inicio = $conn->real_escape_string($data['fecha_inicio']);
        $fecha_fin = $conn->real_escape_string($data['fecha_fin']);
        $estado = isset($data['estado']) ? $data['estado'] : 1;
        $descripcion = $conn->real_escape_string($data['descripcion']);
        
        $sql = "UPDATE codigos_promocionales SET 
                codigo='$codigo', 
                porcentaje_descuento=$porcentaje_descuento, 
                fecha_inicio='$fecha_inicio', 
                fecha_fin='$fecha_fin', 
                estado=$estado, 
                descripcion='$descripcion' 
                WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Código promocional actualizado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'DELETE':
        $id = $conn->real_escape_string($_GET['id']);
        
        $sql = "DELETE FROM codigos_promocionales WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Código promocional eliminado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método no permitido']);
        break;
}
?>