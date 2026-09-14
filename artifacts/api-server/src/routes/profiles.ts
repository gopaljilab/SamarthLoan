import { Router, type IRouter } from "express";
import { db, applicantProfiles } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/profiles", (req, res) => {
  const profile = { ...req.body, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const saved = db.insert(applicantProfiles).values(profile).returning().get();
  return res.status(201).json(saved);
});
router.get("/profiles", (_req, res) => res.json(db.select().from(applicantProfiles).all()));
router.get("/profiles/:id", (req, res) => {
  const profile = db.select().from(applicantProfiles).where(eq(applicantProfiles.id, req.params.id)).get();
  return profile ? res.json(profile) : res.status(404).json({ error: "Applicant profile not found" });
});
router.delete("/profiles/:id", (req, res) => {
  const deleted = db.delete(applicantProfiles).where(eq(applicantProfiles.id, req.params.id)).returning().get();
  return deleted ? res.status(204).send() : res.status(404).json({ error: "Applicant profile not found" });
});

export default router;