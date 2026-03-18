import Groq from "groq-sdk";

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("[groq] Missing GROQ_API_KEY");
  return new Groq({ apiKey });
}

/**
 * Transcribes a voice file buffer using Groq Whisper.
 * Accepts .ogg (Telegram voice format).
 */
export async function transcribeAudio(audioBuffer: Buffer, filename = "voice.ogg"): Promise<string> {
  const groq = getGroq();

  const file = new File([new Uint8Array(audioBuffer)], filename, { type: "audio/ogg" });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    response_format: "text",
    prompt: "Expense and income tracking. gastei 20 no uber, comprei comida por 50 reais, paguei 150 de luz, recebi 500 salário, uber 20, income 500, almoço 35, gasolina 200, mercado 180, farmácia 45, internet 100, aluguel 1500, spent 30 on groceries, taxi 25, coffee 8.",
  });

  return (transcription as unknown as string).trim();
}

/**
 * Uses Groq LLaMA Vision to extract expense data from an image (e.g. receipt).
 * Returns a plain text description like "42.50 restaurant" or null if nothing found.
 */
export async function extractExpenseFromImage(imageBuffer: Buffer): Promise<string | null> {
  const groq = getGroq();

  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
          {
            type: "text",
            text: `Look at this image. If it shows a receipt, bill, price tag, or any expense-related content, extract the total amount and a short description.

Reply in this exact format (one line only):
AMOUNT: <number> | DESCRIPTION: <short description>

Examples:
AMOUNT: 42.50 | DESCRIPTION: restaurant dinner
AMOUNT: 120.00 | DESCRIPTION: supermarket groceries

If you cannot find a clear expense amount, reply with: NONE`,
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 50,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  console.log("[groq] Vision response:", raw);

  if (raw === "NONE" || !raw.includes("AMOUNT:")) return null;

  // Parse "AMOUNT: 42.50 | DESCRIPTION: restaurant dinner"
  const amountMatch = raw.match(/AMOUNT:\s*([\d.,]+)/i);
  const descMatch = raw.match(/DESCRIPTION:\s*(.+)/i);

  if (!amountMatch || !descMatch) return null;

  const amount = amountMatch[1].trim();
  const desc = descMatch[1].trim();

  return `${amount} ${desc}`;
}

/**
 * AI-powered message handler. Given a user message that wasn't parsed as an expense,
 * the AI either extracts an expense from natural language OR responds conversationally.
 *
 * Returns:
 *   { type: "expense", text: "20 uber" } — AI extracted an expense, re-parse it
 *   { type: "reply", text: "..." } — AI conversational response to send back
 */
export async function handleSmartMessage(
  userMessage: string,
  userName: string,
  workspaceName: string,
): Promise<{ type: "expense"; text: string } | { type: "reply"; text: string }> {
  const groq = getGroq();

  const systemPrompt = `You are NorthTrack, a friendly financial assistant bot on Telegram/WhatsApp. You help users track expenses and income.

Your capabilities:
- Log expenses: user sends amount + description (e.g. "20 uber", "gastei 50 mercado")
- Log income: user says "income 500 salary" or "recebi 500 salário"
- Voice messages: user can send audio and you'll transcribe it
- Photo receipts: user can snap a photo and you'll extract the expense
- Change category: reply "3" after an expense to pick a different category
- Confirm/cancel: reply "1" to confirm, "2" to cancel a pending transaction
- Switch workspace: send "/workspace" or "workspace"
- Check status: send "/status" or "status"

Current user: ${userName}
Current workspace: ${workspaceName}

RULES:
1. If the user's message contains an expense or income (even in natural language), extract it and respond with EXACTLY this format on the first line:
   EXPENSE: <amount> <description>
   or
   INCOME: <amount> <description>

   Examples:
   - "I spent thirty bucks on gas" → EXPENSE: 30 gas
   - "paid 150 for electricity" → EXPENSE: 150 electricity
   - "got paid 3000 this month" → INCOME: 3000 salary
   - "comprei um café por 8 reais" → EXPENSE: 8 café

2. If the message is NOT an expense/income (greeting, question, random word, etc.), reply naturally in a friendly way. Keep it short (2-3 sentences max). Always mention what the user can do. Reply in the same language the user wrote in (Portuguese or English).

3. Never make up transactions. Only extract if there's a clear amount.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";

  // Check if AI extracted an expense
  const expenseMatch = raw.match(/^EXPENSE:\s*(.+)$/m);
  if (expenseMatch) {
    return { type: "expense", text: expenseMatch[1].trim() };
  }

  const incomeMatch = raw.match(/^INCOME:\s*(.+)$/m);
  if (incomeMatch) {
    return { type: "expense", text: `income ${incomeMatch[1].trim()}` };
  }

  // Otherwise return the AI's conversational reply
  return { type: "reply", text: raw };
}

/**
 * Uses Groq LLaMA to pick the best matching category from the user's budgets.
 * On retry=true uses a more lenient prompt to force a best-guess pick.
 * Returns null only if categories list is empty.
 */
export async function categorizeExpense(
  description: string,
  categories: { id: number; name: string }[],
  retry = false,
): Promise<number | null> {
  if (categories.length === 0) return null;

  const groq = getGroq();
  const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join("\n");

  const systemPrompt = retry
    ? "You are an expense categorizer. You MUST pick the closest matching category even if the match is not perfect. Reply with ONLY the numeric ID. No explanation."
    : "You are an expense categorizer. Given an expense description and a list of budget categories, reply with ONLY the numeric ID of the most appropriate category. No explanation, just the number.";

  const userPrompt = retry
    ? `Expense: "${description}"\n\nCategories:\n${categoryList}\n\nPick the closest category ID. You must choose one. Reply with only the number.`
    : `Expense: "${description}"\n\nCategories:\n${categoryList}\n\nReply with only the category ID number.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: retry ? 0.2 : 0,
    max_tokens: 10,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  const id = parseInt(raw, 10);
  if (isNaN(id)) return null;

  const valid = categories.find((c) => c.id === id);
  return valid ? valid.id : null;
}
