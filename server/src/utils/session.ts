import crypto from "crypto";

export const SESSION_DURATION = 7 * 24 * 60 * 60;

export function hashSessionId(sessionId: string): string {
  return crypto.createHash("sha256").update(sessionId).digest("hex");
}

export function getRedisSessionKey(sessionId: string): string {
  return `session:${hashSessionId(sessionId)}`;
}
