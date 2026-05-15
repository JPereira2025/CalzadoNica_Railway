<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Test de Login</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        h3 { border-bottom: 2px solid #ccc; padding-bottom: 5px; }
        .ok { color: green; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>

<?php

echo "<h1>TEST DE CONEXIÓN Y LOGIN (Paso a Paso)</h1>";

// --- PASO 1: Probar que el archivo db.php existe y se puede incluir ---
echo "<h3>Paso 1: Verificando db.php...</h3>";
if (!file_exists(__DIR__ . '/db.php')) {
    die("<p class='error'>ERROR CRÍTICO: El archivo 'db.php' NO se encuentra en la carpeta 'endpoints'. Revisa que esté ahí.</p>");
}
require_once __DIR__ . '/db.php';
echo "<p class='ok'>✅ Archivo 'db.php' incluido correctamente.</p>";

// --- PASO 2: Probar la conexión a la base de datos ---
echo "<h3>Paso 2: Verificando la conexión a MySQL...</h3>";
if (!isset($conn) || $conn->connect_error) {
    $error = isset($conn) ? $conn->connect_error : 'El objeto \$conn no fue creado.';
    die("<p class='error'>ERROR CRÍTICO de conexión a la BD: {$error}</p><p>Revisa los datos (host, usuario, puerto) en tu archivo 'db.php'.</p>");
}
echo "<p class='ok'>✅ Conexión a la base de datos 'calzado_nica' exitosa.</p>";

// --- PASO 3: Probar la consulta SQL para el usuario de prueba ---
echo "<h3>Paso 3: Buscando al usuario de prueba 'testuser'...</h3>";
 $username_test = 'testuser';
 $password_test = '123456';

 $stmt = $conn->prepare("SELECT id, username, password, role FROM usuarios WHERE username = ? LIMIT 1");

if ($stmt === false) {
    die("<p class='error'>ERROR al preparar la consulta SQL: " . $conn->error . "</p>");
}
echo "<p class='ok'>✅ Consulta SQL preparada correctamente.</p>";

 $stmt->bind_param('s', $username_test);
 $stmt->execute();
 $result = $stmt->get_result();

echo "<p class='info'>Filas encontradas para el usuario '{$username_test}': " . $result->num_rows . "</p>";

// --- PASO 4: Analizar el resultado ---
if ($result->num_rows > 0) {
    echo "<h3>Paso 4: Usuario encontrado. Verificando contraseña...</h3>";
    $user = $result->fetch_assoc();
    echo "<h4>Datos obtenidos de la BD:</h4>";
    echo "<pre>";
    var_dump($user);
    echo "</pre>";

    $stored_password = $user['password'];
    echo "<h4>Comparación de contraseñas:</h4>";
    echo "<p>Contraseña enviada (texto plano): '{$password_test}'</p>";
    echo "<p>Contraseña almacenada en BD (hash o texto): '{$stored_password}'</p>";

    if ($password_test === $stored_password) {
        echo "<p class='ok'>✅ ¡ÉXITO TOTAL! La contraseña en texto plano coincide.</p>";
    } elseif (password_verify($password_test, $stored_password)) {
        echo "<p class='ok'>✅ ¡ÉXITO TOTAL! La contraseña hasheada coincide.</p>";
    } else {
        echo "<p class='error'>❌ FALLO: Las contraseñas NO coinciden.</p>";
    }

} else {
    echo "<p class='error'>❌ FALLO: No se encontró ningún usuario con el nombre 'testuser'.</p>";
    echo "<p><strong>Acción requerida:</strong> Ve a phpMyAdmin, selecciona la BD 'calzado_nica' y ejecuta este SQL:</p>";
    echo "<pre><code>DELETE FROM usuarios WHERE username = 'testuser';
INSERT INTO usuarios (username, password, role) VALUES ('testuser', '123456', 'admin');</code></pre>";
}

 $stmt->close();
 $conn->close();

?>

</body>
</html>