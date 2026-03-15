/**
 * Sends a plain-text WhatsApp message via the Cloud API.
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    return;
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[whatsapp] Failed to send message:", res.status, err);
    } else {
      console.log("[whatsapp] Message sent to", to);
    }
  } catch (err) {
    console.error("[whatsapp] Send error:", err);
  }
}
