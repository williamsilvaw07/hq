<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('demo:reset-password', function () {
    $emails = ['user1@example.com', 'user2@example.com'];
    foreach ($emails as $email) {
        $user = User::where('email', $email)->first();
        if ($user) {
            $user->password = 'password';
            $user->save();
            $this->info("Reset password for {$email} to 'password'.");
        } else {
            $this->warn("User {$email} not found. Run: php artisan db:seed --class=WorkspaceSeeder");
        }
    }
})->purpose('Reset demo users (user1@example.com, user2@example.com) password to "password"');
