<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    protected $fillable = ['workspace_id', 'name', 'type', 'currency', 'balance'];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:4',
        ];
    }

    public const TYPE_CASH = 'cash';
    public const TYPE_BANK = 'bank';
    public const TYPE_CREDIT_CARD = 'credit_card';
    public const TYPE_SAVINGS = 'savings';
    public const TYPE_INVESTMENT = 'investment';
    public const TYPE_E_WALLET = 'e_wallet';

    public static function types(): array
    {
        return [
            self::TYPE_CASH,
            self::TYPE_BANK,
            self::TYPE_CREDIT_CARD,
            self::TYPE_SAVINGS,
            self::TYPE_INVESTMENT,
            self::TYPE_E_WALLET,
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function creditCards(): HasMany
    {
        return $this->hasMany(CreditCard::class);
    }
}
