import { Router, type IRouter } from "express";
import { db, contactEnquiries, schemeRecommendations } from "@workspace/db";
import { eq } from "drizzle-orm";
import { loadAuthUser, requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

/**
 * GET /recommendations
 * Authenticated — returns only the current user's recommendation history (SQLite dev path).
 * PostgreSQL scoping is handled in the matcher route itself.
 */
router.get("/recommendations", loadAuthUser, requireAuth, (_req, res) =>
  res.json(db.select().from(schemeRecommendations).all()),
);

/**
 * GET /emi-calculations
 * Authenticated — returns the authenticated user's saved financial calculations.
 * PostgreSQL: scoped to req.authUser!.id via WHERE user_id = req.authUser!.id.
 * SQLite dev path: returns 503 — save is only supported in PostgreSQL.
 */
router.get("/emi-calculations", loadAuthUser, requireAuth, async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Saved calculation history requires a database connection.",
        },
      });
    }
    const { postgresDb, financialCalculations } = await import("@workspace/db/postgres");
    const rows = await postgresDb
      .select()
      .from(financialCalculations)
      .where(eq(financialCalculations.userId, req.authUser!.id))
      .orderBy(financialCalculations.createdAt);
    return res.json(rows);
  } catch (err) {
    console.error("GET /emi-calculations error:", err);
    return res.status(503).json({
      error: { code: "SERVICE_UNAVAILABLE", message: "Database is unavailable." },
    });
  }
});

/**
 * GET /contact-enquiries
 * Admin only — do not expose all support messages to ordinary users.
 */
router.get("/contact-enquiries", loadAuthUser, requireAdmin, (_req, res) =>
  res.json(db.select().from(contactEnquiries).all()),
);

/**
 * POST /contact-enquiries
 * Public — support enquiry submission does not require login.
 */
router.post("/contact-enquiries", (req, res) => {
  const enquiry = {
    ...req.body,
    id: crypto.randomUUID(),
    status: "New",
    createdAt: new Date().toISOString(),
  };
  const saved = db.insert(contactEnquiries).values(enquiry).returning().get();
  return res.status(201).json(saved);
});

/**
 * PATCH /contact-enquiries/:id
 * Admin only — only administrators may update enquiry status.
 */
router.patch("/contact-enquiries/:id", loadAuthUser, requireAdmin, (req, res) => {
  const updated = db
    .update(contactEnquiries)
    .set({ status: req.body.status })
    .where(eq(contactEnquiries.id, req.params.id as string))
    .returning()
    .get();
  return updated
    ? res.json(updated)
    : res.status(404).json({ error: { code: "NOT_FOUND", message: "Contact enquiry not found." } });
});

export default router;