<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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

        $liquidTypes = [Account::TYPE_CASH, Account::TYPE_BANK, Account::TYPE_SAVINGS, Account::TYPE_E_WALLET];
        $cashBankBalance = Account::where('workspace_id', $workspaceId)
            ->whereIn('type', $liquidTypes)
            ->sum('balance');

        $creditCards = \App\Models\CreditCard::where('workspace_id', $workspaceId)->get();
        $creditUsage = [];
        foreach ($creditCards as $card) {
            $creditUsage[] = [
                'name' => $card->name,
                'used' => (float) $card->current_balance,
                'available' => (float) ($card->credit_limit - $card->current_balance),
                // Use next payment due date for "DUE IN" label
                'next_reset' => $card->next_payment_due_date->format('Y-m-d'),
                // Optional: last four digits, if the backend later supports it.
                'last_four' => method_exists($card, 'getAttribute') ? ($card->getAttribute('last_four') ?? null) : null,
            ];
        }

        $creditUsed = array_sum(array_column($creditUsage, 'used'));
        $netPosition = $cashBankBalance - $creditUsed;

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
            ]);

        return [
            'cash_bank_balance' => (float) $cashBankBalance,
            'credit_usage' => $creditUsage,
            'net_position' => (float) $netPosition,
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
