<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';

/**
 * Modelo Product. Encapsula todas las consultas SQL relacionadas
 * con productos, usando consultas preparadas (previene SQL Injection).
 */
final class Product
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    /**
     * Lista productos.
     * @param array $filters ['only_active'=>bool, 'featured'=>bool, 'category_id'=>int]
     */
    public function all(array $filters = []): array
    {
        $sql = 'SELECT p.*, c.name AS category_name
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE 1=1';
        $params = [];

        if (!empty($filters['only_active'])) {
            $sql .= ' AND p.is_active = 1';
        }
        if (!empty($filters['featured'])) {
            $sql .= ' AND p.is_featured = 1';
        }
        if (!empty($filters['category_id'])) {
            $sql .= ' AND p.category_id = :cid';
            $params[':cid'] = (int)$filters['category_id'];
        }
        $sql .= ' ORDER BY p.is_featured DESC, p.id ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $sql = 'INSERT INTO products
                (category_id, name, description, price, image_url, emoji, is_featured, is_active)
                VALUES (:cid, :name, :desc, :price, :img, :emoji, :feat, :act)';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':cid'   => (int)$data['category_id'],
            ':name'  => (string)$data['name'],
            ':desc'  => (string)($data['description'] ?? ''),
            ':price' => (float)$data['price'],
            ':img'   => $data['image_url'] ?? null,
            ':emoji' => $data['emoji'] ?? null,
            ':feat'  => !empty($data['is_featured']) ? 1 : 0,
            ':act'   => !empty($data['is_active'])   ? 1 : 0,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $sql = 'UPDATE products SET
                  category_id = :cid,
                  name        = :name,
                  description = :desc,
                  price       = :price,
                  image_url   = :img,
                  emoji       = :emoji,
                  is_featured = :feat,
                  is_active   = :act
                WHERE id = :id';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'    => $id,
            ':cid'   => (int)$data['category_id'],
            ':name'  => (string)$data['name'],
            ':desc'  => (string)($data['description'] ?? ''),
            ':price' => (float)$data['price'],
            ':img'   => $data['image_url'] ?? null,
            ':emoji' => $data['emoji'] ?? null,
            ':feat'  => !empty($data['is_featured']) ? 1 : 0,
            ':act'   => !empty($data['is_active'])   ? 1 : 0,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM products WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }

    public function toggleActive(int $id): bool
    {
        $stmt = $this->db->prepare('UPDATE products SET is_active = 1 - is_active WHERE id = :id');
        return $stmt->execute([':id' => $id]);
    }
}
