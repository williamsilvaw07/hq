<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Repositories\WorkspaceRepository;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WorkspaceService
{
    public const ROLES = ['owner', 'admin', 'member', 'viewer'];

    public const INVITABLE_ROLES = ['admin', 'member', 'viewer'];

    public function __construct(
        private WorkspaceRepository $workspaceRepository
    ) {}

    public function listForUser(User $user)
    {
        return $this->workspaceRepository->getForUser($user->id);
    }

    public function create(User $user, array $data): Workspace
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        return $this->workspaceRepository->create($data, $user->id);
    }

    public function show(int $workspaceId, User $user): ?Workspace
    {
        $workspace = $this->workspaceRepository->findById($workspaceId);
        if (!$workspace || !$this->workspaceRepository->userBelongsToWorkspace($user->id, $workspaceId)) {
            return null;
        }
        return $workspace;
    }

    public function update(Workspace $workspace, User $user, array $data): ?Workspace
    {
        if (!$this->workspaceRepository->userBelongsToWorkspace($user->id, $workspace->id)) {
            return null;
        }
        return $this->workspaceRepository->update($workspace, $data);
    }

    public function delete(Workspace $workspace, User $user): bool
    {
        if (!$this->workspaceRepository->userBelongsToWorkspace($user->id, $workspace->id)) {
            return false;
        }
        return $this->workspaceRepository->delete($workspace);
    }

    public function userCanAccess(User $user, int $workspaceId): bool
    {
        return $this->workspaceRepository->userBelongsToWorkspace($user->id, $workspaceId);
    }

    private function requireAdminOrOwner(User $user, int $workspaceId): void
    {
        $role = $this->workspaceRepository->getUserRole($user->id, $workspaceId);
        if (!in_array($role, ['owner', 'admin'], true)) {
            throw ValidationException::withMessages(['workspace' => ['You do not have permission to manage members.']]);
        }
    }

    public function invite(User $user, int $workspaceId, string $email, string $role): WorkspaceInvitation
    {
        $this->requireAdminOrOwner($user, $workspaceId);
        if (!in_array($role, self::INVITABLE_ROLES, true)) {
            throw ValidationException::withMessages(['role' => ['Invalid role for invite.']]);
        }
        $workspace = $this->workspaceRepository->findById($workspaceId);
        if (!$workspace || !$this->workspaceRepository->userBelongsToWorkspace($user->id, $workspaceId)) {
            throw ValidationException::withMessages(['workspace' => ['Workspace not found.']]);
        }
        $existingUser = \App\Models\User::where('email', $email)->first();
        if ($existingUser && $this->workspaceRepository->userBelongsToWorkspace($existingUser->id, $workspaceId)) {
            throw ValidationException::withMessages(['email' => ['This user is already in the workspace.']]);
        }
        if ($this->workspaceRepository->hasPendingInvitation($workspaceId, $email)) {
            throw ValidationException::withMessages(['email' => ['An invitation was already sent to this email.']]);
        }
        return $this->workspaceRepository->createInvitation($workspaceId, $email, $role, $user->id);
    }

    public function listMembers(User $user, int $workspaceId)
    {
        if (!$this->workspaceRepository->userBelongsToWorkspace($user->id, $workspaceId)) {
            return collect();
        }
        return $this->workspaceRepository->getMembers($workspaceId);
    }

    public function listPendingInvitations(User $user, int $workspaceId)
    {
        $this->requireAdminOrOwner($user, $workspaceId);
        return $this->workspaceRepository->getPendingInvitations($workspaceId);
    }

    public function updateMemberRole(User $user, int $workspaceId, int $memberUserId, string $role): bool
    {
        $this->requireAdminOrOwner($user, $workspaceId);
        $memberRole = $this->workspaceRepository->getUserRole($memberUserId, $workspaceId);
        if (!$memberRole) {
            return false;
        }
        if ($memberRole === 'owner') {
            throw ValidationException::withMessages(['member' => ['Cannot change owner role.']]);
        }
        if ($user->id === $memberUserId && $user->id !== $memberUserId) {
            // admin demoting themselves to non-admin is allowed
        }
        if (!in_array($role, self::ROLES, true) || $role === 'owner') {
            throw ValidationException::withMessages(['role' => ['Invalid role.']]);
        }
        return $this->workspaceRepository->updateMemberRole($workspaceId, $memberUserId, $role);
    }

    public function removeMember(User $user, int $workspaceId, int $memberUserId): bool
    {
        $this->requireAdminOrOwner($user, $workspaceId);
        $memberRole = $this->workspaceRepository->getUserRole($memberUserId, $workspaceId);
        if (!$memberRole) {
            return false;
        }
        if ($memberRole === 'owner') {
            throw ValidationException::withMessages(['member' => ['Cannot remove the owner.']]);
        }
        return $this->workspaceRepository->removeMember($workspaceId, $memberUserId);
    }

    public function revokeInvitation(User $user, int $workspaceId, int $invitationId): bool
    {
        $this->requireAdminOrOwner($user, $workspaceId);
        return $this->workspaceRepository->revokeInvitation($workspaceId, $invitationId);
    }

    public function getInvitationByToken(string $token): ?WorkspaceInvitation
    {
        return $this->workspaceRepository->findInvitationByToken($token);
    }

    public function acceptInvitation(User $user, string $token): WorkspaceInvitation
    {
        $invitation = $this->workspaceRepository->findInvitationByToken($token);
        if (!$invitation) {
            throw ValidationException::withMessages(['token' => ['Invalid or expired invitation.']]);
        }
        if (strtolower($invitation->email) !== strtolower($user->email)) {
            throw ValidationException::withMessages(['email' => ['This invitation was sent to another email address.']]);
        }
        if ($this->workspaceRepository->userBelongsToWorkspace($user->id, $invitation->workspace_id)) {
            throw ValidationException::withMessages(['workspace' => ['You are already a member of this workspace.']]);
        }
        $this->workspaceRepository->acceptInvitation($invitation, $user->id);
        return $invitation->fresh(['workspace']);
    }
}
