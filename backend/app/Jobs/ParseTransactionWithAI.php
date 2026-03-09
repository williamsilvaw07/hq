<?php

namespace App\Jobs;

use App\Models\InboundMessage;
use App\Services\TransactionService;
use App\Services\TransactionParserService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ParseTransactionWithAI implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $inboundMessageId
    ) {}

    public function handle(TransactionParserService $parserService, TransactionService $transactionService): void
    {
        $message = InboundMessage::find($this->inboundMessageId);
        if (!$message) {
            return;
        }

        $text = $message->extracted_text ?? '';
        if ($text === '') {
            $message->update(['processed_at' => now()]);
            return;
        }

        $workspaceId = $message->whatsappConnection->workspace_id;

        try {
            $parsed = $parserService->parse($text);
            if (!$parsed) {
                $message->update(['processed_at' => now()]);
                return;
            }

            $source = $message->type === 'audio'
                ? \App\Models\Transaction::SOURCE_WHATSAPP_VOICE
                : ($message->type === 'image'
                    ? \App\Models\Transaction::SOURCE_WHATSAPP_IMAGE
                    : \App\Models\Transaction::SOURCE_WHATSAPP_TEXT);

            $transactionService->createDraftFromWhatsApp(
                $workspaceId,
                $parsed,
                $message->id,
                $source
            );

            $message->update(['processed_at' => now()]);

            // TODO: SendWhatsAppReply job to send "Confirm / Edit" to user
        } catch (\Throwable $e) {
            Log::error('ParseTransactionWithAI failed: ' . $e->getMessage());
        }
    }
}
