<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
 * Modelo Category. CRUD sobre la tabla categories.
 */
final class Category
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function all(bool $onlyActive = false): array
    {
        $sql = 'SELECT * FROM categories';
        if ($onlyActive) $sql .= ' WHERE is_active = 1';
        $sql .= ' ORDER BY sort_order ASC, name ASC';

        return $this->db->query($sql)->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM categories WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare('INSERT INTO categories (name, slug, sort_order, is_active)
                                    VALUES (:name, :slug, :ord, :act)');
        $stmt->execute([
            ':name' => (string)$data['name'],
            ':slug' => $this->slugify($data['name']),
            ':ord'  => (int)($data['sort_order'] ?? 0),
            ':act'  => !empty($data['is_active']) ? 1 : 0,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare('UPDATE categories
                                    SET name = :name, slug = :slug,
                                        sort_order = :ord, is_active = :act
                                    WHERE id = :id');
        return $stmt->execute([
            ':id'   => $id,
            ':name' => (string)$data['name'],
            ':slug' => $this->slugify($data['name']),
            ':ord'  => (int)($data['sort_order'] ?? 0),
            ':act'  => !empty($data['is_active']) ? 1 : 0,
        ]);
    }

    public function delete(int $id): bool
    {
        // Verificar que no tenga productos
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM products WHERE category_id = :id');
        $stmt->execute([':id' => $id]);
        if ((int)$stmt->fetchColumn() > 0) {
            throw new RuntimeException('No se puede eliminar: la categoría tiene productos.');
        }
        $stmt = $this->db->prepare('DELETE FROM categories WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    private function slugify(string $text): string
    {
        $text = mb_strtolower(trim($text), 'UTF-8');
        $text = preg_replace('~[^\pL\d]+~u', '-', $text) ?? $text;
        $text = trim($text, '-');
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text) ?: $text;
        return $text !== '' ? $text : 'categoria';
    }
}
