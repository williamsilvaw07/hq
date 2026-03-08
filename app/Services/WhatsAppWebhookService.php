<?php

namespace App\Services;

use App\Jobs\ProcessInboundWhatsAppMessage;
use App\Models\InboundMessage;
use App\Repositories\InboundMessageRepository;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookService
{
    public function __construct(
        private InboundMessageRepository $inboundMessageRepository
    ) {}

    /**
     * Verify Meta webhook subscription. Returns challenge string if valid, null otherwise.
     */
    public function verifySubscription(string $mode, string $token, ?string $challenge): ?string
    {
        $verifyToken = config('services.whatsapp.verify_token', env('WHATSAPP_VERIFY_TOKEN'));

        if ($mode === 'subscribe' && $token === $verifyToken && $challenge !== null && $challenge !== '') {
            return $challenge;
        }

        return null;
    }

    /**
     * Process inbound webhook payload: extract messages, store new ones, dispatch job for each.
     */
    public function processInboundPayload(array $payload): void
    {
        if (($payload['object'] ?? '') !== 'whatsapp_business_account') {
            return;
        }

        $entries = $payload['entry'] ?? [];
        foreach ($entries as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? '') !== 'messages') {
                    continue;
                }
                $value = $change['value'] ?? [];
                $messages = $value['messages'] ?? [];
                $metadata = $value['metadata'] ?? [];
                $phoneNumberId = $metadata['phone_number_id'] ?? null;

                $connection = $this->inboundMessageRepository->findConnectionByPhoneNumberId($phoneNumberId);
                if (!$connection) {
                    Log::warning('WhatsApp webhook: no connection found for phone_number_id', [
                        'phone_number_id' => $phoneNumberId,
                    ]);
                    continue;
                }

                foreach ($messages as $message) {
                    $this->storeAndDispatchMessage($connection->id, $message);
                }
            }
        }
    }

    private function storeAndDispatchMessage(int $whatsappConnectionId, array $message): void
    {
        $messageId = $message['id'] ?? null;
        if ($messageId === null || $messageId === '') {
            return;
        }

        $type = $message['type'] ?? 'text';
        $from = (string) ($message['from'] ?? '');
        $extractedText = null;
        if ($type === 'text') {
            $extractedText = $message['text']['body'] ?? null;
        }

        $data = [
            'whatsapp_connection_id' => $whatsappConnectionId,
            'from_phone' => $from,
            'message_id' => $messageId,
            'type' => $type,
            'raw_payload' => $message,
            'extracted_text' => $extractedText,
            'processed_at' => null,
            'status' => null,
        ];

        $stored = $this->inboundMessageRepository->storeIfNew($data);
        if ($stored !== null) {
            ProcessInboundWhatsAppMessage::dispatch($stored->id);
        }
    }
}
