<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditCard extends Model
{
    protected $fillable = [
        'workspace_id',
        'account_id',
        'name',
        'credit_limit',
        'current_balance',
        'billing_cycle_start_day',
        'payment_due_day',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:4',
            'current_balance' => 'decimal:4',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function getAvailableCreditAttribute(): float
    {
        return (float) ($this->credit_limit - $this->current_balance);
    }

    public function getNextBillingCycleResetDateAttribute(): Carbon
    {
        $today = Carbon::today();
        $day = (int) $this->billing_cycle_start_day;
        $next = $today->copy()->day($day);
        if ($next->lte($today)) {
            $next->addMonth();
        }
        return $next;
    }

    public function getNextPaymentDueDateAttribute(): Carbon
    {
        $today = Carbon::today();
        $day = (int) $this->payment_due_day;
        $next = $today->copy()->day($day);
        if ($next->lte($today)) {
            $next->addMonth();
        }
        return $next;
    }
}
