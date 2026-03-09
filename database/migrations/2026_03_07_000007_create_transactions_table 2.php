<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type'); // income, expense
            $table->decimal('amount', 18, 4);
            $table->string('currency', 3)->default('BRL');
            $table->decimal('exchange_rate', 18, 8)->default(1);
            $table->decimal('base_amount', 18, 4);
            $table->date('date');
            $table->string('description')->nullable();
            $table->string('source'); // web_manual, whatsapp_text, whatsapp_voice, whatsapp_image, system
            $table->string('status'); // draft, confirmed, needs_review
            $table->unsignedBigInteger('inbound_message_id')->nullable();
            $table->decimal('ai_confidence_score', 5, 4)->nullable();
            $table->json('raw_parsed_payload')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('confirmed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
