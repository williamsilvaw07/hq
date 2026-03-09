<?php

namespace App\Jobs;

use App\Models\InboundMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessWhatsAppAudio implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $inboundMessageId
    ) {}

    public function handle(): void
    {
        $message = InboundMessage::find($this->inboundMessageId);
        if (!$message) {
            return;
        }

        // Phase 5: Download media from Meta, store in R2/S3, call OpenAI Whisper,
        // save extracted_text on inbound_messages, then dispatch ParseTransactionWithAI.
        // Stub: mark as processed and dispatch parser with empty text for now.
        Log::info('ProcessWhatsAppAudio: would run STT for message ' . $this->inboundMessageId);

        $message->update(['processed_at' => now()]);
    }
}
