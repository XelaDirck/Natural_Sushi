<?php
declare(strict_types=1);

/**
 * Conexión centralizada a MySQL con PDO.
 * Singleton para reutilizar la misma instancia en toda la request.
 * Usa consultas preparadas por defecto y lanza excepciones en error.
 *
 * Configuración: /config.php (fuera del repo, no versionar).
 * Si no existe, se cargan defaults locales seguros.
 */
final class Database
{
    private static ?PDO $pdo = null;

    /** Devuelve la instancia PDO compartida */
    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $config = self::loadConfig();

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $config['host'],
            $config['port'],
            $config['database']
        );

        try {
            self::$pdo = new PDO(
                $dsn,
                $config['username'],
                $config['password'],
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,   // consultas preparadas reales
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8mb4'",
                ]
            );
        } catch (PDOException $e) {
            // No exponemos detalles al usuario final
            error_log('DB connect error: ' . $e->getMessage());
            throw new RuntimeException('No fue posible conectar a la base de datos.');
        }

        return self::$pdo;
    }

    /** Carga configuración desde /config.php o defaults */
    private static function loadConfig(): array
    {
        $file = dirname(__DIR__, 2) . '/config.php';
        if (is_file($file)) {
            /** @var array $config */
            $config = require $file;
            return array_merge(self::defaults(), $config);
        }
        return self::defaults();
    }

    private static function defaults(): array
    {
        return [
            'host'     => '127.0.0.1',
            'port'     => 3306,
            'database' => 'natural_sushi',
            'username' => 'root',
            'password' => '',
        ];
    }

    /** Bloquea instanciación */
    private function __construct() {}
    private function __clone() {}
}
