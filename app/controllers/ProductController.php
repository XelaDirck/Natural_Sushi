<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../helpers/ResponseHelper.php';
require_once __DIR__ . '/AuthController.php';

final class ProductController
{
    private Product $model;

    public function __construct()
    {
        $this->model = new Product();
    }

    public function index(array $query): void
    {
        // "all=1" incluye inactivos (solo si está autenticado como admin)
        $showAll = !empty($query['all']) && AuthController::isAuthenticated();

        $filters = [
            'only_active' => !$showAll,
            'featured'    => !empty($query['featured']),
            'category_id' => isset($query['category_id']) ? (int)$query['category_id'] : null,
        ];
        ResponseHelper::json($this->model->all($filters));
    }

    public function show(int $id): void
    {
        $product = $this->model->find($id);
        if (!$product) ResponseHelper::error('Producto no encontrado', 404);
        ResponseHelper::json($product);
    }

    public function create(array $data): void
    {
        AuthController::requireAuth();
        ResponseHelper::requireFields($data, ['name', 'category_id', 'price']);

        $this->validatePrice($data['price']);

        $id = $this->model->create($data);
        ResponseHelper::json(['id' => $id, 'message' => 'Producto creado'], 201);
    }

    public function update(array $data): void
    {
        AuthController::requireAuth();
        if (empty($data['id'])) ResponseHelper::error('Falta id', 422);
        ResponseHelper::requireFields($data, ['name', 'category_id', 'price']);

        $this->validatePrice($data['price']);

        $ok = $this->model->update((int)$data['id'], $data);
        if (!$ok) ResponseHelper::error('No se pudo actualizar', 500);
        ResponseHelper::json(['message' => 'Producto actualizado']);
    }

    public function delete(int $id): void
    {
        AuthController::requireAuth();
        $ok = $this->model->delete($id);
        if (!$ok) ResponseHelper::error('No se pudo eliminar', 500);
        ResponseHelper::json(['message' => 'Producto eliminado']);
    }

    private function validatePrice($price): void
    {
        if (!is_numeric($price) || (float)$price < 0) {
            ResponseHelper::error('Precio inválido', 422);
        }
    }
}
