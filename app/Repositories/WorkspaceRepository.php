<?php

namespace App\Repositories;

use App\Models\Account;
use App\Models\Category;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkspaceRepository
{
    public function findById(int $id): ?Workspace
    {
        return Workspace::find($id);
    }

    public function findBySlug(string $slug): ?Workspace
    {
        return Workspace::where('slug', $slug)->first();
    }

    public function getForUser(int $userId)
    {
        return Workspace::whereHas('workspaceUsers', fn ($q) => $q->where('user_id', $userId))
            ->orderBy('name')
            ->get();
    }

    public function create(array $data, int $ownerUserId): Workspace
    {
        return DB::transaction(function () use ($data, $ownerUserId) {
            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
            $workspace = Workspace::create($data);
            $workspace->workspaceUsers()->create([
                'user_id' => $ownerUserId,
                'role' => 'owner',
            ]);
            $this->seedDefaultsForWorkspace($workspace->id);
            return $workspace->fresh();
        });
    }

    public function update(Workspace $workspace, array $data): Workspace
    {
        $workspace->update($data);
        return $workspace->fresh();
    }

    public function delete(Workspace $workspace): bool
    {
        return $workspace->delete();
    }

    public function userBelongsToWorkspace(int $userId, int $workspaceId): bool
    {
        return WorkspaceUser::where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->exists();
    }

    public function getUserRole(int $userId, int $workspaceId): ?string
    {
        $pivot = WorkspaceUser::where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->first();
        return $pivot?->role;
    }

    /** @return \Illuminate\Support\Collection<int, array{id: int, user_id: int, role: string, name: string, email: string}> */
    public function getMembers(int $workspaceId)
    {
        return WorkspaceUser::where('workspace_id', $workspaceId)
            ->with('user:id,name,email')
            ->get()
            ->map(fn (WorkspaceUser $wu) => [
                'id' => $wu->id,
                'user_id' => $wu->user_id,
                'role' => $wu->role,
                'name' => $wu->user->name ?? '',
                'email' => $wu->user->email ?? '',
            ]);
    }

    public function addMember(int $workspaceId, int $userId, string $role): WorkspaceUser
    {
        return WorkspaceUser::create([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'role' => $role,
        ]);
    }

    public function updateMemberRole(int $workspaceId, int $userId, string $role): bool
    {
        return WorkspaceUser::where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->update(['role' => $role]) > 0;
    }

    public function removeMember(int $workspaceId, int $userId): bool
    {
        return WorkspaceUser::where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    public function createInvitation(int $workspaceId, string $email, string $role, int $invitedByUserId): WorkspaceInvitation
    {
        return WorkspaceInvitation::create([
            'workspace_id' => $workspaceId,
            'email' => $email,
            'role' => $role,
            'token' => Str::random(48),
            'invited_by' => $invitedByUserId,
            'expires_at' => now()->addDays(7),
        ]);
    }

    /** @return \Illuminate\Support\Collection<int, WorkspaceInvitation> */
    public function getPendingInvitations(int $workspaceId)
    {
        return WorkspaceInvitation::where('workspace_id', $workspaceId)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->with('inviter:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findInvitationByToken(string $token): ?WorkspaceInvitation
    {
        return WorkspaceInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->with('workspace')
            ->first();
    }

    public function acceptInvitation(WorkspaceInvitation $invitation, int $userId): WorkspaceUser
    {
        return DB::transaction(function () use ($invitation, $userId) {
            $invitation->update(['accepted_at' => now()]);
            return $this->addMember($invitation->workspace_id, $userId, $invitation->role);
        });
    }

    public function revokeInvitation(int $workspaceId, int $invitationId): bool
    {
        return WorkspaceInvitation::where('workspace_id', $workspaceId)
            ->where('id', $invitationId)
            ->whereNull('accepted_at')
            ->delete() > 0;
    }

    public function hasPendingInvitation(int $workspaceId, string $email): bool
    {
        return WorkspaceInvitation::where('workspace_id', $workspaceId)
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->exists();
    }

    private function seedDefaultsForWorkspace(int $workspaceId): void
    {
        $defaultCategories = [
            ['name' => 'Food & dining', 'type' => 'expense'],
            ['name' => 'Transport', 'type' => 'expense'],
            ['name' => 'Shopping', 'type' => 'expense'],
            ['name' => 'Bills & utilities', 'type' => 'expense'],
            ['name' => 'Other', 'type' => 'expense'],
            ['name' => 'Salary', 'type' => 'income'],
            ['name' => 'Freelance', 'type' => 'income'],
            ['name' => 'Other income', 'type' => 'income'],
        ];
        foreach ($defaultCategories as $c) {
            Category::create([
                'workspace_id' => $workspaceId,
                'name' => $c['name'],
                'type' => $c['type'],
            ]);
        }
        Account::create([
            'workspace_id' => $workspaceId,
            'name' => 'Cash',
            'type' => Account::TYPE_CASH,
            'currency' => 'BRL',
            'balance' => 0,
        ]);
    }
}
