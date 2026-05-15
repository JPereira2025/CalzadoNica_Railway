<?php
// Utilidades para hashing de contraseñas con parámetros seguros.
// Usa Argon2id cuando esté disponible; si no, cae a bcrypt.

function get_password_hash_options() {
    if (defined('PASSWORD_ARGON2ID')) {
        return [
            'algo' => PASSWORD_ARGON2ID,
            // Valores moderados: ajustar según memoria/CPU del servidor
            'options' => [
                'memory_cost' => 1 << 16, // 65536 KiB = 64 MiB
                'time_cost' => 4,
                'threads' => 2,
            ],
        ];
    }

    return [
        'algo' => PASSWORD_BCRYPT,
        'options' => ['cost' => 12],
    ];
}

function hash_password_secure(string $password): string {
    $cfg = get_password_hash_options();
    return password_hash($password, $cfg['algo'], $cfg['options']);
}

function password_needs_rehash_secure(string $hash): bool {
    $cfg = get_password_hash_options();
    return password_needs_rehash($hash, $cfg['algo'], $cfg['options']);
}

?>
