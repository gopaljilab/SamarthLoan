import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Process-local protection for credential endpoints. Production deployments
 * should replace this with a shared store-backed limiter when horizontally
 * scaled; this still prevents rapid retries on a single API instance.
 */
export function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ip || "unknown";
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + 15 * 60 * 1000 }
    : existing;
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > 20) {
    res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Try again later." } });
    return;
  }
  next();
}
