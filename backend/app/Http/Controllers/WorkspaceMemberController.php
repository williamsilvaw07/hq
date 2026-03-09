<?php

namespace App\Http\Controllers;

use App\Services\WorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WorkspaceMemberController extends Controller
{
    public function __construct(
        private WorkspaceService $workspaceService
    ) {}

    public function index(Request $request, int $workspace): JsonResponse
    {
        $members = $this->workspaceService->listMembers($request->user(), $workspace);
        return response()->json(['data' => $members]);
    }

    public function invite(Request $request, int $workspace): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:admin,member,viewer',
        ]);
        try {
            $invitation = $this->workspaceService->invite(
                $request->user(),
                $workspace,
                $request->input('email'),
                $request->input('role')
            );
        } catch (ValidationException $e) {
            $errors = $e->errors();
            $first = collect($errors)->flatten()->first();
            return response()->json(['message' => $first ?: $e->getMessage(), 'errors' => $errors], 422);
        }
        $baseUrl = $request->input('frontend_url', config('app.frontend_url', 'http://localhost:3000'));
        $inviteLink = rtrim($baseUrl, '/') . '/invite/accept?token=' . $invitation->token;
        return response()->json([
            'data' => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'expires_at' => $invitation->expires_at->toIso8601String(),
                'invite_link' => $inviteLink,
            ],
        ], 201);
    }

    public function pendingInvitations(Request $request, int $workspace): JsonResponse
    {
        $invitations = $this->workspaceService->listPendingInvitations($request->user(), $workspace);
        $data = $invitations->map(fn ($inv) => [
            'id' => $inv->id,
            'email' => $inv->email,
            'role' => $inv->role,
            'expires_at' => $inv->expires_at->toIso8601String(),
            'invited_by' => $inv->inviter ? ['name' => $inv->inviter->name, 'email' => $inv->inviter->email] : null,
        ]);
        return response()->json(['data' => $data]);
    }

    public function revokeInvitation(Request $request, int $workspace, int $invitation): JsonResponse
    {
        try {
            $ok = $this->workspaceService->revokeInvitation($request->user(), $workspace, $invitation);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 403);
        }
        if (!$ok) {
            return response()->json(['message' => 'Invitation not found.'], 404);
        }
        return response()->json(['message' => 'Revoked.'], 204);
    }

    public function updateRole(Request $request, int $workspace, int $member): JsonResponse
    {
        $request->validate([
            'role' => 'required|string|in:admin,member,viewer',
        ]);
        try {
            $ok = $this->workspaceService->updateMemberRole(
                $request->user(),
                $workspace,
                $member,
                $request->input('role')
            );
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        }
        if (!$ok) {
            return response()->json(['message' => 'Member not found.'], 404);
        }
        return response()->json(['message' => 'Updated.']);
    }

    public function removeMember(Request $request, int $workspace, int $member): JsonResponse
    {
        try {
            $ok = $this->workspaceService->removeMember($request->user(), $workspace, $member);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 403);
        }
        if (!$ok) {
            return response()->json(['message' => 'Member not found.'], 404);
        }
        return response()->json(['message' => 'Removed.'], 204);
    }
}
