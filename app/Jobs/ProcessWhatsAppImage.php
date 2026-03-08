<?php

namespace App\Jobs;

use App\Models\InboundMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessWhatsAppImage implements ShouldQueue
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

        // Phase 5: Download image from Meta, optional store in R2, call OpenAI Vision for receipt OCR,
        // save extracted_text, then dispatch ParseTransactionWithAI.
        // Stub: mark as processed for now.
        Log::info('ProcessWhatsAppImage: would run OCR for message ' . $this->inboundMessageId);

        $message->update(['processed_at' => now()]);
    }
}
