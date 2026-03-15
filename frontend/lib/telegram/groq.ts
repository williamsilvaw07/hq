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
    prompt: "This audio may be in English or Brazilian Portuguese (pt-BR).",
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
 * Uses Groq LLaMA to pick the best matching category from the user's budgets.
 * Returns the category name string, or null if none match well.
 */
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
