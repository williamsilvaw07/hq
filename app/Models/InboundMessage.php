<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class InboundMessage extends Model
{
    protected $fillable = [
        'whatsapp_connection_id',
        'from_phone',
        'message_id',
        'message_direction',
        'type',
        'raw_payload',
        'extracted_text',
        'processed_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'raw_payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public const DIRECTION_INBOUND = 'inbound';
    public const DIRECTION_OUTBOUND = 'outbound';

    public function whatsappConnection(): BelongsTo
    {
        return $this->belongsTo(WhatsappConnection::class);
    }

    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class);
    }
}
