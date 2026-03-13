import { NextResponse } from "next/server";
import { processTelegramMessage } from "@/lib/telegram/process-message";

export async function POST(req: Request) {
  // Optional secret token check (set in Telegram setWebhook call)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      console.warn("[telegram] Invalid webhook secret — rejecting request");
      return new Response("Forbidden", { status: 403 });
    }
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  console.log("[telegram] Update received:", JSON.stringify(update).slice(0, 300));

  // Respond to Telegram immediately — processing happens async
  processUpdateAsync(update);

  return NextResponse.json({ ok: true });
}

function processUpdateAsync(update: any) {
  void (async () => {
    try {
      const message = update?.message;
      if (!message) return;

      // Only handle text messages
      if (!message.text) {
        console.log("[telegram] Ignoring non-text message");
        return;
      }

      const messageId = String(message.message_id);
      const chatId: number = message.chat.id;
      const text: string = message.text;

      if (!messageId || !chatId || !text.trim()) return;

      await processTelegramMessage(messageId, chatId, text);
    } catch (err) {
      console.error("[telegram] Error processing update:", err);
    }
  })();
}
