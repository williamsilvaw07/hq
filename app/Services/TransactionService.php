<?php

namespace App\Services;

use App\Models\Transaction;
use App\Repositories\TransactionRepository;
use App\Services\TransactionParserService;

class TransactionService
{
    public function __construct(
        private TransactionRepository $transactionRepository
    ) {}

    public function list(int $workspaceId, array $filters = [], int $perPage = 15)
    {
        return $this->transactionRepository->getForWorkspace($workspaceId, $filters, $perPage);
    }

    public function listPending(int $workspaceId)
    {
        return $this->transactionRepository->getPendingForWorkspace($workspaceId);
    }

    public function show(int $id, int $workspaceId): ?Transaction
    {
        return $this->transactionRepository->findById($id, $workspaceId);
    }

    public function store(int $workspaceId, int $userId, array $data): Transaction
    {
        $data['workspace_id'] = $workspaceId;
        $data['created_by_user_id'] = $userId;
        $data['source'] = $data['source'] ?? Transaction::SOURCE_WEB_MANUAL;
        $data['status'] = $data['status'] ?? Transaction::STATUS_CONFIRMED;
        $data['exchange_rate'] = $data['exchange_rate'] ?? 1;
        $data['base_amount'] = $data['base_amount'] ?? $data['amount'];
        return $this->transactionRepository->create($data);
    }

    public function update(Transaction $transaction, array $data, ?int $confirmedByUserId = null): Transaction
    {
        if (isset($data['status']) && $data['status'] === Transaction::STATUS_CONFIRMED) {
            $data['confirmed_at'] = $data['confirmed_at'] ?? now();
            $data['confirmed_by_user_id'] = $confirmedByUserId ?? $transaction->created_by_user_id;
        }
        return $this->transactionRepository->update($transaction, $data);
    }

    public function delete(Transaction $transaction): bool
    {
        return $this->transactionRepository->delete($transaction);
    }

    public function createDraftFromWhatsApp(
        int $workspaceId,
        array $parsed,
        int $inboundMessageId,
        string $source
    ): Transaction {
        $categoryId = app(TransactionParserService::class)->resolveCategoryId(
            $workspaceId,
            $parsed['category'] ?? 'Other'
        );

        $date = $parsed['date'] ?? now()->format('Y-m-d');
        if (is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 0) {
            $date = now()->format('Y-m-d');
        }

        $data = [
            'workspace_id' => $workspaceId,
            'account_id' => null,
            'category_id' => $categoryId,
            'created_by_user_id' => null,
            'type' => $parsed['type'] ?? 'expense',
            'amount' => (float) ($parsed['amount'] ?? 0),
            'currency' => $parsed['currency'] ?? 'BRL',
            'exchange_rate' => 1,
            'base_amount' => (float) ($parsed['amount'] ?? 0),
            'date' => $date,
            'description' => $parsed['description'] ?? null,
            'source' => $source,
            'status' => Transaction::STATUS_DRAFT,
            'inbound_message_id' => $inboundMessageId,
            'ai_confidence_score' => $parsed['confidence_score'] ?? null,
            'raw_parsed_payload' => $parsed,
        ];

        return $this->transactionRepository->create($data);
    }
}
