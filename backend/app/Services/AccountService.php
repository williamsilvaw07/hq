<?php

namespace App\Services;

use App\Models\Account;
use App\Repositories\AccountRepository;
use App\Repositories\CreditCardRepository;

class AccountService
{
    public function __construct(
        private AccountRepository $accountRepository,
        private CreditCardRepository $creditCardRepository
    ) {}

    public function list(int $workspaceId)
    {
        return $this->accountRepository->getForWorkspace($workspaceId);
    }

    public function store(int $workspaceId, array $data): Account
    {
        $data['workspace_id'] = $workspaceId;
        $data['balance'] = $data['balance'] ?? 0;
        // Default behavior:
        // - Bank & savings accounts → included in net balance
        // - Credit card accounts → excluded by default
        if (!array_key_exists('include_in_net_balance', $data)) {
            $data['include_in_net_balance'] = $data['type'] !== Account::TYPE_CREDIT_CARD;
        }
        return $this->accountRepository->create($data);
    }

    public function show(int $id, int $workspaceId): ?Account
    {
        return $this->accountRepository->findById($id, $workspaceId);
    }

    public function update(Account $account, array $data): Account
    {
        return $this->accountRepository->update($account, $data);
    }

    public function delete(Account $account): bool
    {
        return $this->accountRepository->delete($account);
    }

    public function listCreditCards(int $workspaceId)
    {
        return $this->creditCardRepository->getForWorkspace($workspaceId);
    }

    public function findCreditCard(int $id, int $workspaceId)
    {
        return $this->creditCardRepository->findById($id, $workspaceId);
    }

    public function storeCreditCard(int $workspaceId, array $data)
    {
        $data['workspace_id'] = $workspaceId;
        return $this->creditCardRepository->create($data);
    }

    public function updateCreditCard($card, array $data)
    {
        return $this->creditCardRepository->update($card, $data);
    }

    public function deleteCreditCard($card): bool
    {
        return $this->creditCardRepository->delete($card);
    }
}
