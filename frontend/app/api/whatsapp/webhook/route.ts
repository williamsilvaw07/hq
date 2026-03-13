import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/whatsapp/verify";
import { processWhatsAppMessage } from "@/lib/whatsapp/process-message";

// ---------------------------------------------------------------------------
// GET — Meta webhook verification handshake
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    console.log("[whatsapp] Webhook verified by Meta");
    return new Response(challenge, { status: 200 });
  }

  console.warn("[whatsapp] Webhook verification failed — token mismatch or missing params");
  return new Response("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Inbound messages from Meta
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  console.log("[whatsapp] POST webhook hit from", req.headers.get("user-agent") ?? "unknown");
  // Read raw body for signature verification
  const rawBody = await req.text();
  console.log("[whatsapp] Raw body length:", rawBody.length, "| body preview:", rawBody.slice(0, 200));

  // Verify HMAC signature
  const signature = req.headers.get("x-hub-signature-256");
  console.log("[whatsapp] Signature header:", signature ?? "MISSING");
  if (!verifySignature(rawBody, signature)) {
    console.warn("[whatsapp] Invalid signature — rejecting request");
    return new Response("Forbidden", { status: 403 });
  }
  console.log("[whatsapp] Signature OK");

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Respond to Meta immediately — processing happens async
  // Meta expects a 200 within 20s or it will retry
  processPayloadAsync(payload);

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Async payload processor — does not block the 200 response
// ---------------------------------------------------------------------------

function processPayloadAsync(payload: any) {
  // Fire and forget — errors are caught inside
  void (async () => {
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Only handle message events
      if (!value?.messages) return;

      for (const message of value.messages as any[]) {
        // Only process text messages
        if (message.type !== "text") {
          console.log(`[whatsapp] Ignoring non-text message type: ${message.type}`);
          continue;
        }

        const messageId: string = message.id;
        const senderPhone: string = message.from;
        const text: string = message.text?.body ?? "";

        if (!messageId || !senderPhone || !text.trim()) continue;

        await processWhatsAppMessage(messageId, senderPhone, text);
      }
    } catch (err) {
      console.error("[whatsapp] Error processing payload:", err);
    }
  })();
}
