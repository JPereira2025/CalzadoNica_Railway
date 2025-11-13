<?php
// endpoints/estilos.php
require_once 'db.php';
switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM estilos";
        $result = $conn->query($sql);
        $estilos = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $estilos[] = $row;
            }
        }
        
        echo json_encode($estilos);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $nombre = $conn->real_escape_string($data['nombre']);
        $descripcion = $conn->real_escape_string($data['descripcion']);
        
        $sql = "INSERT INTO estilos (id, nombre, descripcion) 
                VALUES ('$id', '$nombre', '$descripcion')";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Estilo creado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $nombre = $conn->real_escape_string($data['nombre']);
        $descripcion = $conn->real_escape_string($data['descripcion']);
        
        $sql = "UPDATE estilos SET 
                nombre='$nombre', 
                descripcion='$descripcion' 
                WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Estilo actualizado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'DELETE':
        $id = $conn->real_escape_string($_GET['id']);
        
        $sql = "DELETE FROM estilos WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Estilo eliminado correctamente']);
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