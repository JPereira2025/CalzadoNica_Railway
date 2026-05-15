<?php
require_once 'db.php';
require_once __DIR__ . '/password_utils.php';

header('Content-Type: application/json');

// Solo ejecutar si hay un parámetro especial (seguridad básica)
if (!isset($_GET['hash_passwords']) || $_GET['hash_passwords'] !== 'true') {
    echo json_encode(['error' => 'Acceso denegado']);
    exit;
}

try {
    $result = $conn->query("SELECT id, username, password FROM usuarios");

    if ($result->num_rows > 0) {
        $updated = 0;
        while ($row = $result->fetch_assoc()) {
            $password = $row['password'];
            if ($password === '' || preg_match('/^\$(2[ayb]|argon2id|argon2i)\$/', $password)) {
                continue;
            }

            $hashed = hash_password_secure($password);
            $stmt = $conn->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
            $stmt->bind_param('si', $hashed, $row['id']);
            if ($stmt->execute()) {
                $updated++;
            }
        }

        if ($updated > 0) {
            echo json_encode(['success' => true, 'message' => "{$updated} contraseña(s) hasheadas correctamente"]);
        } else {
            echo json_encode(['message' => 'No hay contraseñas para hashear']);
        }
    } else {
        echo json_encode(['message' => 'No hay usuarios en la base de datos']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>