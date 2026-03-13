import { createHmac } from "crypto";

/**
 * Verifies the X-Hub-Signature-256 header from Meta.
 * Returns true if valid or if META_APP_SECRET is not configured (dev mode).
 */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.warn("[whatsapp] META_APP_SECRET not set — skipping signature verification");
    return true;
  }
  if (!signatureHeader) return false;

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  // Constant-time comparison
  if (expected.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}
