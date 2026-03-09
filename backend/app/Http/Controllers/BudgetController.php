<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function __construct(
        private BudgetService $budgetService
    ) {}

    public function index(Request $request, int $workspace): JsonResponse
    {
        $month = $request->has('month') ? (int) $request->get('month') : null;
        $year = $request->has('year') ? (int) $request->get('year') : null;
        $budgets = $this->budgetService->list($workspace, $month, $year);
        return response()->json(['data' => $budgets]);
    }

    public function store(Request $request, int $workspace): JsonResponse
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2100',
            'period_type' => 'nullable|string|in:day,week,month,year',
            'period_interval' => 'nullable|integer|min:1|max:12',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
        ]);
        $data = $request->only('category_id', 'month', 'year', 'amount', 'currency');
        $data['period_type'] = $request->input('period_type', 'month');
        $data['period_interval'] = $request->input('period_interval', 1);
        $budget = $this->budgetService->store($workspace, $data);
        return response()->json(['data' => $budget], 201);
    }

    public function show(Request $request, int $workspace, int $id): JsonResponse
    {
        $budget = $this->budgetService->show($id, $workspace);
        if (!$budget) {
            return response()->json(['message' => 'Budget not found.'], 404);
        }
        return response()->json(['data' => $budget]);
    }

    public function update(Request $request, int $workspace, int $id): JsonResponse
    {
        $budget = $this->budgetService->show($id, $workspace);
        if (!$budget) {
            return response()->json(['message' => 'Budget not found.'], 404);
        }
        $request->validate([
            'month' => 'sometimes|integer|min:1|max:12',
            'year' => 'sometimes|integer|min:2020|max:2100',
            'period_type' => 'sometimes|string|in:day,week,month,year',
            'period_interval' => 'sometimes|integer|min:1|max:12',
            'amount' => 'sometimes|numeric|min:0',
        ]);
        $budget = $this->budgetService->update($budget, $request->only('month', 'year', 'period_type', 'period_interval', 'amount'));
        return response()->json(['data' => $budget]);
    }

    public function destroy(Request $request, int $workspace, int $id): JsonResponse
    {
        $budget = $this->budgetService->show($id, $workspace);
        if (!$budget) {
            return response()->json(['message' => 'Budget not found.'], 404);
        }
        $this->budgetService->delete($budget);
        return response()->json(null, 204);
    }
}
