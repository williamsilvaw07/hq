<?php

namespace App\Repositories;

use App\Models\InboundMessage;
use App\Models\WhatsappConnection;

class InboundMessageRepository
{
    /**
     * Find WhatsApp connection by Meta phone_number_id from webhook payload.
     */
    public function findConnectionByPhoneNumberId(?string $phoneNumberId): ?WhatsappConnection
    {
        if ($phoneNumberId !== null && $phoneNumberId !== '') {
            return WhatsappConnection::where('meta_phone_number_id', $phoneNumberId)->first();
        }

        return WhatsappConnection::first();
    }

    /**
     * Store an inbound message only if message_id is not already present (duplicate protection).
     * Returns the created InboundMessage, or null if duplicate.
     */
    public function storeIfNew(array $data): ?InboundMessage
    {
        $messageId = $data['message_id'] ?? null;
        if ($messageId === null || $messageId === '') {
            return null;
        }

        if (InboundMessage::where('message_id', $messageId)->exists()) {
            return null;
        }

        return InboundMessage::create(array_merge($data, [
            'message_direction' => InboundMessage::DIRECTION_INBOUND,
        ]));
    }
}
