<?php
// endpoints/usuarios.php

// Permitir solicitudes desde cualquier origen (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Incluir el archivo de conexión a la base de datos
require_once 'db.php';

// Obtener el método de la solicitud (GET, POST, PUT, DELETE)
 $method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener todos los usuarios
        $sql = "SELECT id, username, role FROM usuarios";
        $result = $conn->query($sql);
        $usuarios = [];
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $usuarios[] = $row;
            }
        }
        
        echo json_encode($usuarios);
        break;
        
    case 'POST':
        // Crear un nuevo usuario
        $data = json_decode(file_get_contents('php://input'), true);
        
        $username = $conn->real_escape_string($data['username']);
        $password = $conn->real_escape_string($data['password']); // NOTA: En producción, usa password_hash()
        $role = $conn->real_escape_string($data['role']);
        
        $sql = "INSERT INTO usuarios (username, password, role) 
                VALUES ('$username', '$password', '$role')";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Usuario creado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'PUT':
        // Actualizar un usuario existente
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $conn->real_escape_string($data['id']);
        $username = $conn->real_escape_string($data['username']);
        $password = $conn->real_escape_string($data['password']);
        $role = $conn->real_escape_string($data['role']);
        
        // Si la contraseña está vacía, no la actualizamos
        if (empty($password)) {
            $sql = "UPDATE usuarios SET username='$username', role='$role' WHERE id=$id";
        } else {
            $sql = "UPDATE usuarios SET username='$username', password='$password', role='$role' WHERE id=$id";
        }
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    case 'DELETE':
        // Eliminar un usuario
        $id = $conn->real_escape_string($_GET['id']);
        
        $sql = "DELETE FROM usuarios WHERE id='$id'";
        
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Usuario eliminado correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Método no permitido']);
        break;
}

 $conn->close();
?>