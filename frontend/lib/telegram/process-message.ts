import { fetchOne, fetchMany, insertOne } from "@/lib/sql";
import { parseExpenseMessage } from "./parse";
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

/**
 * Main orchestrator for text messages. Called from the POST webhook handler.
 */
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
      await sendTelegramMessage(chatId, "✅ Account linked! You can now log expenses.\n\nTry sending:\n  20 uber\n  gastei 50 em mercado\n\nOr send a voice message!");
      return;
    }
  }

  await processExpenseText(telegramMessageId, chatId, trimmed);
}

/**
 * Handles voice messages — transcribes then processes as expense text.
 */
export async function processTelegramVoice(
  telegramMessageId: string,
  chatId: number,
  fileId: string,
): Promise<void> {
  console.log(`[telegram] Processing voice message ${telegramMessageId} from chat ${chatId}`);

  // 1. Deduplication
  try {
    await insertOne(
      "INSERT INTO telegram_messages (telegram_message_id) VALUES (?)",
      [telegramMessageId],
    );
  } catch {
    console.log(`[telegram] Duplicate voice message ${telegramMessageId} — skipping`);
    return;
  }

  // 2. Download audio from Telegram
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[telegram] Missing TELEGRAM_BOT_TOKEN");
    return;
  }

  let audioBuffer: Buffer;
  try {
    // Get file path from Telegram
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

  // 3. Transcribe with Groq Whisper
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

/**
 * Handles photo messages — uses vision AI to extract expense then processes it.
 */
export async function processTelegramPhoto(
  telegramMessageId: string,
  chatId: number,
  fileId: string,
): Promise<void> {
  console.log(`[telegram] Processing photo ${telegramMessageId} from chat ${chatId}`);

  // 1. Deduplication
  try {
    await insertOne(
      "INSERT INTO telegram_messages (telegram_message_id) VALUES (?)",
      [telegramMessageId],
    );
  } catch {
    console.log(`[telegram] Duplicate photo message ${telegramMessageId} — skipping`);
    return;
  }

  // 2. Download image from Telegram
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

  // 3. Extract expense with Groq Vision
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
// Shared expense processing logic
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

  // Parse amount + description
  const parsed = parseExpenseMessage(text);
  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      `❓ Couldn't understand: "${text}"\n\nTry:\n  20 uber\n  uber 20\n  spent 20 on food\n  gastei 20 em mercado`,
    );
    return;
  }

  const { amount, description } = parsed;

  // AI category resolution (with retry)
  const { categoryId, isDraft } = await resolveCategory(description, workspaceId);

  const status = isDraft ? "draft" : "confirmed";

  // Insert transaction
  const today = new Date().toISOString().slice(0, 10);
  await insertOne(
    `INSERT INTO Transaction
       (workspace_id, category_id, created_by_user_id, type, amount, currency,
        exchange_rate, base_amount, date, description, source, status, created_at, updated_at)
     VALUES (?, ?, ?, 'expense', ?, 'BRL', 1, ?, ?, ?, 'telegram', ?, NOW(3), NOW(3))`,
    [workspaceId, categoryId, user.id, amount, amount, today, description, status],
  );

  const amountFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  if (isDraft) {
    await sendTelegramMessage(
      chatId,
      `⏳ Expense saved for review!\n\nAmount: ${amountFormatted}\nDescription: ${description}\nDate: ${today}\n\nCouldn't match a budget — open the app to assign one.`,
    );
  } else {
    const categories = await fetchMany<CategoryRow>(
      "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense'",
      [workspaceId],
    );
    const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
    await sendTelegramMessage(
      chatId,
      `✅ Expense recorded!\n\nAmount: ${amountFormatted}\nDescription: ${description}\nCategory: ${categoryName}\nDate: ${today}`,
    );
  }

  console.log(`[telegram] Transaction created for user ${user.id} — ${amountFormatted} ${description} [${status}]`);
}

// ---------------------------------------------------------------------------
// AI-powered category resolution
// ---------------------------------------------------------------------------

type CategoryResult = { categoryId: number | null; isDraft: boolean };

type BudgetCategoryRow = {
  category_id: number;
  budget_name: string | null;
  category_name: string;
};

async function resolveCategory(description: string, workspaceId: number): Promise<CategoryResult> {
  // First try to match against budget categories (what the user actually sees)
  const budgetCategories = await fetchMany<BudgetCategoryRow>(
    `SELECT b.category_id, b.name AS budget_name, c.name AS category_name
     FROM budgets b
     JOIN Category c ON c.id = b.category_id
     WHERE b.workspace_id = ?
     ORDER BY b.id ASC`,
    [workspaceId],
  );

  if (budgetCategories.length > 0) {
    // Use budget names (what user sees) as labels, but return category_id
    const categoryList = budgetCategories.map((bc) => ({
      id: bc.category_id,
      name: bc.budget_name || bc.category_name,
    }));

    // Deduplicate by category_id
    const unique = categoryList.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

    if (unique.length === 1) return { categoryId: unique[0].id, isDraft: false };

    try {
      const firstPick = await categorizeExpense(description, unique, false);
      if (firstPick !== null) {
        console.log(`[telegram] AI picked budget category ${firstPick} on first attempt`);
        return { categoryId: firstPick, isDraft: false };
      }

      console.log("[telegram] AI first attempt returned null — retrying");
      const retryPick = await categorizeExpense(description, unique, true);
      if (retryPick !== null) {
        console.log(`[telegram] AI picked budget category ${retryPick} on retry`);
        return { categoryId: retryPick, isDraft: false };
      }
    } catch (err) {
      console.error("[telegram] AI categorization (budgets) failed:", err);
    }
  }

  // Fallback: try all expense categories (even if no budget exists for them)
  const categories = await fetchMany<CategoryRow>(
    "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense' ORDER BY id ASC",
    [workspaceId],
  );

  if (categories.length === 0) return { categoryId: null, isDraft: true };
  if (categories.length === 1) return { categoryId: categories[0].id, isDraft: false };

  try {
    const firstPick = await categorizeExpense(description, categories, false);
    if (firstPick !== null) {
      console.log(`[telegram] AI picked category ${firstPick} on first attempt`);
      return { categoryId: firstPick, isDraft: false };
    }

    console.log("[telegram] AI first attempt returned null — retrying (fallback)");
    const retryPick = await categorizeExpense(description, categories, true);
    if (retryPick !== null) {
      console.log(`[telegram] AI picked category ${retryPick} on retry`);
      return { categoryId: retryPick, isDraft: false };
    }
  } catch (err) {
    console.error("[telegram] AI categorization failed:", err);
  }

  // All attempts failed — save as draft
  console.log("[telegram] AI could not categorize — saving as draft");
  return { categoryId: null, isDraft: true };
}
