import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { authSessions, postgresDb, users } from "@workspace/db/postgres";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
};

export const sessionCookieName = process.env.AUTH_COOKIE_NAME ?? "samarthloan_session";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await postgresDb.insert(authSessions).values({ userId, tokenHash: hashSessionToken(token), expiresAt });
  return { token, expiresAt };
}

export async function getSessionUser(token: string | undefined): Promise<AuthenticatedUser | null> {
  if (!token) return null;
  const result = await postgresDb
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, status: users.status })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(eq(authSessions.tokenHash, hashSessionToken(token)), isNull(authSessions.invalidatedAt), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  return result[0] ?? null;
}

export async function invalidateSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await postgresDb
    .update(authSessions)
    .set({ invalidatedAt: new Date() })
    .where(and(eq(authSessions.tokenHash, hashSessionToken(token)), isNull(authSessions.invalidatedAt)));
}
