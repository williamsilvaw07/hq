<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionService $transactionService
    ) {}

    public function index(Request $request, int $workspace): JsonResponse
    {
        $filters = $request->only('status', 'type', 'search', 'category_id', 'from', 'to');
        $perPage = min((int) $request->get('per_page', 15), 100);
        $result = $this->transactionService->list($workspace, $filters, $perPage);
        return response()->json($result);
    }

    public function pending(Request $request, int $workspace): JsonResponse
    {
        $list = $this->transactionService->listPending($workspace);
        return response()->json(['data' => $list]);
    }

    public function show(Request $request, int $workspace, int $id): JsonResponse
    {
        $transaction = $this->transactionService->show($id, $workspace);
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found.'], 404);
        }
        return response()->json(['data' => $transaction->load(['account', 'category'])]);
    }

    public function store(Request $request, int $workspace): JsonResponse
    {
        $request->validate([
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')->where('workspace_id', $workspace),
            ],
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric',
            'currency' => 'nullable|string|size:3',
            'date' => 'required|date',
            'description' => 'nullable|string|max:500',
            'status' => 'nullable|in:draft,confirmed',
        ]);
        $data = $request->only(
            'category_id', 'type', 'amount', 'currency', 'date', 'description', 'status'
        );
        $data['currency'] = $data['currency'] ?? 'BRL';
        $data['exchange_rate'] = 1;
        $data['base_amount'] = $data['amount'];
        $data['source'] = Transaction::SOURCE_WEB_MANUAL;
        $data['status'] = $data['status'] ?? Transaction::STATUS_CONFIRMED;
        $transaction = $this->transactionService->store($workspace, $request->user()->id, $data);
        return response()->json(['data' => $transaction], 201);
    }

    public function update(Request $request, int $workspace, int $id): JsonResponse
    {
        $transaction = $this->transactionService->show($id, $workspace);
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found.'], 404);
        }
        $request->validate([
            'category_id' => [
                'sometimes',
                'integer',
                Rule::exists('categories', 'id')->where('workspace_id', $workspace),
            ],
            'type' => 'sometimes|in:income,expense',
            'amount' => 'sometimes|numeric',
            'currency' => 'nullable|string|size:3',
            'date' => 'sometimes|date',
            'description' => 'nullable|string|max:500',
            'status' => 'sometimes|in:draft,confirmed,needs_review',
        ]);
        $data = $request->only(
            'category_id', 'type', 'amount', 'currency', 'date', 'description', 'status'
        );
        $transaction = $this->transactionService->update(
            $transaction,
            $data,
            $request->user()->id
        );
        return response()->json(['data' => $transaction]);
    }

    public function destroy(Request $request, int $workspace, int $id): JsonResponse
    {
        $transaction = $this->transactionService->show($id, $workspace);
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found.'], 404);
        }
        $this->transactionService->delete($transaction);
        return response()->json(null, 204);
    }
}
