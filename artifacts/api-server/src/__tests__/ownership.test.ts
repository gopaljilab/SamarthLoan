/**
 * ownership.test.ts
 *
 * Backend IDOR / ownership tests for SamarthLoan API.
 * Runner: node --test (Node >= 20 built-in test runner, no extra dependencies)
 *
 * Tests requiring DATABASE_URL are explicitly marked BLOCKED and skip gracefully.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

const HAS_DB = Boolean(process.env.DATABASE_URL);

function blocked(name: string) {
  it(`BLOCKED — ${name} (DATABASE_URL unavailable)`, () => {
    if (!HAS_DB) {
      console.log(`    → SKIP: DATABASE_URL required`);
      return; // skip without failing
    }
    assert.fail("Test body not yet implemented for live Postgres environment");
  });
}

// ─── 1. Unauthenticated requests must return 401 ─────────────────────────────
describe("Auth enforcement — 401 for anonymous requests", () => {
  blocked("GET /api/applications → 401");
  blocked("GET /api/profiles → 401");
  blocked("GET /api/recommendations → 401");
  blocked("GET /api/emi-calculations → 401");
  blocked("POST /api/schemes/recommend → 401");
  blocked("GET /api/profiles/:id → 401");
  blocked("DELETE /api/profiles/:id → 401");
  blocked("PATCH /api/applications/:id → 401");
  blocked("DELETE /api/applications/:id → 401");
});

// ─── 2. Public endpoints must NOT require auth ────────────────────────────────
describe("Public endpoints — accessible without auth", () => {
  blocked("GET /api/schemes → 200");
  blocked("POST /api/calculator/emi → 200 with valid input");
  blocked("POST /api/contact-enquiries → 201");
});

// ─── 3. Applications IDOR — Postgres cross-user access ───────────────────────
describe("Applications IDOR — User B cannot access User A data", () => {
  /**
   * Full test steps once DATABASE_URL is available:
   *   1. Register User A  → POST /api/auth/register → session cookie A
   *   2. Register User B  → POST /api/auth/register → session cookie B
   *   3. User A: POST /api/schemes/recommend → persist match request owned by User A
   *   4. User A: Create application (requires real scheme UUID from DB)
   *   5. User B: GET /api/applications/:userA_app_id → expect 404 (no ownership leak)
   *   6. User B: PATCH /api/applications/:userA_app_id → expect 404
   *   7. User B: DELETE /api/applications/:userA_app_id → expect 404
   *   8. User B: GET /api/applications → must not contain User A's records
   *   9. User A: GET /api/applications/:id → expect 200 (own record)
   *  10. User A: PATCH /api/applications/:id → expect 200 (own record)
   *  11. User A: DELETE /api/applications/:id → expect 204 (own record)
   */
  blocked("User B GET /api/applications/:userA_id → 404");
  blocked("User B PATCH /api/applications/:userA_id → 404");
  blocked("User B DELETE /api/applications/:userA_id → 404");
  blocked("GET /api/applications as User B returns empty (no User A records)");
  blocked("User A can GET own application → 200");
  blocked("User A can PATCH own application → 200");
  blocked("User A can DELETE own application → 204");
});

// ─── 4. Profile IDOR — route-level enforcement ───────────────────────────────
describe("Profile ownership — route-level enforcement", () => {
  /**
   * profiles.ts enforces: if (req.params.id !== req.authUser!.id) → 403
   * This is enforced at the Express layer without needing a DB query.
   * Test still requires the session middleware (needs DATABASE_URL to boot).
   */
  blocked("User B GET /api/profiles/:userA_id → 403");
  blocked("User B DELETE /api/profiles/:userA_id → 403");
  blocked("User A GET /api/profiles/:own_id → 200");
});

// ─── 5. Scheme match ownership ────────────────────────────────────────────────
describe("Scheme match history — ownership via userId FK", () => {
  /**
   * schemeMatchRequests.userId = req.authUser!.id is enforced at INSERT.
   * Read endpoints for match history are not yet exposed; this will be
   * verified in Phase 4D when the matcher history read endpoint is added.
   */
  blocked("POST /api/schemes/recommend persists with correct userId (DB verify)");
  blocked("User B cannot access User A match history");
});

// ─── 6. Static analysis assertions (no DB needed) ────────────────────────────
describe("Static analysis — no insecure userId patterns in routes", () => {
  it("No req.body.userId in route files", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const routeDir = join(import.meta.dirname ?? __dirname, "..", "routes");
    const files = readdirSync(routeDir).filter(f => f.endsWith(".ts"));
    for (const file of files) {
      const src = readFileSync(join(routeDir, file), "utf8");
      assert.ok(
        !src.includes("req.body.userId"),
        `${file} contains req.body.userId — ownership must come from req.authUser.id`,
      );
      assert.ok(
        !src.includes("req.query.userId"),
        `${file} contains req.query.userId — ownership must come from req.authUser.id`,
      );
      assert.ok(
        !src.includes("00000000-0000-0000-0000-000000000000"),
        `${file} contains a hardcoded zero-UUID — fake user IDs are not allowed`,
      );
    }
  });

  it("No example.gov.in in any source file", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const srcDir = join(import.meta.dirname ?? __dirname, "..");
    const files = readdirSync(srcDir, { recursive: true })
      .filter((f): f is string => typeof f === "string" && f.endsWith(".ts") && !f.includes("__tests__"));
    for (const file of files) {
      const src = readFileSync(join(srcDir, file), "utf8");
      assert.ok(
        !src.includes("example.gov.in"),
        `${file} contains example.gov.in — placeholder government URLs are not allowed`,
      );
    }
  });
});
