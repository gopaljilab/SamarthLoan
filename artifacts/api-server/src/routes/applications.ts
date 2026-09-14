import { Router, type IRouter } from "express";
import { db, applications } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/applications", (_req, res) => res.json(db.select().from(applications).all()));
router.patch("/applications/:id", (req, res) => {
  const allowed = (({ status, partnerId, address, documents }) => ({ status, partnerId, address, documents }))(req.body);
  const updates = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
  if (!Object.keys(updates).length) return res.status(400).json({ error: "At least one application field is required" });
  const updated = db.update(applications).set(updates).where(eq(applications.id, req.params.id)).returning().get();
  return updated ? res.json(updated) : res.status(404).json({ error: "Application not found" });
});
router.delete("/applications/:id", (req, res) => {
  const deleted = db.delete(applications).where(eq(applications.id, req.params.id)).returning().get();
  return deleted ? res.status(204).send() : res.status(404).json({ error: "Application not found" });
});

export default router;