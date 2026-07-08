<?php
declare(strict_types=1);

/**
 * Helper de respuestas JSON uniformes para la API.
 * Uso:
 *   ResponseHelper::json($data);
 *   ResponseHelper::error('Mensaje', 400);
 *   ResponseHelper::readJsonBody();
 */
final class ResponseHelper
{
    /** Envía respuesta JSON y termina */
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /** Envía error JSON y termina */
    public static function error(string $message, int $status = 400, array $extra = []): void
    {
        self::json(['error' => $message] + $extra, $status);
    }

    /** Lee y decodifica el cuerpo JSON de la request */
    public static function readJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') return [];
        $data = json_decode($raw, true);
        if (!is_array($data)) return [];
        return $data;
    }

    /** Cabeceras CORS mínimas para permitir el consumo desde el front */
    public static function cors(): void
    {
        header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { exit; }
    }

    /** Validaciones comunes reutilizables */
    public static function requireFields(array $data, array $fields): void
    {
        $missing = [];
        foreach ($fields as $f) {
            if (!isset($data[$f]) || (is_string($data[$f]) && trim($data[$f]) === '')) {
                $missing[] = $f;
            }
        }
        if ($missing) {
            self::error('Faltan campos requeridos: ' . implode(', ', $missing), 422);
        }
    }
}
