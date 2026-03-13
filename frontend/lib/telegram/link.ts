import { fetchOne, insertOne, execute } from "@/lib/sql";

type LinkCodeRow = {
  user_id: number;
  expires_at: string;
};

/**
 * Generates and stores a new linking code for a user.
 * Replaces any existing code for that user.
 * Returns the 6-character uppercase code.
 */
export async function generateLinkCode(userId: number): Promise<string> {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Remove any existing code for this user
  await execute("DELETE FROM telegram_link_codes WHERE user_id = ?", [userId]);

  await insertOne(
    "INSERT INTO telegram_link_codes (user_id, code, expires_at) VALUES (?, ?, ?)",
    [userId, code, expiresAt.toISOString().slice(0, 19).replace("T", " ")],
  );

  return code;
}

/**
 * Validates a linking code and returns the user_id if valid and not expired.
 * Returns null if the code is invalid or expired.
 */
export async function validateLinkCode(code: string): Promise<number | null> {
  const row = await fetchOne<LinkCodeRow>(
    "SELECT user_id, expires_at FROM telegram_link_codes WHERE code = ? LIMIT 1",
    [code.toUpperCase()],
  );

  if (!row) return null;

  const now = new Date();
  const expires = new Date(row.expires_at);
  if (now > expires) {
    await execute("DELETE FROM telegram_link_codes WHERE code = ?", [code.toUpperCase()]);
    return null;
  }

  return row.user_id;
}

/**
 * Links a telegram_chat_id to a user and deletes the used code.
 */
export async function linkTelegramAccount(userId: number, telegramChatId: number): Promise<void> {
  await execute("UPDATE User SET telegram_chat_id = ? WHERE id = ?", [telegramChatId, userId]);
  await execute("DELETE FROM telegram_link_codes WHERE user_id = ?", [userId]);
}
