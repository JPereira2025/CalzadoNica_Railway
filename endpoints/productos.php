<?php
// endpoints/productos.php
require_once 'db.php';
switch ($method) {
    case 'GET':
        $sql = "SELECT p.*, c.nombre as categoria_nombre, e.nombre as estilo_nombre 
                FROM productos p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                LEFT JOIN estilos e ON p.estilo_id = e.id";
        $result = $conn->query($sql);
        $productos = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $productos[] = $row;
            }
        }
        
        echo json_encode($productos);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $marca = $conn->real_escape_string($data['marca']);
        $modelo = $conn->real_escape_string($data['modelo']);
        $talla = $conn->real_escape_string($data['talla']);
        $color = $conn->real_escape_string($data['color']);
        $precio = $conn->real_escape_string($data['precio']);
        $stock = $conn->real_escape_string($data['stock']);
        $categoria_id = $conn->real_escape_string($data['categoria_id']);
        $estilo_id = $conn->real_escape_string($data['estilo_id']);
        
        $sql = "INSERT INTO productos (id, marca, modelo, talla, color, precio, stock, categoria_id, estilo_id) 
                VALUES ('$id', '$marca', '$modelo', '$talla', '$color', $precio, $stock, '$categoria_id', '$estilo_id')";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Producto creado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $marca = $conn->real_escape_string($data['marca']);
        $modelo = $conn->real_escape_string($data['modelo']);
        $talla = $conn->real_escape_string($data['talla']);
        $color = $conn->real_escape_string($data['color']);
        $precio = $conn->real_escape_string($data['precio']);
        $stock = $conn->real_escape_string($data['stock']);
        $categoria_id = $conn->real_escape_string($data['categoria_id']);
        $estilo_id = $conn->real_escape_string($data['estilo_id']);
        
        $sql = "UPDATE productos SET 
                marca='$marca', 
                modelo='$modelo', 
                talla='$talla', 
                color='$color', 
                precio=$precio, 
                stock=$stock, 
                categoria_id='$categoria_id', 
                estilo_id='$estilo_id' 
                WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'DELETE':
        $id = $conn->real_escape_string($_GET['id']);
        
        $sql = "DELETE FROM productos WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Producto eliminado correctamente']);
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