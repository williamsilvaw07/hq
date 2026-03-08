<?php

namespace App\Jobs;

use App\Models\InboundMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessInboundWhatsAppMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $inboundMessageId
    ) {}

    public function handle(): void
    {
        $message = InboundMessage::find($this->inboundMessageId);
        if (!$message || $message->processed_at) {
            return;
        }

        $type = $message->type ?? 'text';

        if ($type === 'audio') {
            ProcessWhatsAppAudio::dispatch($message->id);
            return;
        }

        if ($type === 'image') {
            ProcessWhatsAppImage::dispatch($message->id);
            return;
        }

        if ($type === 'text' && $message->extracted_text) {
            ParseTransactionWithAI::dispatch($message->id);
            return;
        }

        $message->update(['processed_at' => now()]);
    }
}
