<?php

namespace App\Http\Controllers;

use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        private CategoryService $categoryService
    ) {}

    public function index(Request $request, int $workspace): JsonResponse
    {
        $categories = $this->categoryService->list($workspace);
        return response()->json(['data' => $categories]);
    }

    public function store(Request $request, int $workspace): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
        ]);
        $category = $this->categoryService->store($workspace, $request->only('name', 'type', 'icon', 'color'));
        return response()->json(['data' => $category], 201);
    }

    public function show(Request $request, int $workspace, int $id): JsonResponse
    {
        $category = $this->categoryService->show($id, $workspace);
        if (!$category) {
            return response()->json(['message' => 'Category not found.'], 404);
        }
        return response()->json(['data' => $category]);
    }

    public function update(Request $request, int $workspace, int $id): JsonResponse
    {
        $category = $this->categoryService->show($id, $workspace);
        if (!$category) {
            return response()->json(['message' => 'Category not found.'], 404);
        }
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:income,expense',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
        ]);
        $category = $this->categoryService->update($category, $request->only('name', 'type', 'icon', 'color'));
        return response()->json(['data' => $category]);
    }

    public function destroy(Request $request, int $workspace, int $id): JsonResponse
    {
        $category = $this->categoryService->show($id, $workspace);
        if (!$category) {
            return response()->json(['message' => 'Category not found.'], 404);
        }
        $this->categoryService->delete($category);
        return response()->json(null, 204);
    }
}
