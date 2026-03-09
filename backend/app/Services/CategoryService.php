<?php

namespace App\Services;

use App\Models\Category;
use App\Repositories\CategoryRepository;

class CategoryService
{
    public function __construct(
        private CategoryRepository $categoryRepository
    ) {}

    public function list(int $workspaceId)
    {
        return $this->categoryRepository->getForWorkspace($workspaceId);
    }

    public function store(int $workspaceId, array $data): Category
    {
        $data['workspace_id'] = $workspaceId;
        return $this->categoryRepository->create($data);
    }

    public function show(int $id, int $workspaceId): ?Category
    {
        return $this->categoryRepository->findById($id, $workspaceId);
    }

    public function update(Category $category, array $data): Category
    {
        return $this->categoryRepository->update($category, $data);
    }

    public function delete(Category $category): bool
    {
        return $this->categoryRepository->delete($category);
    }
}
