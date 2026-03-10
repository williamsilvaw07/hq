<?php

namespace App\Services;

use App\Models\Transaction;
use Carbon\Carbon;

class DashboardService
{
    public const PERIOD_TODAY = 'today';
    public const PERIOD_THIS_WEEK = 'this_week';
    public const PERIOD_LAST_WEEK = 'last_week';
    public const PERIOD_THIS_MONTH = 'this_month';

    public function getData(int $workspaceId, ?string $period = null): array
    {
        $period = $this->normalizePeriod($period);
        [$start, $end] = $this->dateRangeForPeriod($period);

        $periodQuery = Transaction::where('workspace_id', $workspaceId)
            ->where('status', Transaction::STATUS_CONFIRMED)
            ->whereBetween('date', [$start, $end]);
        $periodIncome = (clone $periodQuery)->where('type', 'income')->sum('base_amount');
        $periodExpense = (clone $periodQuery)->where('type', 'expense')->sum('base_amount');

        $recent = Transaction::where('workspace_id', $workspaceId)
            ->whereBetween('date', [$start, $end])
            ->with(['category'])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'amount' => $t->amount,
                'currency' => $t->currency,
                'date' => $t->date->format('Y-m-d'),
                'description' => $t->description,
                'status' => $t->status,
                'category' => $t->category ? [
                    'id' => $t->category->id,
                    'name' => $t->category->name,
                ] : null,
            ]);

        return [
            'period' => $period,
            'period_income' => (float) $periodIncome,
            'period_expense' => (float) $periodExpense,
            'recent_transactions' => $recent,
        ];
    }

    private function normalizePeriod(?string $period): string
    {
        $allowed = [self::PERIOD_TODAY, self::PERIOD_THIS_WEEK, self::PERIOD_LAST_WEEK, self::PERIOD_THIS_MONTH];
        return $period && in_array($period, $allowed, true) ? $period : self::PERIOD_THIS_MONTH;
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function dateRangeForPeriod(string $period): array
    {
        $now = Carbon::now();

        return match ($period) {
            self::PERIOD_TODAY => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            self::PERIOD_THIS_WEEK => [
                $now->copy()->startOfWeek(Carbon::MONDAY),
                $now->copy()->endOfWeek(Carbon::SUNDAY),
            ],
            self::PERIOD_LAST_WEEK => [
                $now->copy()->subWeek()->startOfWeek(Carbon::MONDAY),
                $now->copy()->subWeek()->endOfWeek(Carbon::SUNDAY),
            ],
            self::PERIOD_THIS_MONTH => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            default => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }
}
