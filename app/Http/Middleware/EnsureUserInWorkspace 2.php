<?php

namespace App\Http\Middleware;

use App\Services\WorkspaceService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserInWorkspace
{
    public function __construct(
        private WorkspaceService $workspaceService
    ) {}

    public function handle(Request $request, Closure $next, string $param = 'workspace'): Response
    {
        $workspaceId = $request->route($param);
        if (!$workspaceId || !$this->workspaceService->userCanAccess($request->user(), (int) $workspaceId)) {
            return response()->json(['message' => 'Unauthorized or workspace not found.'], 403);
        }
        $request->attributes->set('workspace_id', (int) $workspaceId);
        return $next($request);
    }
}
