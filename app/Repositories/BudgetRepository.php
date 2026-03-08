<?php

namespace App\Repositories;

use App\Models\Budget;
use Illuminate\Database\Eloquent\Collection;

class BudgetRepository
{
    public function getForWorkspace(int $workspaceId, ?int $month = null, ?int $year = null): Collection
    {
        $q = Budget::where('workspace_id', $workspaceId)->with('category');
        if ($month !== null) {
            $q->where('month', $month);
        }
        if ($year !== null) {
            $q->where('year', $year);
        }
        return $q->orderBy('month')->orderBy('year')->get();
    }

    public function findById(int $id, int $workspaceId): ?Budget
    {
        return Budget::where('id', $id)->where('workspace_id', $workspaceId)->first();
    }

    public function create(array $data): Budget
    {
        return Budget::create($data);
    }

    public function update(Budget $budget, array $data): Budget
    {
        $budget->update($data);
        return $budget->fresh();
    }

    public function delete(Budget $budget): bool
    {
        return $budget->delete();
    }
}
