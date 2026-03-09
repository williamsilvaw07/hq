<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsappConnection extends Model
{
    protected $table = 'whatsapp_connections';

    protected $fillable = [
        'workspace_id',
        'phone_number',
        'meta_phone_number_id',
        'meta_whatsapp_business_account_id',
        'webhook_verify_token',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function inboundMessages(): HasMany
    {
        return $this->hasMany(InboundMessage::class, 'whatsapp_connection_id');
    }
}
