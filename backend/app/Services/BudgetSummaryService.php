<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\Transaction;

class BudgetSummaryService
{
    public function __construct(
        private BudgetPeriodService $periodService,
    ) {}

    public function listForWorkspace(int $workspaceId): array
    {
        $budgets = Budget::where('workspace_id', $workspaceId)
            ->with('category')
            ->get();

        $result = [];

        foreach ($budgets as $budget) {
            $period = $this->periodService->getCurrentPeriod($budget);
            $start = $period['start']->toDateString();
            $end = $period['end']->toDateString();
            $nextReset = $period['next_reset']->toDateString();

            $spent = (float) Transaction::where('workspace_id', $workspaceId)
                ->where('status', Transaction::STATUS_CONFIRMED)
                ->where('type', 'expense')
                ->where('category_id', $budget->category_id)
                ->whereBetween('date', [$start, $end])
                ->sum('base_amount');

            $amount = (float) $budget->amount;
            $remaining = max(0, $amount - $spent);
            $pct = $amount > 0 ? min(100, ($spent / $amount) * 100) : 0;

            $result[] = [
                'id' => $budget->id,
                'category' => $budget->category ? [
                    'id' => $budget->category->id,
                    'name' => $budget->category->name,
                    'icon' => $budget->category->icon,
                    'color' => $budget->category->color,
                ] : null,
                'amount' => $amount,
                'currency' => $budget->currency,
                'period_type' => $budget->period_type,
                'period_interval' => $budget->period_interval,
                'current_period_start' => $start,
                'current_period_end' => $end,
                'next_reset_date' => $nextReset,
                'spent' => $spent,
                'remaining' => $remaining,
                'spent_percentage' => $pct,
            ];
        }

        return $result;
    }
}

