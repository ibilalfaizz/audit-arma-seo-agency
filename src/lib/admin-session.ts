import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured on the server.");
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionCookieValue(): { value: string; maxAge: number } {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  return { value: `${payload}.${sign(payload)}`, maxAge: MAX_AGE_SECONDS };
}

// Self-verifying (HMAC-signed) so any server process can check it without
// shared session storage — no in-memory state to lose on a restart.
export function isValidSessionCookie(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length) return false;
  if (!crypto.timingSafeEqual(provided, wanted)) return false;

  return Number(payload) > Date.now();
}
