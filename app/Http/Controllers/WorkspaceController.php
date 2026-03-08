<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Services\WorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function __construct(
        private WorkspaceService $workspaceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $workspaces = $this->workspaceService->listForUser($request->user());
        return response()->json(['data' => $workspaces]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:workspaces,slug',
        ]);
        $workspace = $this->workspaceService->create($request->user(), $request->only('name', 'slug'));
        return response()->json(['data' => $workspace], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $workspace = $this->workspaceService->show($id, $request->user());
        if (!$workspace) {
            return response()->json(['message' => 'Workspace not found.'], 404);
        }
        return response()->json(['data' => $workspace]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $workspace = Workspace::find($id);
        if (!$workspace) {
            return response()->json(['message' => 'Workspace not found.'], 404);
        }
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:workspaces,slug,' . $id,
        ]);
        $updated = $this->workspaceService->update($workspace, $request->user(), $request->only('name', 'slug'));
        if (!$updated) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        return response()->json(['data' => $updated]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $workspace = Workspace::find($id);
        if (!$workspace) {
            return response()->json(['message' => 'Workspace not found.'], 404);
        }
        if (!$this->workspaceService->delete($workspace, $request->user())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        return response()->json(['message' => 'Deleted.'], 204);
    }
}
