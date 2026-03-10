<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->boolean('include_in_net_balance')->default(true)->after('balance');
        });

        // Default behavior for existing accounts:
        // - Bank & savings accounts → included (true, already default)
        // - Credit card accounts → excluded (false)
        DB::table('accounts')
            ->where('type', 'credit_card')
            ->update(['include_in_net_balance' => false]);
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('include_in_net_balance');
        });
    }
};

