import { Router, type IRouter } from "express";
import { db, contactEnquiries, emiCalculations, schemeRecommendations } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/recommendations", (_req, res) => res.json(db.select().from(schemeRecommendations).all()));
router.get("/emi-calculations", (_req, res) => res.json(db.select().from(emiCalculations).all()));
router.get("/contact-enquiries", (_req, res) => res.json(db.select().from(contactEnquiries).all()));
router.post("/contact-enquiries", (req, res) => {
  const enquiry = { ...req.body, id: crypto.randomUUID(), status: "New", createdAt: new Date().toISOString() };
  const saved = db.insert(contactEnquiries).values(enquiry).returning().get();
  return res.status(201).json(saved);
});
router.patch("/contact-enquiries/:id", (req, res) => {
  const updated = db.update(contactEnquiries).set({ status: req.body.status }).where(eq(contactEnquiries.id, req.params.id)).returning().get();
  return updated ? res.json(updated) : res.status(404).json({ error: "Contact enquiry not found" });
});

export default router;