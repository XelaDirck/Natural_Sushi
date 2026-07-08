<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/controllers/CategoryController.php';
require_once __DIR__ . '/../app/helpers/ResponseHelper.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

ResponseHelper::cors();

try {
    $controller = new CategoryController();
    $method     = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch ($method) {
        case 'GET':
            $controller->index($_GET);
            break;

        case 'POST':
            $controller->create(ResponseHelper::readJsonBody());
            break;

        case 'PUT':
        case 'PATCH':
            $controller->update(ResponseHelper::readJsonBody());
            break;

        case 'DELETE':
            $id = isset($_GET['id']) ? (int)$_GET['id']
                : (int)(ResponseHelper::readJsonBody()['id'] ?? 0);
            if ($id <= 0) ResponseHelper::error('Falta id', 422);
            $controller->delete($id);
            break;

        default:
            ResponseHelper::error('Método no permitido', 405);
    }
} catch (Throwable $e) {
    error_log('categories.php error: ' . $e->getMessage());
    ResponseHelper::error('Error interno del servidor', 500);
}
