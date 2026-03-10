<?php

namespace App\Services;

use App\Models\Budget;
use App\Repositories\BudgetRepository;

class BudgetService
{
    public function __construct(
        private BudgetRepository $budgetRepository,
        private BudgetSummaryService $budgetSummaryService,
    ) {}

    public function list(int $workspaceId, ?int $month = null, ?int $year = null)
    {
        return $this->budgetRepository->getForWorkspace($workspaceId, $month, $year);
    }

    public function listWithSummaries(int $workspaceId): array
    {
        return $this->budgetSummaryService->listForWorkspace($workspaceId);
    }

    public function store(int $workspaceId, array $data): Budget
    {
        $data['workspace_id'] = $workspaceId;
        $data['currency'] = $data['currency'] ?? 'BRL';
        return $this->budgetRepository->create($data);
    }

    public function show(int $id, int $workspaceId): ?Budget
    {
        return $this->budgetRepository->findById($id, $workspaceId);
    }

    public function update(Budget $budget, array $data): Budget
    {
        return $this->budgetRepository->update($budget, $data);
    }

    public function delete(Budget $budget): bool
    {
        return $this->budgetRepository->delete($budget);
    }
}
