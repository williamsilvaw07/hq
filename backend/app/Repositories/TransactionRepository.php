<?php

namespace App\Repositories;

use App\Models\Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class TransactionRepository
{
    public function getForWorkspace(
        int $workspaceId,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $q = Transaction::forWorkspace($workspaceId)->with(['account', 'category', 'createdByUser']);
        if (!empty($filters['status'])) {
            $q->where('status', $filters['status']);
        }
        if (!empty($filters['type']) && in_array($filters['type'], ['income', 'expense'], true)) {
            $q->where('type', $filters['type']);
        }
        if (!empty($filters['search'])) {
            $q->where(function ($query) use ($filters) {
                $query->where('description', 'like', '%' . $filters['search'] . '%');
            });
        }
        if (!empty($filters['category_id'])) {
            $q->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['account_id'])) {
            $q->where('account_id', $filters['account_id']);
        }
        if (!empty($filters['from'])) {
            $q->whereDate('date', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $q->whereDate('date', '<=', $filters['to']);
        }
        $q->orderBy('date', 'desc')->orderBy('id', 'desc');
        return $q->paginate($perPage);
    }

    public function getPendingForWorkspace(int $workspaceId): Collection
    {
        return Transaction::forWorkspace($workspaceId)->draft()->with(['category'])->orderBy('date', 'desc')->get();
    }

    public function findById(int $id, int $workspaceId): ?Transaction
    {
        return Transaction::where('id', $id)->where('workspace_id', $workspaceId)->first();
    }

    public function create(array $data): Transaction
    {
        return Transaction::create($data);
    }

    public function update(Transaction $transaction, array $data): Transaction
    {
        $transaction->update($data);
        return $transaction->fresh();
    }

    public function delete(Transaction $transaction): bool
    {
        return $transaction->delete();
    }
}
