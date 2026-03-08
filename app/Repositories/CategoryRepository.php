<?php

namespace App\Repositories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository
{
    public function getForWorkspace(int $workspaceId): Collection
    {
        return Category::where('workspace_id', $workspaceId)->orderBy('type')->orderBy('name')->get();
    }

    public function findById(int $id, int $workspaceId): ?Category
    {
        return Category::where('id', $id)->where('workspace_id', $workspaceId)->first();
    }

    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data): Category
    {
        $category->update($data);
        return $category->fresh();
    }

    public function delete(Category $category): bool
    {
        return $category->delete();
    }
}
