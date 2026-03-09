<?php

namespace App\Services;

use App\Models\Category;

/**
 * AI parser: input text -> structured DTO.
 * Never writes to DB. Returns array with type, amount, currency, category, date, description, confidence_score.
 */
class TransactionParserService
{
    public function parse(string $text): ?array
    {
        $text = trim($text);
        if ($text === '') {
            return null;
        }

        // Stub: minimal parsing. In Phase 6 replace with OpenAI call + JSON schema.
        // Expected return: type, amount, currency, category (string), date (Y-m-d), description, confidence_score
        if (preg_match('/\d+[\.,]?\d*/', $text, $amountMatch)) {
            $amount = (float) str_replace(',', '.', $amountMatch[0]);
            $isIncome = preg_match('/\b(income|recebi|received|salary|salário)\b/i', $text) === 1;
            return [
                'type' => $isIncome ? 'income' : 'expense',
                'amount' => $amount,
                'currency' => 'BRL',
                'category' => 'Other',
                'date' => now()->format('Y-m-d'),
                'description' => mb_substr($text, 0, 200),
                'confidence_score' => 0.7,
            ];
        }

        return null;
    }

    /**
     * Map category string to category_id for workspace. Fuzzy or default.
     */
    public function resolveCategoryId(int $workspaceId, string $categoryName): ?int
    {
        $category = Category::where('workspace_id', $workspaceId)
            ->where('type', 'expense')
            ->whereRaw('LOWER(name) = ?', [strtolower(trim($categoryName))])
            ->first();

        if ($category) {
            return $category->id;
        }

        $default = Category::where('workspace_id', $workspaceId)
            ->where('type', 'expense')
            ->orderBy('id')
            ->first();

        return $default?->id;
    }
}
