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
    language: "pt", // supports PT-BR and EN automatically
    response_format: "text",
  });

  return (transcription as unknown as string).trim();
}

/**
 * Uses Groq LLaMA to pick the best matching category from the user's budgets.
 * Returns the category name string, or null if none match well.
 */
export async function categorizeExpense(
  description: string,
  categories: { id: number; name: string }[],
): Promise<number | null> {
  if (categories.length === 0) return null;

  const groq = getGroq();

  const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join("\n");

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are an expense categorizer. Given an expense description and a list of budget categories, reply with ONLY the numeric ID of the most appropriate category. No explanation, just the number.",
      },
      {
        role: "user",
        content: `Expense: "${description}"\n\nCategories:\n${categoryList}\n\nReply with only the category ID number.`,
      },
    ],
    temperature: 0,
    max_tokens: 10,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  const id = parseInt(raw, 10);

  if (isNaN(id)) return null;

  // Validate it's actually one of the provided IDs
  const valid = categories.find((c) => c.id === id);
  return valid ? valid.id : null;
}
