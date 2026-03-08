<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    public function __invoke(Request $request, int $workspace): JsonResponse
    {
        $period = $request->query('period');
        $data = $this->dashboardService->getData($workspace, $period);
        return response()->json(['data' => $data]);
    }
}
