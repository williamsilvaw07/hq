<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inbound_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_connection_id')->constrained()->cascadeOnDelete();
            $table->string('from_phone');
            $table->string('message_id')->unique(); // Meta message ID - UNIQUE for idempotency
            $table->string('message_direction'); // inbound, outbound
            $table->string('type')->nullable(); // text, image, audio
            $table->json('raw_payload')->nullable();
            $table->text('extracted_text')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inbound_messages');
    }
};
