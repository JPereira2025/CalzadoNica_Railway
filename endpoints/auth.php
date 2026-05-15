<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function normalizeRole(string $role): string {
    $role = trim($role);
    $map = [
        'admin' => 'Administrador',
        'administrador' => 'Administrador',
        'vendedor' => 'Vendedor',
        'gerente' => 'Gerente'
    ];
    $lower = mb_strtolower($role, 'UTF-8');
    return $map[$lower] ?? $role;
}

function getSessionUser(): ?array {
    return isset($_SESSION['user']) ? $_SESSION['user'] : null;
}

function requireLogin(): void {
    if (!getSessionUser()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'No autorizado. Inicie sesión.']);
        exit;
    }
}

function requireAdmin(): void {
    requireLogin();
    $user = getSessionUser();
    if (!isset($user['role']) || normalizeRole($user['role']) !== 'Administrador') {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'Acceso denegado: solo el administrador puede modificar datos.']);
        exit;
    }
}

function setSessionUser(array $user): void {
    $_SESSION['user'] = [
        'id' => $user['id'] ?? null,
        'username' => $user['username'] ?? '',
        'role' => normalizeRole($user['role'] ?? '')
    ];
}

function destroySession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']
        );
    }
    session_destroy();
}
