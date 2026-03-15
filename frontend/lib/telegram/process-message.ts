import { fetchOne, fetchMany, insertOne, execute } from "@/lib/sql";
import { parseExpenseMessage, suggestCategory, detectReply } from "./parse";
import { sendTelegramMessage } from "./send";
import { validateLinkCode, linkTelegramAccount } from "./link";
import { transcribeAudio, categorizeExpense, extractExpenseFromImage } from "./groq";

type UserRow = {
  id: number;
  name: string;
  default_workspace_id: number | null;
};

type CategoryRow = {
  id: number;
  name: string;
};

type PendingTransaction = {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  category_id: number | null;
};

// ---------------------------------------------------------------------------
// Entry points (called from webhook)
// ---------------------------------------------------------------------------

export async function processTelegramMessage(
  telegramMessageId: string,
  chatId: number,
  text: string,
): Promise<void> {
  console.log(`[telegram] Processing message ${telegramMessageId} from chat ${chatId}: "${text}"`);

  // 1. Deduplication
  try {
    await insertOne(
      "INSERT INTO telegram_messages (telegram_message_id) VALUES (?)",
      [telegramMessageId],
    );
  } catch {
    console.log(`[telegram] Duplicate message ${telegramMessageId} — skipping`);
    return;
  }

  // 2. Check if this is a linking code (6 alphanumeric chars)
  const trimmed = text.trim();
  if (/^[A-Z0-9]{6}$/i.test(trimmed)) {
    const linkResult = await validateLinkCode(trimmed);
    if (linkResult) {
      await linkTelegramAccount(linkResult.userId, chatId, linkResult.workspaceId);
      await sendTelegramMessage(chatId, "✅ Account linked! You can now log expenses and income.\n\nTry:\n  20 uber\n  income 500 salary\n  recebi 500 salário\n\nOr send a voice message!");
      return;
    }
  }

  // 3. Check if this is a confirmation/cancel reply
  const reply = detectReply(trimmed);
  if (reply === "confirm" || reply === "cancel") {
    await handleConfirmation(chatId, reply);
    return;
  }

  // 4. Process as new expense/income
  await processExpenseText(telegramMessageId, chatId, trimmed);
}

export async function processTelegramVoice(
  telegramMessageId: string,
  chatId: number,
  fileId: string,
): Promise<void> {
  console.log(`[telegram] Processing voice message ${telegramMessageId} from chat ${chatId}`);

  // Deduplication
  try {
    await insertOne(
      "INSERT INTO telegram_messages (telegram_message_id) VALUES (?)",
      [telegramMessageId],
    );
  } catch {
    console.log(`[telegram] Duplicate voice message ${telegramMessageId} — skipping`);
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN");
    return;
  }

  let audioBuffer: Buffer;
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json() as { ok: boolean; result: { file_path: string } };
    if (!fileData.ok) throw new Error("Failed to get file path");
    const filePath = fileData.result.file_path;
    const audioRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    const arrayBuffer = await audioRes.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[telegram] Failed to download voice:", err);
    await sendTelegramMessage(chatId, "❌ Could not download your voice message. Please try again.");
    return;
  }

  let transcribed: string;
  try {
    transcribed = await transcribeAudio(audioBuffer);
    console.log(`[telegram] Transcribed voice: "${transcribed}"`);
  } catch (err) {
    console.error("[telegram] Transcription failed:", err);
    await sendTelegramMessage(chatId, "❌ Could not transcribe your voice message. Try typing instead.");
    return;
  }

  if (!transcribed) {
    await sendTelegramMessage(chatId, "❌ Couldn't hear anything. Please try again.");
    return;
  }

  await processExpenseText(telegramMessageId, chatId, transcribed);
}

export async function processTelegramPhoto(
  telegramMessageId: string,
  chatId: number,
  fileId: string,
): Promise<void> {
  console.log(`[telegram] Processing photo ${telegramMessageId} from chat ${chatId}`);

  // Deduplication
  try {
    await insertOne(
      "INSERT INTO telegram_messages (telegram_message_id) VALUES (?)",
      [telegramMessageId],
    );
  } catch {
    console.log(`[telegram] Duplicate photo message ${telegramMessageId} — skipping`);
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  let imageBuffer: Buffer;
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json() as { ok: boolean; result: { file_path: string } };
    if (!fileData.ok) throw new Error("Failed to get file path");
    const filePath = fileData.result.file_path;
    const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    const arrayBuffer = await imgRes.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[telegram] Failed to download photo:", err);
    await sendTelegramMessage(chatId, "❌ Could not download your image. Please try again.");
    return;
  }

  let extracted: string | null;
  try {
    extracted = await extractExpenseFromImage(imageBuffer);
    console.log(`[telegram] Vision extracted: "${extracted}"`);
  } catch (err) {
    console.error("[telegram] Vision extraction failed:", err);
    await sendTelegramMessage(chatId, "❌ Could not read the image. Try typing the expense instead.");
    return;
  }

  if (!extracted) {
    await sendTelegramMessage(chatId, "❓ Couldn't find an expense in that image.\n\nMake sure it shows a receipt or price clearly.");
    return;
  }

  await processExpenseText(telegramMessageId, chatId, extracted);
}

// ---------------------------------------------------------------------------
// Core: parse → draft → ask confirmation
// ---------------------------------------------------------------------------

async function processExpenseText(
  messageId: string,
  chatId: number,
  text: string,
): Promise<void> {
  // Look up user
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

  // Parse amount + description + type
  const parsed = parseExpenseMessage(text);
  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      `❓ Couldn't understand: "${text}"\n\nTry:\n  20 uber\n  uber 20\n  income 500 salary\n  recebi 500 salário`,
    );
    return;
  }

  const { amount, description, type } = parsed;

  // Cancel any existing pending draft from this user (replace with new one)
  await execute(
    `DELETE FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'telegram'`,
    [workspaceId, user.id],
  );

  // For expenses: resolve category
  let categoryId: number | null = null;
  let categoryName: string | null = null;

  if (type === "expense") {
    const resolved = await resolveCategory(description, workspaceId);
    categoryId = resolved.categoryId;
    if (categoryId) {
      const cat = await fetchOne<CategoryRow>(
        "SELECT id, name FROM Category WHERE id = ? LIMIT 1",
        [categoryId],
      );
      categoryName = cat?.name ?? null;
    }
  }

  // Save as pending_confirmation draft
  const today = new Date().toISOString().slice(0, 10);
  const txId = await insertOne(
    `INSERT INTO Transaction
       (workspace_id, category_id, created_by_user_id, type, amount, currency,
        exchange_rate, base_amount, date, description, source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'BRL', 1, ?, ?, ?, 'telegram', 'pending_confirmation', NOW(3), NOW(3))`,
    [workspaceId, categoryId, user.id, type, amount, amount, today, description],
  );

  const amountFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  // Build confirmation message
  const typeEmoji = type === "income" ? "💰" : "🛒";
  const typeLabel = type === "income" ? "Income" : "Expense";

  let msg = `${typeEmoji} ${typeLabel} detected!\n\n`;
  msg += `Amount: ${amountFormatted}\n`;
  msg += `Description: ${description}\n`;
  if (type === "expense") {
    msg += `Category: ${categoryName ?? "None (will need review)"}\n`;
  }
  msg += `Date: ${today}\n\n`;
  msg += `Reply:\n`;
  msg += `  ✅ or "yes" — Confirm\n`;
  msg += `  ❌ or "no" — Cancel\n`;
  msg += `  Or send a new message to replace this one`;

  await sendTelegramMessage(chatId, msg);

  console.log(`[telegram] Pending transaction #${txId} for user ${user.id} — ${amountFormatted} ${description} [${type}]`);
}

// ---------------------------------------------------------------------------
// Handle confirmation / cancellation
// ---------------------------------------------------------------------------

async function handleConfirmation(chatId: number, action: "confirm" | "cancel"): Promise<void> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE telegram_chat_id = ? LIMIT 1",
    [chatId],
  );
  if (!user || !user.default_workspace_id) return;

  // Find the latest pending_confirmation transaction
  const pending = await fetchOne<PendingTransaction>(
    `SELECT id, type, amount, description, category_id
     FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'telegram'
     ORDER BY created_at DESC LIMIT 1`,
    [user.default_workspace_id, user.id],
  );

  if (!pending) {
    await sendTelegramMessage(chatId, "❓ Nothing to confirm. Send a new expense or income first.");
    return;
  }

  const amountFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(pending.amount);

  if (action === "cancel") {
    await execute("DELETE FROM Transaction WHERE id = ?", [pending.id]);
    await sendTelegramMessage(chatId, `❌ Cancelled: ${amountFormatted} — ${pending.description ?? "—"}`);
    console.log(`[telegram] User ${user.id} cancelled transaction #${pending.id}`);
    return;
  }

  // Confirm: set status based on whether expense has a category
  const isExpense = pending.type === "expense";
  const needsReview = isExpense && !pending.category_id;
  const newStatus = needsReview ? "draft" : "confirmed";

  await execute(
    `UPDATE Transaction SET status = ?, confirmed_at = NOW(3), confirmed_by_user_id = ?, updated_at = NOW(3) WHERE id = ?`,
    [newStatus, user.id, pending.id],
  );

  if (needsReview) {
    await sendTelegramMessage(
      chatId,
      `⏳ Saved for review!\n\n${amountFormatted} — ${pending.description ?? "—"}\n\nNo category matched — open the app to assign one.`,
    );
  } else {
    const typeEmoji = pending.type === "income" ? "💰" : "✅";
    let categoryInfo = "";
    if (isExpense && pending.category_id) {
      const cat = await fetchOne<CategoryRow>("SELECT name FROM Category WHERE id = ? LIMIT 1", [pending.category_id]);
      categoryInfo = `\nCategory: ${cat?.name ?? "—"}`;
    }
    await sendTelegramMessage(
      chatId,
      `${typeEmoji} Confirmed!\n\n${amountFormatted} — ${pending.description ?? "—"}${categoryInfo}`,
    );
  }

  console.log(`[telegram] User ${user.id} confirmed transaction #${pending.id} as ${newStatus}`);
}

// ---------------------------------------------------------------------------
// AI-powered category resolution (expenses only)
// ---------------------------------------------------------------------------

type CategoryResult = { categoryId: number | null };

type BudgetCategoryRow = {
  category_id: number;
  budget_name: string | null;
  category_name: string;
};

async function resolveCategory(description: string, workspaceId: number): Promise<CategoryResult> {
  const budgetCategories = await fetchMany<BudgetCategoryRow>(
    `SELECT b.category_id, b.name AS budget_name, c.name AS category_name
     FROM budgets b
     JOIN Category c ON c.id = b.category_id
     WHERE b.workspace_id = ?
     ORDER BY b.id ASC`,
    [workspaceId],
  );

  const categoryList = budgetCategories.map((bc) => ({
    id: bc.category_id,
    name: bc.budget_name || bc.category_name,
  }));
  const unique = categoryList.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  if (unique.length === 1) return { categoryId: unique[0].id };

  // Keyword matching
  if (unique.length > 0) {
    const keywordMatch = matchByKeywords(description, unique);
    if (keywordMatch !== null) {
      console.log(`[telegram] Keyword matched category ${keywordMatch}`);
      return { categoryId: keywordMatch };
    }
  }

  // AI categorization
  if (unique.length > 0) {
    try {
      const aiPick = await categorizeExpense(description, unique, false);
      if (aiPick !== null) {
        console.log(`[telegram] AI picked category ${aiPick}`);
        return { categoryId: aiPick };
      }
      const retryPick = await categorizeExpense(description, unique, true);
      if (retryPick !== null) {
        console.log(`[telegram] AI picked category ${retryPick} on retry`);
        return { categoryId: retryPick };
      }
    } catch (err) {
      console.error("[telegram] AI categorization failed:", err);
    }
  }

  // Keyword suggestion fallback
  const categories = unique.length > 0 ? unique : await fetchMany<CategoryRow>(
    "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense' ORDER BY id ASC",
    [workspaceId],
  );

  if (categories.length === 0) return { categoryId: null };
  if (categories.length === 1) return { categoryId: categories[0].id };

  const suggested = suggestCategory(description);
  if (suggested) {
    const lower = suggested.toLowerCase();
    const match = categories.find((c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()));
    if (match) return { categoryId: match.id };
  }

  return { categoryId: null };
}

function matchByKeywords(
  description: string,
  categories: { id: number; name: string }[],
): number | null {
  const lower = description.toLowerCase();

  for (const cat of categories) {
    const catLower = cat.name.toLowerCase();
    if (lower.includes(catLower) || catLower.includes(lower)) {
      return cat.id;
    }
  }

  const descWords = lower.split(/\s+/).filter((w) => w.length > 2);
  for (const cat of categories) {
    const catWords = cat.name.toLowerCase().split(/[\s&]+/).filter((w) => w.length > 2);
    for (const dw of descWords) {
      for (const cw of catWords) {
        if (dw.includes(cw) || cw.includes(dw)) {
          return cat.id;
        }
      }
    }
  }

  return null;
}
