import { fetchOne, fetchMany, insertOne, execute } from "@/lib/sql";
import { formatMoney } from "@/lib/format";
import { parseExpenseMessage, suggestCategory, detectReply } from "@/lib/telegram/parse";
import { sendWhatsAppMessage } from "./send";
import { validateWhatsAppLinkCode, linkWhatsAppAccount } from "./link";
import { transcribeAudio, categorizeExpense, extractExpenseFromImage, handleSmartMessage } from "@/lib/telegram/groq";

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

export async function processWhatsAppMessage(
  messageId: string,
  from: string,
  text: string,
): Promise<void> {
  console.log(`[whatsapp] Processing message ${messageId} from ${from}: "${text}"`);

  // 1. Deduplication
  try {
    await insertOne(
      "INSERT INTO whatsapp_messages (whatsapp_message_id) VALUES (?)",
      [messageId],
    );
  } catch {
    console.log(`[whatsapp] Duplicate message ${messageId} — skipping`);
    return;
  }

  // 2. Check if this is a linking code (6 alphanumeric chars)
  const trimmed = text.trim();

  if (/^[A-Z0-9]{6}$/i.test(trimmed)) {
    const linkResult = await validateWhatsAppLinkCode(trimmed);
    if (linkResult) {
      await linkWhatsAppAccount(linkResult.userId, from, linkResult.workspaceId);
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
      welcome += "  workspace — View & switch workspaces\n";
      welcome += "  status — Show active workspace\n";
      welcome += "  help — Show this guide";

      await sendWhatsAppMessage(from, welcome);
      return;
    }
  }

  // 3. Handle commands (without slash since WhatsApp doesn't have bot commands)
  const lower = trimmed.toLowerCase();
  if (lower === "help" || lower === "start" || lower === "/help" || lower === "/start") {
    await handleHelpCommand(from);
    return;
  }
  if (lower === "status" || lower === "/status") {
    await handleStatusCommand(from);
    return;
  }
  if (lower.startsWith("workspace") || lower.startsWith("/workspace")) {
    const args = trimmed.replace(/^\/?workspace\s*/i, "").trim();
    await handleWorkspaceCommand(from, args);
    return;
  }

  // 4. Handle numbered replies (1=confirm, 2=cancel, 3=categories, 4+=category picks)
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num > 3) {
      const handled = await handleCategoryPick(from, num - 3);
      if (handled) return;
    }
    if (num === 1) { await handleConfirmation(from, "confirm"); return; }
    if (num === 2) { await handleConfirmation(from, "cancel"); return; }
    if (num === 3) { await handleCategoryList(from); return; }
  }

  // 4b. Check text-based confirmation/cancel/category replies
  const reply = detectReply(trimmed);
  if (reply === "confirm" || reply === "cancel") {
    await handleConfirmation(from, reply);
    return;
  }
  if (reply === "category") {
    await handleCategoryList(from);
    return;
  }

  // 5. Process as new expense/income
  await processExpenseText(messageId, from, trimmed);
}

export async function processWhatsAppVoice(
  messageId: string,
  from: string,
  mediaId: string,
): Promise<void> {
  console.log(`[whatsapp] Processing voice message ${messageId} from ${from}`);

  // Deduplication
  try {
    await insertOne(
      "INSERT INTO whatsapp_messages (whatsapp_message_id) VALUES (?)",
      [messageId],
    );
  } catch {
    console.log(`[whatsapp] Duplicate voice message ${messageId} — skipping`);
    return;
  }

  let audioBuffer: Buffer;
  try {
    audioBuffer = await downloadWhatsAppMedia(mediaId);
  } catch (err) {
    console.error("[whatsapp] Failed to download voice:", err);
    await sendWhatsAppMessage(from, "❌ Could not download your voice message. Please try again.");
    return;
  }

  let transcribed: string;
  try {
    transcribed = await transcribeAudio(audioBuffer, "voice.ogg");
    console.log(`[whatsapp] Transcribed voice: "${transcribed}"`);
  } catch (err) {
    console.error("[whatsapp] Transcription failed:", err);
    await sendWhatsAppMessage(from, "❌ Could not transcribe your voice message. Try typing instead.");
    return;
  }

  if (!transcribed) {
    await sendWhatsAppMessage(from, "❌ Couldn't hear anything. Please try again.");
    return;
  }

  await processExpenseText(messageId, from, transcribed);
}

export async function processWhatsAppImage(
  messageId: string,
  from: string,
  mediaId: string,
): Promise<void> {
  console.log(`[whatsapp] Processing image ${messageId} from ${from}`);

  // Deduplication
  try {
    await insertOne(
      "INSERT INTO whatsapp_messages (whatsapp_message_id) VALUES (?)",
      [messageId],
    );
  } catch {
    console.log(`[whatsapp] Duplicate image message ${messageId} — skipping`);
    return;
  }

  let imageBuffer: Buffer;
  try {
    imageBuffer = await downloadWhatsAppMedia(mediaId);
  } catch (err) {
    console.error("[whatsapp] Failed to download image:", err);
    await sendWhatsAppMessage(from, "❌ Could not download your image. Please try again.");
    return;
  }

  let extracted: string | null;
  try {
    extracted = await extractExpenseFromImage(imageBuffer);
    console.log(`[whatsapp] Vision extracted: "${extracted}"`);
  } catch (err) {
    console.error("[whatsapp] Vision extraction failed:", err);
    await sendWhatsAppMessage(from, "❌ Could not read the image. Try typing the expense instead.");
    return;
  }

  if (!extracted) {
    await sendWhatsAppMessage(from, "❓ Couldn't find an expense in that image.\n\nMake sure it shows a receipt or price clearly.");
    return;
  }

  await processExpenseText(messageId, from, extracted);
}

// ---------------------------------------------------------------------------
// WhatsApp media download
// ---------------------------------------------------------------------------

async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("Missing WHATSAPP_ACCESS_TOKEN");

  // Step 1: Get media URL
  const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const metaData = await metaRes.json() as { url?: string };
  if (!metaData.url) throw new Error("Failed to get media URL");

  // Step 2: Download the file
  const fileRes = await fetch(metaData.url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const arrayBuffer = await fileRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Commands (help, status, workspace)
// ---------------------------------------------------------------------------

async function handleHelpCommand(from: string): Promise<void> {
  let msg = "👋 Welcome to NorthTrack!\n\n";
  msg += "— How it works —\n";
  msg += "Send a message and I'll log it as a transaction. You can type, send a voice message, or snap a photo of a receipt.\n\n";
  msg += "Examples:\n";
  msg += "  20 uber → R$ 20 expense\n";
  msg += "  income 500 salary → R$ 500 income\n";
  msg += "  recebi 500 salário → R$ 500 income\n\n";
  msg += "After each entry I'll ask you to confirm (yes/no) before saving.\n\n";
  msg += "— Commands —\n";
  msg += "  workspace — View & switch workspaces\n";
  msg += "  status — Show active workspace\n";
  msg += "  help — Show this guide";
  await sendWhatsAppMessage(from, msg);
}

async function handleStatusCommand(from: string): Promise<void> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE whatsapp_id = ? LIMIT 1",
    [from],
  );
  if (!user) {
    await sendWhatsAppMessage(from, "👋 Your WhatsApp is not linked yet.\n\nOpen the app → Settings → Connect WhatsApp to get started.");
    return;
  }
  if (!user.default_workspace_id) {
    await sendWhatsAppMessage(from, "⚠️ No active workspace. Send *workspace* to pick one.");
    return;
  }
  const ws = await fetchOne<WorkspaceRow>("SELECT id, name FROM Workspace WHERE id = ? LIMIT 1", [user.default_workspace_id]);
  await sendWhatsAppMessage(from, `📂 Active workspace: ${ws?.name ?? "Unknown"}\n\nAll transactions are logged here. Send *workspace* to switch.`);
}

async function handleWorkspaceCommand(from: string, pick: string): Promise<void> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE whatsapp_id = ? LIMIT 1",
    [from],
  );

  if (!user) {
    await sendWhatsAppMessage(from, "👋 Your WhatsApp is not linked yet.\n\nOpen the app → Settings → Connect WhatsApp to get started.");
    return;
  }

  const workspaces = await fetchMany<WorkspaceRow>(
    `SELECT w.id, w.name FROM Workspace w
     JOIN workspace_users wu ON wu.workspace_id = w.id
     WHERE wu.user_id = ?
     ORDER BY w.name ASC`,
    [user.id],
  );

  if (workspaces.length === 0) {
    await sendWhatsAppMessage(from, "⚠️ You don't belong to any workspaces yet.");
    return;
  }

  if (pick) {
    const pickNum = parseInt(pick, 10);
    let target: WorkspaceRow | undefined;

    if (!isNaN(pickNum) && pickNum >= 1 && pickNum <= workspaces.length) {
      target = workspaces[pickNum - 1];
    } else {
      const lower = pick.toLowerCase();
      target = workspaces.find((w) => w.name.toLowerCase().includes(lower));
    }

    if (target) {
      await execute("UPDATE User SET default_workspace_id = ? WHERE id = ?", [target.id, user.id]);
      await sendWhatsAppMessage(from, `✅ Switched to workspace: ${target.name}\n\nAll new transactions will be logged here.`);
    } else {
      await sendWhatsAppMessage(from, `❌ Workspace not found. Send *workspace* to see your list.`);
    }
    return;
  }

  const current = user.default_workspace_id;
  let msg = "📂 Your workspaces:\n\n";
  workspaces.forEach((w, i) => {
    const active = w.id === current ? " ← active" : "";
    msg += `  ${i + 1}. ${w.name}${active}\n`;
  });
  msg += `\nTo switch, send:\n  workspace 1\n  workspace ${workspaces.length > 1 ? "2" : "1"}`;
  msg += `\n  workspace ${workspaces[0].name}`;

  await sendWhatsAppMessage(from, msg);
}

// ---------------------------------------------------------------------------
// Core: parse → draft → ask confirmation
// ---------------------------------------------------------------------------

async function processExpenseText(
  messageId: string,
  from: string,
  text: string,
): Promise<void> {
  // Look up user by their linked WhatsApp number
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE whatsapp_id = ? LIMIT 1",
    [from],
  );

  if (!user) {
    await sendWhatsAppMessage(
      from,
      "👋 Your WhatsApp is not linked to any account.\n\nOpen the app, go to Settings → Connect WhatsApp, and send the code shown.",
    );
    return;
  }

  const workspaceId = user.default_workspace_id;
  if (!workspaceId) {
    await sendWhatsAppMessage(
      from,
      "⚠️ No default workspace set. Send *workspace* to pick one.",
    );
    return;
  }

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
        await sendWhatsAppMessage(from, aiResult.text);
        return;
      }
      // AI extracted an expense — re-parse the cleaned text
      parsed = parseExpenseMessage(aiResult.text);
    } catch (err) {
      console.error("[whatsapp] AI smart message failed:", err);
    }

    if (!parsed) {
      await sendWhatsAppMessage(
        from,
        `❓ I couldn't find an expense in that message.\n\nHere's what I can do:\n  💸 Log expense — send "20 uber" or "gastei 50 mercado"\n  💰 Log income — send "income 500 salary"\n  🎤 Voice — send a voice message\n  📷 Receipt — send a photo\n  📂 workspace — switch workspace\n  ℹ️ status — check active workspace\n  ❓ help — see all options`,
      );
      return;
    }
  }

  const { amount, description, type, unbudgeted } = parsed;

  // Cancel any existing pending draft
  await execute(
    `DELETE FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'whatsapp'`,
    [workspaceId, user.id],
  );

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

  const today = new Date().toISOString().slice(0, 10);
  const txId = await insertOne(
    `INSERT INTO Transaction
       (workspace_id, category_id, created_by_user_id, type, amount, currency,
        exchange_rate, base_amount, date, description, source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'BRL', 1, ?, ?, ?, 'whatsapp', 'pending_confirmation', NOW(3), NOW(3))`,
    [workspaceId, categoryId, user.id, type, amount, amount, today, description],
  );

  const amountFormatted = formatMoney(amount, { minimumFractionDigits: 2 });

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

  await sendWhatsAppMessage(from, msg);

  console.log(`[whatsapp] Pending transaction #${txId} for user ${user.id} — ${amountFormatted} ${description} [${type}]`);
}

// ---------------------------------------------------------------------------
// Handle confirmation / cancellation
// ---------------------------------------------------------------------------

async function handleConfirmation(from: string, action: "confirm" | "cancel"): Promise<void> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE whatsapp_id = ? LIMIT 1",
    [from],
  );
  if (!user || !user.default_workspace_id) return;

  const pending = await fetchOne<PendingTransaction>(
    `SELECT id, type, amount, description, category_id
     FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'whatsapp'
     ORDER BY created_at DESC LIMIT 1`,
    [user.default_workspace_id, user.id],
  );

  if (!pending) {
    await sendWhatsAppMessage(from, "❓ Nothing to confirm. Send a new expense or income first.");
    return;
  }

  const amountFormatted = formatMoney(pending.amount, { minimumFractionDigits: 2 });

  if (action === "cancel") {
    await execute("DELETE FROM Transaction WHERE id = ?", [pending.id]);
    await sendWhatsAppMessage(from, `❌ Cancelled: ${amountFormatted} — ${pending.description ?? "—"}`);
    console.log(`[whatsapp] User ${user.id} cancelled transaction #${pending.id}`);
    return;
  }

  const isExpense = pending.type === "expense";
  const needsReview = isExpense && !pending.category_id;
  const newStatus = needsReview ? "draft" : "confirmed";

  await execute(
    `UPDATE Transaction SET status = ?, confirmed_at = NOW(3), confirmed_by_user_id = ?, updated_at = NOW(3) WHERE id = ?`,
    [newStatus, user.id, pending.id],
  );

  if (needsReview) {
    await sendWhatsAppMessage(
      from,
      `⏳ Saved for review!\n\n${amountFormatted} — ${pending.description ?? "—"}\n\nNo category matched — open the app to assign one.`,
    );
  } else {
    const typeEmoji = pending.type === "income" ? "💰" : "✅";
    let categoryInfo = "";
    if (isExpense && pending.category_id) {
      const cat = await fetchOne<CategoryRow>("SELECT name FROM Category WHERE id = ? LIMIT 1", [pending.category_id]);
      categoryInfo = `\nCategory: ${cat?.name ?? "—"}`;
    }
    await sendWhatsAppMessage(
      from,
      `${typeEmoji} Confirmed!\n\n${amountFormatted} — ${pending.description ?? "—"}${categoryInfo}`,
    );
  }

  console.log(`[whatsapp] User ${user.id} confirmed transaction #${pending.id} as ${newStatus}`);
}

// ---------------------------------------------------------------------------
// Handle "category" command — list categories for pending transaction
// ---------------------------------------------------------------------------

async function handleCategoryList(from: string): Promise<void> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE whatsapp_id = ? LIMIT 1",
    [from],
  );
  if (!user || !user.default_workspace_id) return;

  const pending = await fetchOne<PendingTransaction>(
    `SELECT id, type, amount, description, category_id
     FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'whatsapp'
     ORDER BY created_at DESC LIMIT 1`,
    [user.default_workspace_id, user.id],
  );

  if (!pending) {
    await sendWhatsAppMessage(from, "❓ No pending transaction. Send an expense first.");
    return;
  }

  if (pending.type !== "expense") {
    await sendWhatsAppMessage(from, "ℹ️ Income transactions don't need a category. Reply yes to confirm.");
    return;
  }

  const categories = await fetchMany<CategoryRow>(
    "SELECT id, name FROM Category WHERE workspace_id = ? AND type = 'expense' ORDER BY name ASC",
    [user.default_workspace_id],
  );

  if (categories.length === 0) {
    await sendWhatsAppMessage(from, "⚠️ No categories found in this workspace. Create some in the app first.");
    return;
  }

  let msg = "📋 Pick a category:\n\n";
  categories.forEach((c, i) => {
    const current = c.id === pending.category_id ? " ← current" : "";
    msg += `  ${i + 4}. ${c.name}${current}\n`;
  });
  msg += `\nReply with the number to change and confirm.`;

  await sendWhatsAppMessage(from, msg);
}

// ---------------------------------------------------------------------------
// Handle numeric category pick
// ---------------------------------------------------------------------------

async function handleCategoryPick(from: string, pick: number): Promise<boolean> {
  const user = await fetchOne<UserRow>(
    "SELECT id, name, default_workspace_id FROM User WHERE whatsapp_id = ? LIMIT 1",
    [from],
  );
  if (!user || !user.default_workspace_id) return false;

  const pending = await fetchOne<PendingTransaction>(
    `SELECT id, type, amount, description, category_id
     FROM Transaction
     WHERE workspace_id = ? AND created_by_user_id = ? AND status = 'pending_confirmation' AND source = 'whatsapp'
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

  await execute(
    `UPDATE Transaction SET category_id = ?, status = 'confirmed', confirmed_at = NOW(3), confirmed_by_user_id = ?, updated_at = NOW(3) WHERE id = ?`,
    [chosen.id, user.id, pending.id],
  );

  const amountFormatted = formatMoney(pending.amount, { minimumFractionDigits: 2 });

  await sendWhatsAppMessage(
    from,
    `✅ Confirmed!\n\n${amountFormatted} — ${pending.description ?? "—"}\nCategory: ${chosen.name}`,
  );

  console.log(`[whatsapp] User ${user.id} changed category to ${chosen.name} and confirmed transaction #${pending.id}`);
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

  if (unique.length > 0) {
    const keywordMatch = matchByKeywords(description, unique);
    if (keywordMatch !== null) {
      console.log(`[whatsapp] Keyword matched category ${keywordMatch}`);
      return { categoryId: keywordMatch };
    }
  }

  if (unique.length > 0) {
    try {
      const aiPick = await categorizeExpense(description, unique, false);
      if (aiPick !== null) {
        console.log(`[whatsapp] AI picked category ${aiPick}`);
        return { categoryId: aiPick };
      }
      const retryPick = await categorizeExpense(description, unique, true);
      if (retryPick !== null) {
        console.log(`[whatsapp] AI picked category ${retryPick} on retry`);
        return { categoryId: retryPick };
      }
    } catch (err) {
      console.error("[whatsapp] AI categorization failed:", err);
    }
  }

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
