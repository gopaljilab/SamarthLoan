import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { postgresDb, users } from "@workspace/db/postgres";
import { hashPassword, verifyPassword } from "../auth/passwords";
import { createSession, invalidateSession, sessionCookieName } from "../auth/sessions";
import { requireAuth } from "../middleware/auth";
import { loadAuthUser } from "../middleware/auth";
import { parseLoginInput, parseRegisterInput } from "../auth/validation";
import { authRateLimit } from "../middleware/rate-limit";

const router: IRouter = Router();

router.use(authRateLimit);

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

function safeUser(user: { id: string; name: string; email: string; role: "USER" | "ADMIN"; status: "ACTIVE" | "SUSPENDED" }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

router.post("/auth/register", async (req, res, next) => {
  try {
    const input = parseRegisterInput(req.body);
    const passwordHash = await hashPassword(input.password);
    const existing = await postgresDb.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existing[0]) {
      res.status(409).json({ error: { code: "EMAIL_ALREADY_REGISTERED", message: "An account already exists for this email." } });
      return;
    }
    const [user] = await postgresDb.insert(users).values({ name: input.name, email: input.email, passwordHash }).returning();
    const session = await createSession(user.id);
    res.status(201).cookie(sessionCookieName, session.token, cookieOptions(session.expiresAt)).json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const input = parseLoginInput(req.body);
    const [user] = await postgresDb.select().from(users).where(eq(users.email, input.email)).limit(1);
    const valid = user?.passwordHash ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !valid || user.status !== "ACTIVE") {
      res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
      return;
    }
    const session = await createSession(user.id);
    res.cookie(sessionCookieName, session.token, cookieOptions(session.expiresAt)).json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post("/auth/logout", async (req, res, next) => {
  try {
    await invalidateSession(req.cookies?.[sessionCookieName]);
    res.clearCookie(sessionCookieName, cookieOptions(new Date(0))).status(204).send();
  } catch (error) { next(error); }
});

router.get("/auth/me", loadAuthUser, requireAuth, (req, res) => res.json({ user: req.authUser }));

export default router;
