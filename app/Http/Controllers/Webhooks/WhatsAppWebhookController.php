<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WhatsAppWebhookController extends Controller
{
    public function __construct(
        private WhatsAppWebhookService $webhookService
    ) {}

    /**
     * GET: Meta webhook verification (hub.mode, hub.verify_token, hub.challenge).
     */
    public function verify(Request $request): Response
    {
        $challenge = $this->webhookService->verifySubscription(
            (string) $request->query('hub_mode'),
            (string) $request->query('hub_verify_token'),
            $request->query('hub_challenge'),
        );

        if ($challenge !== null) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Forbidden'], 403);
    }

    /**
     * POST: Inbound events. Store messages and dispatch job; return immediately.
     */
    public function inbound(Request $request): JsonResponse
    {
        $this->webhookService->processInboundPayload($request->all());

        return response()->json(['ok' => true]);
    }
}
