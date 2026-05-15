<?php
// endpoints/usuarios.php
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

function jsonErr($msg, $code = 500) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

switch ($method) {

    // -------------------------
    // GET (lista o usuario por id)
    // -------------------------
    case 'GET':
        if (isset($_GET['id'])) {
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT id, username, role FROM usuarios WHERE id='$id' LIMIT 1";
            $res = $conn->query($sql);

            $row = $res && $res->num_rows ? $res->fetch_assoc() : null;
            echo json_encode($row ? $row : []);
            exit;
        }

        $sql = "SELECT id, username, role FROM usuarios";
        $res = $conn->query($sql);

        $users = [];
        while ($res && $row = $res->fetch_assoc()) {
            $users[] = $row;
        }

        echo json_encode($users);
        break;

    // -------------------------
    // POST (crear usuario)
    // -------------------------
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['username']) || !isset($data['password']) || !isset($data['role'])) {
            jsonErr('Faltan campos requeridos', 400);
        }

        $username = $conn->real_escape_string($data['username']);
        $role     = $conn->real_escape_string($data['role']);
        $password = password_hash($data['password'], PASSWORD_BCRYPT);

        $sql = "INSERT INTO usuarios (username, password, role)
                VALUES ('$username', '$password', '$role')";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Usuario creado', 'id' => $conn->insert_id]);
        } else {
            jsonErr('Error al crear usuario: ' . $conn->error);
        }
        break;

    // -------------------------
    // PUT (actualizar usuario)
    // -------------------------
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id'])) jsonErr('ID requerido', 400);

        $id = $conn->real_escape_string($data['id']);

        $updates = [];

        if (isset($data['username'])) {
            $u = $conn->real_escape_string($data['username']);
            $updates[] = "username='$u'";
        }

        if (isset($data['role'])) {
            $r = $conn->real_escape_string($data['role']);
            $updates[] = "role='$r'";
        }

        if (isset($data['password']) && $data['password'] !== '') {
            $pass = password_hash($data['password'], PASSWORD_BCRYPT);
            $updates[] = "password='$pass'";
        }

        if (empty($updates)) jsonErr('Nada que actualizar', 400);

        $sql = "UPDATE usuarios SET " . implode(',', $updates) . " WHERE id='$id'";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado']);
        } else {
            jsonErr('Error: ' . $conn->error);
        }
        break;

    // -------------------------
    // DELETE (eliminar usuario)
    // -------------------------
    case 'DELETE':
        if (!isset($_GET['id'])) jsonErr('ID requerido', 400);

        $id = $conn->real_escape_string($_GET['id']);

        $sql = "DELETE FROM usuarios WHERE id='$id'";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Usuario eliminado']);
        } else {
            jsonErr('Error: ' . $conn->error);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
