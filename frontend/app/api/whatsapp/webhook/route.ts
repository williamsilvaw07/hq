import { NextResponse } from "next/server";
import { processWhatsAppMessage, processWhatsAppVoice, processWhatsAppImage } from "@/lib/whatsapp/process-message";

/**
 * GET /api/whatsapp/webhook
 * WhatsApp webhook verification (hub challenge).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[whatsapp] Webhook verified");
    return new Response(challenge ?? "", { status: 200 });
  }

  console.warn("[whatsapp] Webhook verification failed");
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages via Cloud API webhook.
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  console.log("[whatsapp] Webhook received:", JSON.stringify(body).slice(0, 300));

  // Respond immediately — processing happens async
  processWebhookAsync(body);

  return NextResponse.json({ ok: true });
}

function processWebhookAsync(body: any) {
  void (async () => {
    try {
      if (body.object !== "whatsapp_business_account") return;

      const entries = body.entry;
      if (!Array.isArray(entries)) return;

      for (const entry of entries) {
        const changes = entry.changes;
        if (!Array.isArray(changes)) continue;

        for (const change of changes) {
          if (change.field !== "messages") continue;

          const value = change.value;
          if (!value?.messages) continue;

          const messages: any[] = value.messages;

          for (const message of messages) {
            const from: string = message.from; // sender phone number (wa_id)
            const messageId: string = message.id;

            // Mark message as read
            markAsRead(messageId);

            // Text message
            if (message.type === "text" && message.text?.body) {
              await processWhatsAppMessage(messageId, from, message.text.body);
              continue;
            }

            // Voice / audio message
            if (message.type === "audio" && message.audio?.id) {
              await processWhatsAppVoice(messageId, from, message.audio.id);
              continue;
            }

            // Image message
            if (message.type === "image" && message.image?.id) {
              await processWhatsAppImage(messageId, from, message.image.id);
              continue;
            }

            console.log(`[whatsapp] Ignoring unsupported message type: ${message.type}`);
          }
        }
      }
    } catch (err) {
      console.error("[whatsapp] Error processing webhook:", err);
    }
  })();
}

/**
 * Mark a message as read so the user sees blue checkmarks.
 */
function markAsRead(messageId: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;

  void fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  }).catch((err) => {
    console.error("[whatsapp] Failed to mark as read:", err);
  });
}
