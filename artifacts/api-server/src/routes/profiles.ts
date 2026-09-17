import { Router, type IRouter } from "express";
import { db, applicantProfiles } from "@workspace/db";
import { eq } from "drizzle-orm";
import { loadAuthUser, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// All profile routes require an active, authenticated session.
// Ownership is enforced by matching the profile id to req.authUser.id
// (using authUser id as profile id so every user has exactly one profile record).
router.use(loadAuthUser, requireAuth);

/**
 * POST /profiles
 * Creates or overwrites the authenticated user's profile.
 * The profile id IS the user id — so a user can only own one profile and cannot
 * create a profile on behalf of another user.
 */
router.post("/profiles", (req, res) => {
  const profile = {
    ...req.body,
    id: req.authUser!.id,          // ownership tied to session, not body
    createdAt: new Date().toISOString(),
  };
  const saved = db.insert(applicantProfiles).values(profile).onConflictDoUpdate({
    target: applicantProfiles.id,
    set: { ...req.body, id: req.authUser!.id },
  }).returning().get();
  return res.status(201).json(saved);
});

/**
 * GET /profiles
 * Returns only the authenticated user's own profile (not a global list).
 */
router.get("/profiles", (req, res) => {
  const profile = db
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, req.authUser!.id))
    .get();
  return profile
    ? res.json(profile)
    : res.status(404).json({ error: { code: "NOT_FOUND", message: "Profile not found." } });
});

/**
 * GET /profiles/:id
 * A user can only retrieve their own profile.
 */
router.get("/profiles/:id", (req, res) => {
  if (req.params.id !== req.authUser!.id) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied." } });
  }
  const profile = db
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, req.authUser!.id))
    .get();
  return profile
    ? res.json(profile)
    : res.status(404).json({ error: { code: "NOT_FOUND", message: "Profile not found." } });
});

/**
 * DELETE /profiles/:id
 * A user can only delete their own profile.
 */
router.delete("/profiles/:id", (req, res) => {
  if (req.params.id !== req.authUser!.id) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied." } });
  }
  db.delete(applicantProfiles).where(eq(applicantProfiles.id, req.authUser!.id)).run();
  return res.status(204).send();
});

export default router;