<?php

namespace App\Repositories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Collection;

class AccountRepository
{
    public function getForWorkspace(int $workspaceId): Collection
    {
        return Account::where('workspace_id', $workspaceId)->orderBy('name')->get();
    }

    public function findById(int $id, int $workspaceId): ?Account
    {
        return Account::where('id', $id)->where('workspace_id', $workspaceId)->first();
    }

    public function create(array $data): Account
    {
        return Account::create($data);
    }

    public function update(Account $account, array $data): Account
    {
        $account->update($data);
        return $account->fresh();
    }

    public function delete(Account $account): bool
    {
        return $account->delete();
    }
}
