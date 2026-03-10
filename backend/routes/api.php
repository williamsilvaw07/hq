<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CreditCardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationAcceptController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\Webhooks\WhatsAppWebhookController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\WorkspaceMemberController;
use Illuminate\Support\Facades\Route;

Route::get('/webhooks/whatsapp', [WhatsAppWebhookController::class, 'verify']);
Route::post('/webhooks/whatsapp', [WhatsAppWebhookController::class, 'inbound']);

Route::post('/login', LoginController::class);
Route::post('/register', RegisterController::class);
Route::post('/forgot-password', ForgotPasswordController::class);
Route::post('/reset-password', ResetPasswordController::class);

Route::get('/invitations/accept', [InvitationAcceptController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Illuminate\Http\Request $request) {
        return response()->json(['data' => $request->user()->only('id', 'name', 'email', 'avatar_url')]);
    });
    Route::patch('/user', [ProfileController::class, 'update']);
    Route::post('/user/password', [ProfileController::class, 'changePassword']);
    Route::post('/user/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('/logout', LogoutController::class);
    Route::post('/invitations/accept', [InvitationAcceptController::class, 'accept']);

    Route::apiResource('workspaces', WorkspaceController::class);

    Route::middleware('workspace:workspace')->group(function () {
        Route::get('workspaces/{workspace}/dashboard', DashboardController::class);
        Route::apiResource('workspaces.accounts', AccountController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::get('workspaces/{workspace}/credit-cards', [CreditCardController::class, 'index']);
        Route::post('workspaces/{workspace}/credit-cards', [CreditCardController::class, 'store']);
        Route::patch('workspaces/{workspace}/credit-cards/{credit_card}', [CreditCardController::class, 'update']);
        Route::apiResource('workspaces.categories', CategoryController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::get('workspaces/{workspace}/transactions/pending', [TransactionController::class, 'pending']);
        Route::apiResource('workspaces.transactions', TransactionController::class);
        Route::apiResource('workspaces.budgets', BudgetController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::get('workspaces/{workspace}/members', [WorkspaceMemberController::class, 'index']);
        Route::post('workspaces/{workspace}/members/invite', [WorkspaceMemberController::class, 'invite']);
        Route::get('workspaces/{workspace}/invitations', [WorkspaceMemberController::class, 'pendingInvitations']);
        Route::delete('workspaces/{workspace}/invitations/{invitation}', [WorkspaceMemberController::class, 'revokeInvitation']);
        Route::patch('workspaces/{workspace}/members/{member}', [WorkspaceMemberController::class, 'updateRole']);
        Route::delete('workspaces/{workspace}/members/{member}', [WorkspaceMemberController::class, 'removeMember']);
    });
});
