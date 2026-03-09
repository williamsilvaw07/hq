<?php

namespace App\Http\Controllers;

use App\Services\WorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class InvitationAcceptController extends Controller
{
    public function __construct(
        private WorkspaceService $workspaceService
    ) {}

    public function show(Request $request): JsonResponse
    {
        $request->validate(['token' => 'required|string']);
        $invitation = $this->workspaceService->getInvitationByToken($request->input('token'));
        if (!$invitation) {
            return response()->json(['message' => 'Invalid or expired invitation.'], 404);
        }
        return response()->json([
            'data' => [
                'workspace_name' => $invitation->workspace->name ?? '',
                'email' => $invitation->email,
                'role' => $invitation->role,
            ],
        ]);
    }

    public function accept(Request $request): JsonResponse
    {
        $request->validate(['token' => 'required|string']);
        try {
            $invitation = $this->workspaceService->acceptInvitation($request->user(), $request->input('token'));
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        }
        return response()->json([
            'message' => 'Invitation accepted.',
            'data' => [
                'workspace' => $invitation->workspace->only('id', 'name', 'slug'),
            ],
        ]);
    }
}
