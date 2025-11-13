<?php
// endpoints/categorias.php
require_once 'db.php';
switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM categorias";
        $result = $conn->query($sql);
        $categorias = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $categorias[] = $row;
            }
        }
        
        echo json_encode($categorias);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $nombre = $conn->real_escape_string($data['nombre']);
        $descripcion = $conn->real_escape_string($data['descripcion']);
        
        $sql = "INSERT INTO categorias (id, nombre, descripcion) 
                VALUES ('$id', '$nombre', '$descripcion')";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Categoría creada correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $nombre = $conn->real_escape_string($data['nombre']);
        $descripcion = $conn->real_escape_string($data['descripcion']);
        
        $sql = "UPDATE categorias SET 
                nombre='$nombre', 
                descripcion='$descripcion' 
                WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Categoría actualizada correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'DELETE':
        $id = $conn->real_escape_string($_GET['id']);
        
        $sql = "DELETE FROM categorias WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Categoría eliminada correctamente']);
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