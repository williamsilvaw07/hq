<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->string('period_type', 20)->default('month')->after('year'); // day, week, month, year
            $table->unsignedTinyInteger('period_interval')->default(1)->after('period_type'); // e.g. 1 = every 1 month, 2 = every 2 weeks
            $table->date('start_date')->nullable()->after('period_interval');
        });
    }

    public function down(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropColumn(['period_type', 'period_interval', 'start_date']);
        });
    }
};
