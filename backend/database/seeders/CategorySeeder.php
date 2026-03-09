<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Workspace;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $workspace = Workspace::where('slug', 'household')->first();
        if (!$workspace) {
            return;
        }

        $expenseCategories = ['Food', 'Transport', 'Utilities', 'Shopping', 'Entertainment', 'Health', 'Other'];
        foreach ($expenseCategories as $name) {
            Category::firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'name' => $name,
                ],
                ['type' => 'expense']
            );
        }

        Category::firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'name' => 'Salary',
            ],
            ['type' => 'income']
        );
        Category::firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'name' => 'Other Income',
            ],
            ['type' => 'income']
        );
    }
}
