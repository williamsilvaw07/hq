<?php

namespace App\Http\Controllers;

use App\Services\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreditCardController extends Controller
{
    public function __construct(
        private AccountService $accountService
    ) {}

    public function index(Request $request, int $workspace): JsonResponse
    {
        $cards = $this->accountService->listCreditCards($workspace);
        return response()->json(['data' => $cards]);
    }

    public function store(Request $request, int $workspace): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'account_id' => 'nullable|exists:accounts,id',
            'credit_limit' => 'required|numeric|min:0',
            'current_balance' => 'nullable|numeric|min:0',
            'billing_cycle_start_day' => 'required|integer|min:1|max:31',
            'payment_due_day' => 'required|integer|min:1|max:31',
            'currency' => 'nullable|string|size:3',
        ]);
        $data = $request->only(
            'name', 'account_id', 'credit_limit', 'current_balance',
            'billing_cycle_start_day', 'payment_due_day', 'currency'
        );
        $data['current_balance'] = $data['current_balance'] ?? 0;
        $data['currency'] = $data['currency'] ?? 'BRL';
        $card = $this->accountService->storeCreditCard($workspace, $data);
        return response()->json(['data' => $card], 201);
    }

    public function update(Request $request, int $workspace, int $id): JsonResponse
    {
        $card = $this->accountService->findCreditCard($id, $workspace);
        if (!$card) {
            return response()->json(['message' => 'Credit card not found.'], 404);
        }
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'credit_limit' => 'sometimes|numeric|min:0',
            'current_balance' => 'sometimes|numeric|min:0',
            'billing_cycle_start_day' => 'sometimes|integer|min:1|max:31',
            'payment_due_day' => 'sometimes|integer|min:1|max:31',
        ]);
        $card = $this->accountService->updateCreditCard($card, $request->only(
            'name', 'credit_limit', 'current_balance', 'billing_cycle_start_day', 'payment_due_day'
        ));
        return response()->json(['data' => $card]);
    }
}
