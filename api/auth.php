<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/controllers/AuthController.php';
require_once __DIR__ . '/../app/helpers/ResponseHelper.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

ResponseHelper::cors();

try {
    $controller = new AuthController();
    $action     = $_GET['action'] ?? '';
    $method     = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch ($action) {
        case 'login':
            if ($method !== 'POST') ResponseHelper::error('Método no permitido', 405);
            $controller->login(ResponseHelper::readJsonBody());
            break;

        case 'logout':
            if ($method !== 'POST') ResponseHelper::error('Método no permitido', 405);
            $controller->logout();
            break;

        case 'me':
            $controller->me();
            break;

        default:
            ResponseHelper::error('Acción no reconocida', 400);
    }
} catch (Throwable $e) {
    error_log('auth.php error: ' . $e->getMessage());
    ResponseHelper::error('Error interno del servidor', 500);
}
