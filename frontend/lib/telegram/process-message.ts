import { fetchOne, fetchMany, insertOne } from "@/lib/sql";
import { parseExpenseMessage, suggestCategory } from "./parse";
import { sendTelegramMessage } from "./send";
import { validateLinkCode, linkTelegramAccount } from "./link";

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
 */
export async function processTelegramMessage(
  telegramMessageId: string,
  chatId: number,
  text: string,
): Promise<void> {
  console.log(`[telegram] Processing message ${telegramMessageId} from chat ${chatId}: "${text}"`);

  // 1. Deduplication — skip if already processed
  try {
    await insertOne(
      "INSERT INTO telegram_messages (telegram_message_id) VALUES (?)",
      [telegramMessageId],
    );
  } catch {
    console.log(`[telegram] Duplicate message ${telegramMessageId} — skipping`);
    return;
  }

  // 2. Check if this is a linking code (6 uppercase alphanumeric chars)
  const trimmed = text.trim();
  if (/^[A-Z0-9]{6}$/i.test(trimmed)) {
    const userId = await validateLinkCode(trimmed);
    if (userId) {
      await linkTelegramAccount(userId, chatId);
      await sendTelegramMessage(chatId, "✅ Account linked! You can now log expenses.\n\nTry sending:\n  20 uber\n  gastei 50 em mercado");
      return;
    }
  }

  // 3. Look up user by telegram_chat_id
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE telegram_chat_id = ? LIMIT 1",
    [chatId],
  );

  if (!user) {
    await sendTelegramMessage(
      chatId,
      "👋 Your Telegram is not linked to any account.\n\nOpen the app, go to Settings → Connect Telegram, and send the code shown.",
    );
    return;
  }

  const workspaceId = user.default_workspace_id;
  if (!workspaceId) {
    await sendTelegramMessage(
      chatId,
      "⚠️ No default workspace set. Open the app and set a default workspace in Settings.",
    );
    return;
  }

  // 4. Parse the message
  const parsed = parseExpenseMessage(trimmed);
  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      `❓ Couldn't understand that message.\n\nTry:\n  20 uber\n  uber 20\n  spent 20 on food\n  gastei 20 em mercado`,
    );
    return;
  }

  const { amount, description } = parsed;

  // 5. Category matching
  const categoryId = await resolveCategory(description, workspaceId);

  // 6. Insert transaction
  const today = new Date().toISOString().slice(0, 10);
  await insertOne(
    `INSERT INTO Transaction
       (workspace_id, category_id, created_by_user_id, type, amount, currency,
        exchange_rate, base_amount, date, description, source, status, created_at, updated_at)
     VALUES (?, ?, ?, 'expense', ?, 'BRL', 1, ?, ?, ?, 'telegram', 'confirmed', NOW(3), NOW(3))`,
    [workspaceId, categoryId, user.id, amount, amount, today, description],
  );

  // 7. Confirm to user
  const amountFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  await sendTelegramMessage(
    chatId,
    `✅ Expense recorded!\n\nAmount: ${amountFormatted}\nDescription: ${description}\nDate: ${today}`,
  );

  console.log(`[telegram] Transaction created for user ${user.id} — ${amountFormatted} ${description}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveCategory(description: string, workspaceId: number): Promise<number | null> {
  // Load all expense categories for this workspace (these are the user's actual budgets)
  const categories = await fetchMany<CategoryRow>(
    "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense' ORDER BY id ASC",
    [workspaceId],
  );

  if (categories.length === 0) return null;

  const descLower = description.toLowerCase();
  const words = descLower.split(/\s+/);

  // 1. Direct match: any word in the description matches a category name
  for (const cat of categories) {
    const catLower = cat.name.toLowerCase();
    if (words.some((w) => catLower.includes(w) || w.includes(catLower))) {
      return cat.id;
    }
  }

  // 2. Keyword map hint: map description to a generic category name, then match against user's categories
  const suggested = suggestCategory(description);
  if (suggested) {
    const suggestedLower = suggested.toLowerCase();
    for (const cat of categories) {
      const catLower = cat.name.toLowerCase();
      if (catLower.includes(suggestedLower) || suggestedLower.includes(catLower)) {
        return cat.id;
      }
    }
  }

  // 3. Fall back to first budget category
  return categories[0].id;
}
