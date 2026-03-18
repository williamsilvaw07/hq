import { fetchOne, fetchMany, insertOne, execute } from "@/lib/sql";
import { formatMoney } from "@/lib/format";
import { parseExpenseMessage, suggestCategory, detectReply } from "./parse";
import { sendTelegramMessage } from "./send";
import { validateLinkCode, linkTelegramAccount } from "./link";
import { transcribeAudio, categorizeExpense, extractExpenseFromImage, handleSmartMessage } from "./groq";

type UserRow = {
  id: number;
  name: string;
  default_workspace_id: number | null;
};

type WorkspaceRow = {
  id: number;
  name: string;
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

  // 2. Handle bot commands
  const trimmed = text.trim();
  if (trimmed.startsWith("/")) {
    await handleBotCommand(chatId, trimmed);
    return;
  }

  // 3. Check if this is a linking code (6 alphanumeric chars)
  if (/^[A-Z0-9]{6}$/i.test(trimmed)) {
    const linkResult = await validateLinkCode(trimmed);
    if (linkResult) {
      await linkTelegramAccount(linkResult.userId, chatId, linkResult.workspaceId);
      const welcomeWorkspace = linkResult.workspaceId
        ? await fetchOne<WorkspaceRow>("SELECT id, name FROM Workspace WHERE id = ? LIMIT 1", [linkResult.workspaceId])
        : null;

      let welcome = "✅ Account linked successfully!\n\n";
      if (welcomeWorkspace) {
        welcome += `📂 Active workspace: ${welcomeWorkspace.name}\n\n`;
      }
      welcome += "— How it works —\n";
      welcome += "Send a message and I'll log it as a transaction. You can type, send a voice message, or snap a photo of a receipt.\n\n";
      welcome += "Examples:\n";
      welcome += "  20 uber → R$ 20 expense\n";
      welcome += "  income 500 salary → R$ 500 income\n";
      welcome += "  recebi 500 salário → R$ 500 income\n\n";
      welcome += "After each entry I'll ask you to confirm (yes/no) before saving.\n\n";
      welcome += "— Commands —\n";
      welcome += "  /workspace — View & switch workspaces\n";
      welcome += "  /status — Show active workspace\n";
      welcome += "  /help — Show this guide";

      await sendTelegramMessage(chatId, welcome);
      return;
    }
  }

  // 4. Handle numbered replies (1=confirm, 2=cancel, 3=categories, 4+=category picks)
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    // Numbers > 3 are always category picks
    if (num > 3) {
      const handled = await handleCategoryPick(chatId, num - 3);
      if (handled) return;
    }
    if (num === 1) { await handleConfirmation(chatId, "confirm"); return; }
    if (num === 2) { await handleConfirmation(chatId, "cancel"); return; }
    if (num === 3) { await handleCategoryList(chatId); return; }
  }

  // 4b. Check text-based confirmation/cancel/category replies
  const reply = detectReply(trimmed);
  if (reply === "confirm" || reply === "cancel") {
    await handleConfirmation(chatId, reply);
    return;
  }
  if (reply === "category") {
    await handleCategoryList(chatId);
    return;
  }

  // 5. Process as new expense/income
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
// Bot commands (/start, /help, /workspace)
// ---------------------------------------------------------------------------

async function handleBotCommand(chatId: number, text: string): Promise<void> {
  const [cmd, ...args] = text.split(/\s+/);
  const command = cmd.toLowerCase().replace(/@\w+$/, ""); // strip @botname

  if (command === "/start" || command === "/help") {
    let msg = "👋 Welcome to NorthTrack!\n\n";
    msg += "— How it works —\n";
    msg += "Send a message and I'll log it as a transaction. You can type, send a voice message, or snap a photo of a receipt.\n\n";
    msg += "Examples:\n";
    msg += "  20 uber → R$ 20 expense\n";
    msg += "  income 500 salary → R$ 500 income\n";
    msg += "  recebi 500 salário → R$ 500 income\n\n";
    msg += "After each entry I'll ask you to confirm (yes/no) before saving.\n\n";
    msg += "— Commands —\n";
    msg += "  /workspace — View & switch workspaces\n";
    msg += "  /status — Show active workspace\n";
    msg += "  /help — Show this guide";
    await sendTelegramMessage(chatId, msg);
    return;
  }

  if (command === "/status") {
    const user = await fetchOne<UserRow>(
      "SELECT id, name, default_workspace_id FROM User WHERE telegram_chat_id = ? LIMIT 1",
      [chatId],
    );
    if (!user) {
      await sendTelegramMessage(chatId, "👋 Your Telegram is not linked yet.\n\nOpen the app → Settings → Connect Telegram to get started.");
      return;
    }
    if (!user.default_workspace_id) {
      await sendTelegramMessage(chatId, "⚠️ No active workspace. Use /workspace to pick one.");
      return;
    }
    const ws = await fetchOne<WorkspaceRow>("SELECT id, name FROM Workspace WHERE id = ? LIMIT 1", [user.default_workspace_id]);
    await sendTelegramMessage(chatId, `📂 Active workspace: ${ws?.name ?? "Unknown"}\n\nAll transactions are logged here. Use /workspace to switch.`);
    return;
  }

  if (command === "/workspace") {
    const user = await fetchOne<UserRow>(
      "SELECT id, name, default_workspace_id FROM User WHERE telegram_chat_id = ? LIMIT 1",
      [chatId],
    );

    if (!user) {
      await sendTelegramMessage(chatId, "👋 Your Telegram is not linked yet.\n\nOpen the app → Settings → Connect Telegram to get started.");
      return;
    }

    // Get all workspaces for this user
    const workspaces = await fetchMany<WorkspaceRow>(
      `SELECT w.id, w.name FROM Workspace w
       JOIN workspace_users wu ON wu.workspace_id = w.id
       WHERE wu.user_id = ?
       ORDER BY w.name ASC`,
      [user.id],
    );

    if (workspaces.length === 0) {
      await sendTelegramMessage(chatId, "⚠️ You don't belong to any workspaces yet.");
      return;
    }

    // If an argument was provided, switch directly
    const pick = args[0];
    if (pick) {
      const pickNum = parseInt(pick, 10);
      let target: WorkspaceRow | undefined;

      if (!isNaN(pickNum) && pickNum >= 1 && pickNum <= workspaces.length) {
        target = workspaces[pickNum - 1];
      } else {
        // Try matching by name
        const lower = pick.toLowerCase();
        target = workspaces.find((w) => w.name.toLowerCase().includes(lower));
      }

      if (target) {
        await execute("UPDATE User SET default_workspace_id = ? WHERE id = ?", [target.id, user.id]);
        await sendTelegramMessage(chatId, `✅ Switched to workspace: ${target.name}\n\nAll new transactions will be logged here.`);
      } else {
        await sendTelegramMessage(chatId, `❌ Workspace not found. Use /workspace to see your list.`);
      }
      return;
    }

    // List workspaces with numbers
    const current = user.default_workspace_id;
    let msg = "📂 Your workspaces:\n\n";
    workspaces.forEach((w, i) => {
      const active = w.id === current ? " ← active" : "";
      msg += `  ${i + 1}. ${w.name}${active}\n`;
    });
    msg += `\nTo switch, send:\n  /workspace 1\n  /workspace ${workspaces.length > 1 ? "2" : "1"}`;
    msg += `\n  /workspace ${workspaces[0].name}`;

    await sendTelegramMessage(chatId, msg);
    return;
  }

  // Unknown command
  await sendTelegramMessage(
    chatId,
    `❓ Unknown command: ${cmd}\n\nAvailable:\n  /workspace — Switch workspace\n  /help — Show help`,
  );
}

// ---------------------------------------------------------------------------
// Core: parse → draft → ask confirmation
// ---------------------------------------------------------------------------

async function processExpenseText(
  messageId: string,
  chatId: number,
  text: string,
): Promise<void> {
  // Look up user by their linked Telegram chat ID
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
      "⚠️ No default workspace set. Use /workspace to pick one.",
    );
    return;
  }

  // Get workspace name for confirmation message
  const workspace = await fetchOne<WorkspaceRow>(
    "SELECT id, name FROM Workspace WHERE id = ? LIMIT 1",
    [workspaceId],
  );
  const workspaceName = workspace?.name ?? "Unknown";

  // Parse amount + description + type (rule-based first, then AI fallback)
  let parsed = parseExpenseMessage(text);

  if (!parsed) {
    // AI fallback: try to extract an expense or respond conversationally
    try {
      const aiResult = await handleSmartMessage(text, user.name, workspaceName);
      if (aiResult.type === "reply") {
        await sendTelegramMessage(chatId, aiResult.text);
        return;
      }
      // AI extracted an expense — re-parse the cleaned text
      parsed = parseExpenseMessage(aiResult.text);
    } catch (err) {
      console.error("[telegram] AI smart message failed:", err);
    }

    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        `❓ I couldn't find an expense in that message.\n\nHere's what I can do:\n  💸 Log expense — send "20 uber" or "gastei 50 mercado"\n  💰 Log income — send "income 500 salary"\n  🎤 Voice — send a voice message\n  📷 Receipt — send a photo\n  📂 /workspace — switch workspace\n  ℹ️ /status — check active workspace\n  ❓ /help — see all options`,
      );
      return;
    }
  }

  const { amount, description, type, unbudgeted } = parsed;

  // Cancel any existing pending draft from this user (replace with new one)
  await execute(
    `DELETE FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'telegram'`,
    [workspaceId, user.id],
  );

  // For expenses: resolve category (skip if explicitly unbudgeted)
  let categoryId: number | null = null;
  let categoryName: string | null = null;

  if (type === "expense" && !unbudgeted) {
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

  const amountFormatted = formatMoney(amount, { minimumFractionDigits: 2 });

  // Build confirmation message
  const typeEmoji = type === "income" ? "💰" : "🛒";
  const typeLabel = type === "income" ? "Income" : "Expense";

  let msg = `${typeEmoji} ${typeLabel} detected!\n\n`;
  msg += `Workspace: ${workspaceName}\n`;
  msg += `Logged by: ${user.name}\n`;
  msg += `Amount: ${amountFormatted}\n`;
  msg += `Description: ${description}\n`;
  if (type === "expense") {
    msg += unbudgeted
      ? `Category: Unbudgeted\n`
      : `Category: ${categoryName ?? "None (will need review)"}\n`;
  }
  msg += `Date: ${today}\n\n`;
  if (type === "expense") {
    msg += `1 — ✅ Confirm\n`;
    msg += `2 — ❌ Cancel\n`;
    msg += `3 — 📋 Change category\n`;
  } else {
    msg += `1 — ✅ Confirm\n`;
    msg += `2 — ❌ Cancel\n`;
  }

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

  const amountFormatted = formatMoney(pending.amount, { minimumFractionDigits: 2 });

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
// Handle "category" command — list categories for pending transaction
// ---------------------------------------------------------------------------

async function handleCategoryList(chatId: number): Promise<void> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE telegram_chat_id = ? LIMIT 1",
    [chatId],
  );
  if (!user || !user.default_workspace_id) return;

  const pending = await fetchOne<PendingTransaction>(
    `SELECT id, type, amount, description, category_id
     FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'telegram'
     ORDER BY created_at DESC LIMIT 1`,
    [user.default_workspace_id, user.id],
  );

  if (!pending) {
    await sendTelegramMessage(chatId, "❓ No pending transaction. Send an expense first.");
    return;
  }

  if (pending.type !== "expense") {
    await sendTelegramMessage(chatId, "ℹ️ Income transactions don't need a category. Reply yes to confirm.");
    return;
  }

  const categories = await fetchMany<CategoryRow>(
    "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense' ORDER BY name ASC",
    [user.default_workspace_id],
  );

  if (categories.length === 0) {
    await sendTelegramMessage(chatId, "⚠️ No categories found in this workspace. Create some in the app first.");
    return;
  }

  let msg = "📋 Pick a category:\n\n";
  categories.forEach((c, i) => {
    const current = c.id === pending.category_id ? " ← current" : "";
    msg += `  ${i + 4}. ${c.name}${current}\n`;
  });
  msg += `\nReply with the number to change and confirm.`;

  await sendTelegramMessage(chatId, msg);
}

// ---------------------------------------------------------------------------
// Handle numeric category pick — change category and confirm
// ---------------------------------------------------------------------------

async function handleCategoryPick(chatId: number, pick: number): Promise<boolean> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE telegram_chat_id = ? LIMIT 1",
    [chatId],
  );
  if (!user || !user.default_workspace_id) return false;

  const pending = await fetchOne<PendingTransaction>(
    `SELECT id, type, amount, description, category_id
     FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'telegram'
     ORDER BY created_at DESC LIMIT 1`,
    [user.default_workspace_id, user.id],
  );

  if (!pending || pending.type !== "expense") return false;

  const categories = await fetchMany<CategoryRow>(
    "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense' ORDER BY name ASC",
    [user.default_workspace_id],
  );

  if (pick < 1 || pick > categories.length) return false;

  const chosen = categories[pick - 1];

  // Update category and confirm
  await execute(
    `UPDATE Transaction SET category_id = ?, status = 'confirmed', confirmed_at = NOW(3), confirmed_by_user_id = ?, updated_at = NOW(3) WHERE id = ?`,
    [chosen.id, user.id, pending.id],
  );

  const amountFormatted = formatMoney(pending.amount, { minimumFractionDigits: 2 });

  await sendTelegramMessage(
    chatId,
    `✅ Confirmed!\n\n${amountFormatted} — ${pending.description ?? "—"}\nCategory: ${chosen.name}`,
  );

  console.log(`[telegram] User ${user.id} changed category to ${chosen.name} and confirmed transaction #${pending.id}`);
  return true;
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
