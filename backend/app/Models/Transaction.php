<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    protected $fillable = [
        'workspace_id',
        'account_id',
        'category_id',
        'created_by_user_id',
        'type',
        'amount',
        'currency',
        'exchange_rate',
        'base_amount',
        'date',
        'description',
        'source',
        'status',
        'inbound_message_id',
        'ai_confidence_score',
        'raw_parsed_payload',
        'confirmed_at',
        'confirmed_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:4',
            'exchange_rate' => 'decimal:8',
            'base_amount' => 'decimal:4',
            'date' => 'date',
            'raw_parsed_payload' => 'array',
            'ai_confidence_score' => 'decimal:4',
            'confirmed_at' => 'datetime',
        ];
    }

    public const SOURCE_WEB_MANUAL = 'web_manual';
    public const SOURCE_WHATSAPP_TEXT = 'whatsapp_text';
    public const SOURCE_WHATSAPP_VOICE = 'whatsapp_voice';
    public const SOURCE_WHATSAPP_IMAGE = 'whatsapp_image';
    public const SOURCE_SYSTEM = 'system';

    public const STATUS_DRAFT = 'draft';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_NEEDS_REVIEW = 'needs_review';

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function confirmedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_user_id');
    }

    public function inboundMessage(): BelongsTo
    {
        return $this->belongsTo(InboundMessage::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TransactionAttachment::class);
    }

    public function scopeForWorkspace($query, $workspaceId)
    {
        return $query->where('workspace_id', $workspaceId);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }
}
