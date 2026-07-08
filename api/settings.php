<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/config/Database.php';
require_once __DIR__ . '/../app/helpers/ResponseHelper.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

ResponseHelper::cors();

try {
    $db = Database::connection();
    $rows = $db->query('SELECT setting_key, setting_value FROM settings')->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $out[$r['setting_key']] = $r['setting_value'];
    }
    ResponseHelper::json($out);
} catch (Throwable $e) {
    error_log('settings.php error: ' . $e->getMessage());
    ResponseHelper::error('Error interno del servidor', 500);
}
