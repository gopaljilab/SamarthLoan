import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { loadAuthUser, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// All application routes require an authenticated session.
// req.authUser.id is the sole source of ownership. No frontend-supplied userId is accepted.
router.use(loadAuthUser, requireAuth);

const IS_POSTGRES = Boolean(process.env.DATABASE_URL);

// ─── Postgres path ────────────────────────────────────────────────────────────

async function getPgDb() {
  // Lazy import so the module fails loudly if DATABASE_URL is unexpectedly missing.
  const { postgresDb, schemeApplications } = await import("@workspace/db/postgres");
  return { postgresDb, schemeApplications };
}

// ─── SQLite path (development only) ──────────────────────────────────────────

function getSqliteDb() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { db, applications } = require("@workspace/db");
  return { db, applications };
}

// =============================================================================
// POST /applications — create a new application
// =============================================================================
router.post("/applications", async (req, res) => {
  try {
    const { schemeId, partnerId, requestedAmount, purpose } = req.body;
    
    if (!schemeId) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "schemeId is required." } });
    }

    if (IS_POSTGRES) {
      const { postgresDb, schemeApplications } = await getPgDb();
      const applicationReference = `SS-${Date.now().toString().slice(-6)}`;
      
      const [inserted] = await postgresDb.insert(schemeApplications).values({
        userId: req.authUser!.id,
        schemeId,
        partnerId: partnerId || null,
        requestedAmount: requestedAmount || "0",
        purpose: purpose || "",
        applicationReference,
        status: "DRAFT",
      }).returning();
      
      return res.status(201).json(inserted);
    }
    
    return res.status(503).json({ error: { code: "UNAVAILABLE", message: "Creating applications requires PostgreSQL." } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create application." } });
  }
});

// =============================================================================
// GET /applications — return only the authenticated user's applications
// =============================================================================
router.get("/applications", async (req, res) => {
  try {
    if (IS_POSTGRES) {
      const { postgresDb, schemeApplications } = await getPgDb();
      // WHERE user_id = req.authUser!.id — database-level filter, not JS filter
      const rows = await postgresDb
        .select()
        .from(schemeApplications)
        .where(eq(schemeApplications.userId, req.authUser!.id));
      return res.json(rows);
    }

    // Dev SQLite: auth-gated but no userId column — returns all (noted below)
    // NOTE: row-level ownership is NOT enforced in SQLite dev mode.
    const { db, applications } = getSqliteDb();
    return res.json(db.select().from(applications).all());
  } catch (err) {
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to retrieve applications." } });
  }
});

// =============================================================================
// GET /applications/:id — return one application, verified to belong to authUser
// =============================================================================
router.get("/applications/:id", async (req, res) => {
  try {
    if (IS_POSTGRES) {
      const { postgresDb, schemeApplications } = await getPgDb();
      // Both conditions in one query — no two-step fetch-then-check
      const [row] = await postgresDb
        .select()
        .from(schemeApplications)
        .where(
          and(
            eq(schemeApplications.id, req.params.id),
            eq(schemeApplications.userId, req.authUser!.id),  // ownership at DB level
          ),
        )
        .limit(1);
      // Return 404 regardless of whether the app exists but belongs to another user
      // to avoid leaking existence of another user's application.
      if (!row) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
      }
      return res.json(row);
    }

    const { db, applications } = getSqliteDb();
    const app = db.select().from(applications).where(eq(applications.id, req.params.id)).get();
    if (!app) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
    return res.json(app);
  } catch (err) {
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to retrieve application." } });
  }
});

// =============================================================================
// PATCH /applications/:id — update, ownership enforced in the UPDATE itself
// =============================================================================
router.patch("/applications/:id", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};
  if (body.status !== undefined) allowed.status = body.status;
  if (body.purpose !== undefined) allowed.purpose = body.purpose;

  if (!Object.keys(allowed).length) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "At least one updatable field is required." } });
  }

  try {
    if (IS_POSTGRES) {
      const { postgresDb, schemeApplications } = await getPgDb();
      // The WHERE includes both id AND userId — even if id is guessed, the row
      // will not be updated unless it genuinely belongs to the authenticated user.
      const [updated] = await postgresDb
        .update(schemeApplications)
        .set({ ...allowed, updatedAt: new Date() })
        .where(
          and(
            eq(schemeApplications.id, req.params.id),
            eq(schemeApplications.userId, req.authUser!.id),  // ownership at DB level
          ),
        )
        .returning();
      if (!updated) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
      }
      return res.json(updated);
    }

    const { db, applications } = getSqliteDb();
    const existing = db.select().from(applications).where(eq(applications.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
    const updated = db.update(applications).set(allowed).where(eq(applications.id, req.params.id)).returning().get();
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update application." } });
  }
});

// =============================================================================
// DELETE /applications/:id — delete, ownership enforced in the DELETE itself
// =============================================================================
router.delete("/applications/:id", async (req, res) => {
  try {
    if (IS_POSTGRES) {
      const { postgresDb, schemeApplications } = await getPgDb();
      // WHERE includes both id AND userId. If someone tries to delete another
      // user's record by guessing the UUID, zero rows are affected.
      const [deleted] = await postgresDb
        .delete(schemeApplications)
        .where(
          and(
            eq(schemeApplications.id, req.params.id),
            eq(schemeApplications.userId, req.authUser!.id),  // ownership at DB level
          ),
        )
        .returning({ id: schemeApplications.id });
      if (!deleted) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
      }
      return res.status(204).send();
    }

    const { db, applications } = getSqliteDb();
    const existing = db.select().from(applications).where(eq(applications.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Application not found." } });
    db.delete(applications).where(eq(applications.id, req.params.id)).run();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete application." } });
  }
});

export default router;