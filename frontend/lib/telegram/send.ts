/**
 * Sends a plain-text Telegram message via Bot API.
 */
export async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[telegram] Failed to send message:", res.status, err);
    } else {
      console.log("[telegram] Message sent to", chatId);
    }
  } catch (err) {
    console.error("[telegram] Send error:", err);
  }
}
