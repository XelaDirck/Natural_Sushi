<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../helpers/ResponseHelper.php';
require_once __DIR__ . '/AuthController.php';

final class CategoryController
{
    private Category $model;

    public function __construct()
    {
        $this->model = new Category();
    }

    public function index(array $query): void
    {
        // "all=1" incluye inactivas si está autenticado
        $showAll = !empty($query['all']) && AuthController::isAuthenticated();
        ResponseHelper::json($this->model->all(!$showAll));
    }

    public function create(array $data): void
    {
        AuthController::requireAuth();
        ResponseHelper::requireFields($data, ['name']);
        try {
            $id = $this->model->create($data);
        } catch (PDOException $e) {
            ResponseHelper::error('Ya existe una categoría con ese nombre.', 409);
        }
        ResponseHelper::json(['id' => $id, 'message' => 'Categoría creada'], 201);
    }

    public function update(array $data): void
    {
        AuthController::requireAuth();
        if (empty($data['id'])) ResponseHelper::error('Falta id', 422);
        ResponseHelper::requireFields($data, ['name']);
        try {
            $this->model->update((int)$data['id'], $data);
        } catch (PDOException $e) {
            ResponseHelper::error('Nombre de categoría duplicado.', 409);
        }
        ResponseHelper::json(['message' => 'Categoría actualizada']);
    }

    public function delete(int $id): void
    {
        AuthController::requireAuth();
        try {
            $this->model->delete($id);
        } catch (RuntimeException $e) {
            ResponseHelper::error($e->getMessage(), 409);
        }
        ResponseHelper::json(['message' => 'Categoría eliminada']);
    }
}
