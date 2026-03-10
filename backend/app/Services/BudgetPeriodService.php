<?php

namespace App\Services;

use App\Models\Budget;
use Carbon\Carbon;

class BudgetPeriodService
{
    /** @return array{start: Carbon, end: Carbon, next_reset: Carbon} */
    public function getCurrentPeriod(Budget $budget, ?Carbon $now = null): array
    {
        $now = $now ?: Carbon::now();

        $type = $budget->period_type ?? 'month';
        $interval = (int) ($budget->period_interval ?? 1);

        if ($type === 'week') {
            $start = $now->copy()->startOfWeek(Carbon::MONDAY);
            $end = $now->copy()->endOfWeek(Carbon::SUNDAY);
            $nextReset = $end->copy()->addDay()->startOfDay();

            return ['start' => $start, 'end' => $end, 'next_reset' => $nextReset];
        }

        if ($type === 'month' && $interval === 3 && $budget->start_date) {
            $anchor = Carbon::parse($budget->start_date)->startOfDay();
            if ($now->lt($anchor)) {
                $start = $anchor->copy();
                $end = $anchor->copy()->addMonthsNoOverflow(3)->subDay();
                $nextReset = $end->copy()->addDay();

                return ['start' => $start, 'end' => $end, 'next_reset' => $nextReset];
            }

            $periodStart = $anchor->copy();
            while ($periodStart->addMonthsNoOverflow(3)->lte($now)) {
                // loop body intentionally empty; $periodStart is advanced
            }
            $periodStart = $periodStart->copy()->subMonthsNoOverflow(3);
            $start = $periodStart->copy();
            $end = $start->copy()->addMonthsNoOverflow(3)->subDay();
            $nextReset = $end->copy()->addDay();

            return ['start' => $start, 'end' => $end, 'next_reset' => $nextReset];
        }

        $start = $now->copy()->startOfMonth();
        $end = $now->copy()->endOfMonth();
        $nextReset = $end->copy()->addDay()->startOfDay();

        return ['start' => $start, 'end' => $end, 'next_reset' => $nextReset];
    }
}

