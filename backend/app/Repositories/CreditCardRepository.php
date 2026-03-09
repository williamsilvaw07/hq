<?php

namespace App\Repositories;

use App\Models\CreditCard;
use Illuminate\Database\Eloquent\Collection;

class CreditCardRepository
{
    public function getForWorkspace(int $workspaceId): Collection
    {
        return CreditCard::where('workspace_id', $workspaceId)->with('account')->orderBy('name')->get();
    }

    public function findById(int $id, int $workspaceId): ?CreditCard
    {
        return CreditCard::where('id', $id)->where('workspace_id', $workspaceId)->first();
    }

    public function create(array $data): CreditCard
    {
        return CreditCard::create($data);
    }

    public function update(CreditCard $card, array $data): CreditCard
    {
        $card->update($data);
        return $card->fresh();
    }

    public function delete(CreditCard $card): bool
    {
        return $card->delete();
    }
}
