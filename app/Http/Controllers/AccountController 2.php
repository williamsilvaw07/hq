<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\CreditCard;
use App\Services\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(
        private AccountService $accountService
    ) {}

    public function index(Request $request, int $workspace): JsonResponse
    {
        $accounts = $this->accountService->list($workspace);
        $creditCards = $this->accountService->listCreditCards($workspace);
        return response()->json([
            'data' => [
                'accounts' => $accounts,
                'credit_cards' => $creditCards,
            ],
        ]);
    }

    public function store(Request $request, int $workspace): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:' . implode(',', Account::types()),
            'currency' => 'nullable|string|size:3',
            'balance' => 'nullable|numeric',
        ]);
        $data = $request->only('name', 'type', 'currency', 'balance');
        $data['currency'] = $data['currency'] ?? 'BRL';
        $account = $this->accountService->store($workspace, $data);
        return response()->json(['data' => $account], 201);
    }

    public function show(Request $request, int $workspace, int $id): JsonResponse
    {
        $account = $this->accountService->show($id, $workspace);
        if (!$account) {
            return response()->json(['message' => 'Account not found.'], 404);
        }
        return response()->json(['data' => $account]);
    }

    public function update(Request $request, int $workspace, int $id): JsonResponse
    {
        $account = $this->accountService->show($id, $workspace);
        if (!$account) {
            return response()->json(['message' => 'Account not found.'], 404);
        }
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:' . implode(',', Account::types()),
            'currency' => 'sometimes|string|size:3',
            'balance' => 'sometimes|numeric',
        ]);
        $account = $this->accountService->update($account, $request->only('name', 'type', 'currency', 'balance'));
        return response()->json(['data' => $account]);
    }

    public function destroy(Request $request, int $workspace, int $id): JsonResponse
    {
        $account = $this->accountService->show($id, $workspace);
        if (!$account) {
            return response()->json(['message' => 'Account not found.'], 404);
        }
        $this->accountService->delete($account);
        return response()->json(null, 204);
    }
}
