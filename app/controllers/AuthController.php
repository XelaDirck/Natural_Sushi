<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/ResponseHelper.php';

/**
 * AuthController — manejo de sesiones para el panel administrativo.
 * Sesiones PHP con cookie HttpOnly + SameSite.
 */
final class AuthController
{
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) return;

        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'secure'   => $secure,
            'samesite' => 'Lax',
        ]);
        session_name('nsadmin');
        session_start();
    }

    public function login(array $data): void
    {
        self::startSession();
        ResponseHelper::requireFields($data, ['username', 'password']);

        // Rate limit muy básico por sesión
        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
        if ($_SESSION['login_attempts'] > 8) {
            ResponseHelper::error('Demasiados intentos. Intenta más tarde.', 429);
        }

        $model = new User();
        $user = $model->verifyCredentials(
            (string)$data['username'],
            (string)$data['password']
        );

        if (!$user) {
            ResponseHelper::error('Credenciales inválidas', 401);
        }

        // Regenerar ID para prevenir fixation
        session_regenerate_id(true);
        $_SESSION['user_id']   = (int)$user['id'];
        $_SESSION['username']  = $user['username'];
        $_SESSION['login_attempts'] = 0;

        ResponseHelper::json(['message' => 'Sesión iniciada', 'user' => [
            'id'        => $user['id'],
            'username'  => $user['username'],
            'full_name' => $user['full_name'] ?? null,
        ]]);
    }

    public function logout(): void
    {
        self::startSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
        ResponseHelper::json(['message' => 'Sesión cerrada']);
    }

    public function me(): void
    {
        self::startSession();
        if (empty($_SESSION['user_id'])) {
            ResponseHelper::error('No autenticado', 401);
        }
        $model = new User();
        $user = $model->find((int)$_SESSION['user_id']);
        if (!$user) ResponseHelper::error('No autenticado', 401);
        ResponseHelper::json(['user' => $user]);
    }

    /** Bandera booleana sin lanzar */
    public static function isAuthenticated(): bool
    {
        self::startSession();
        return !empty($_SESSION['user_id']);
    }

    /** Requiere sesión; si no, responde 401 y termina */
    public static function requireAuth(): void
    {
        if (!self::isAuthenticated()) {
            ResponseHelper::error('Se requiere autenticación', 401);
        }
    }
}
