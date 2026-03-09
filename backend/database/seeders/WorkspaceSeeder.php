<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;

class WorkspaceSeeder extends Seeder
{
    public function run(): void
    {
        // Use plain 'password' so the User model's 'hashed' cast hashes it once (avoids double-hash).
        $user1 = User::updateOrCreate(
            ['email' => 'user1@example.com'],
            [
                'name' => 'User One',
                'password' => 'password',
            ]
        );

        $user2 = User::updateOrCreate(
            ['email' => 'user2@example.com'],
            [
                'name' => 'User Two',
                'password' => 'password',
            ]
        );

        $workspace = Workspace::firstOrCreate(
            ['slug' => 'household'],
            ['name' => 'Household']
        );

        $workspace->workspaceUsers()->firstOrCreate(
            ['user_id' => $user1->id],
            ['role' => 'owner']
        );
        $workspace->workspaceUsers()->firstOrCreate(
            ['user_id' => $user2->id],
            ['role' => 'member']
        );
    }
}
