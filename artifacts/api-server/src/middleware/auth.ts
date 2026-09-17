import type { NextFunction, Request, Response } from "express";
import { getSessionUser, type AuthenticatedUser, sessionCookieName } from "../auth/sessions";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export async function loadAuthUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    req.authUser = (await getSessionUser(req.cookies?.[sessionCookieName])) ?? undefined;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sign in is required." } });
    return;
  }
  if (req.authUser.status !== "ACTIVE") {
    res.status(403).json({ error: { code: "ACCOUNT_INACTIVE", message: "This account is not active." } });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser || req.authUser.status !== "ACTIVE" || req.authUser.role !== "ADMIN") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Administrator access is required." } });
    return;
  }
  next();
}
