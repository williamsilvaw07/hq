import { fetchOne, fetchMany, insertOne } from "@/lib/sql";
import { parseExpenseMessage, suggestCategory } from "./parse";
import { sendWhatsAppMessage } from "./send";

type UserRow = {
  id: number;
  name: string;
  default_workspace_id: number | null;
};

type CategoryRow = {
  id: number;
  name: string;
};

/**
 * Main orchestrator. Called from the POST webhook handler.
 * Runs fully async after the 200 has been returned to Meta.
 */
export async function processWhatsAppMessage(
  whatsappMessageId: string,
  senderPhone: string,
  text: string,
): Promise<void> {
  console.log(`[whatsapp] Processing message ${whatsappMessageId} from ${senderPhone}: "${text}"`);

  // 1. Deduplication — skip if already processed
  try {
    await insertOne(
      "INSERT INTO whatsapp_messages (whatsapp_message_id) VALUES (?)",
      [whatsappMessageId],
    );
  } catch {
    // Unique constraint violation = duplicate
    console.log(`[whatsapp] Duplicate message ${whatsappMessageId} — skipping`);
    return;
  }

  // 2. Look up user by phone number
  const normalised = normalisePhone(senderPhone);
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE phone_number = ? LIMIT 1",
    [normalised],
  );

  if (!user) {
    await sendWhatsAppMessage(
      senderPhone,
      "👋 Your WhatsApp number is not linked to any account.\n\nOpen the app, go to Settings → Profile and connect your WhatsApp number first.",
    );
    return;
  }

  const workspaceId = user.default_workspace_id;
  if (!workspaceId) {
    await sendWhatsAppMessage(
      senderPhone,
      "⚠️ No default workspace set. Open the app and set a default workspace in Settings.",
    );
    return;
  }

  // 3. Parse the message
  const parsed = parseExpenseMessage(text);
  if (!parsed) {
    await sendWhatsAppMessage(
      senderPhone,
      `❓ Couldn't understand that message.\n\nTry:\n• "20 uber"\n• "uber 20"\n• "spent 20 on food"\n• "gastei 20 em mercado"`,
    );
    return;
  }

  const { amount, description } = parsed;

  // 4. Category matching — try keyword suggestion against workspace categories
  const categoryId = await resolveCategory(description, workspaceId);

  // 5. Insert transaction
  const today = new Date().toISOString().slice(0, 10);
  await insertOne(
    `INSERT INTO Transaction
       (workspace_id, category_id, created_by_user_id, type, amount, currency,
        exchange_rate, base_amount, date, description, source, status, created_at, updated_at)
     VALUES (?, ?, ?, 'expense', ?, 'BRL', 1, ?, ?, ?, 'whatsapp', 'confirmed', NOW(3), NOW(3))`,
    [workspaceId, categoryId, user.id, amount, amount, today, description],
  );

  // 6. Confirm to user
  const amountFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  await sendWhatsAppMessage(
    senderPhone,
    `✅ Expense recorded!\n\nAmount: ${amountFormatted}\nDescription: ${description}\nDate: ${today}`,
  );

  console.log(`[whatsapp] Transaction created for user ${user.id} — ${amountFormatted} ${description}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strips non-digit chars and normalises to E.164-ish for DB comparison.
 */
function normalisePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Tries to find a matching category in the workspace using keyword mapping.
 * Falls back to finding/creating an "Other" category.
 */
async function resolveCategory(description: string, workspaceId: number): Promise<number | null> {
  const suggested = suggestCategory(description);

  if (suggested) {
    // Try to find a matching category by name (case-insensitive)
    const match = await fetchOne<CategoryRow>(
      "SELECT id, name FROM Category WHERE workspace_id = ? AND LOWER(name) = LOWER(?) AND type = 'expense' LIMIT 1",
      [workspaceId, suggested],
    );
    if (match) return match.id;

    // Try partial match
    const partial = await fetchOne<CategoryRow>(
      "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense' AND LOWER(name) LIKE ? LIMIT 1",
      [workspaceId, `%${suggested.toLowerCase()}%`],
    );
    if (partial) return partial.id;
  }

  // Fall back to any expense category in the workspace
  const fallback = await fetchOne<CategoryRow>(
    "SELECT id FROM Category WHERE workspace_id = ? AND type = 'expense' ORDER BY id ASC LIMIT 1",
    [workspaceId],
  );
  if (fallback) return fallback.id;

  // No categories exist — return null (category_id is nullable)
  return null;
}
