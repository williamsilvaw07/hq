<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->decimal('credit_limit', 18, 4)->default(0);
            $table->decimal('current_balance', 18, 4)->default(0);
            $table->unsignedTinyInteger('billing_cycle_start_day'); // 1-31
            $table->unsignedTinyInteger('payment_due_day'); // 1-31
            $table->string('currency', 3)->default('BRL');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_cards');
    }
};
