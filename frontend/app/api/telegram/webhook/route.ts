import { NextResponse } from "next/server";
import { processTelegramMessage, processTelegramVoice, processTelegramPhoto } from "@/lib/telegram/process-message";

export async function POST(req: Request) {
  // Optional secret token check
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

      const messageId = String(message.message_id);
      const chatId: number = message.chat.id;

      // Voice message
      if (message.voice) {
        const fileId: string = message.voice.file_id;
        await processTelegramVoice(messageId, chatId, fileId);
        return;
      }

      // Photo message — use highest resolution version
      if (message.photo) {
        const photos: { file_id: string }[] = message.photo;
        const fileId = photos[photos.length - 1].file_id;
        await processTelegramPhoto(messageId, chatId, fileId);
        return;
      }

      // Text message
      if (message.text) {
        await processTelegramMessage(messageId, chatId, message.text);
        return;
      }

      console.log("[telegram] Ignoring unsupported message type");
    } catch (err) {
      console.error("[telegram] Error processing update:", err);
    }
  })();
}
