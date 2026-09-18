import { Router, type IRouter } from "express";
import { CalculateEmiBody, RecommendSchemesBody, RecommendPartnersBody } from "@workspace/api-zod";
import { getEligiblePartners, resolvePincode, type UserLocation } from "../services/partner-routing";
import { loadAuthUser, requireAuth } from "../middleware/auth";
import { postgresDb, schemes as pgSchemes, schemeMatchRequests, schemeMatchResults } from "@workspace/db/postgres";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/schemes", async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database configuration missing." } });
    }
    const allSchemes = await postgresDb.select().from(pgSchemes);
    return res.json({ schemes: allSchemes, total: allSchemes.length });
  } catch (err) {
    return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database is unavailable." } });
  }
});

router.get("/schemes/:id", async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database configuration missing." } });
    }
    const [scheme] = await postgresDb.select().from(pgSchemes).where(eq(pgSchemes.id, req.params.id));
    return scheme ? res.json(scheme) : res.status(404).json({ error: { code: "NOT_FOUND", message: "Scheme not found" } });
  } catch (err) {
    if (err instanceof Error && err.message.includes("invalid input syntax for type uuid")) {
       return res.status(400).json({ error: { code: "INVALID_ID", message: "Invalid scheme ID format." } });
    }
    return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database is unavailable." } });
  }
});

router.post("/schemes/recommend", loadAuthUser, requireAuth, async (req, res) => {
  try {
    const input = RecommendSchemesBody.parse(req.body);
    
    if (!process.env.DATABASE_URL) {
      return res.json({ matches: [], total: 0 }); 
    }

    const allSchemes = await postgresDb.select().from(pgSchemes).where(eq(pgSchemes.status, 'ACTIVE'));
    if (allSchemes.length === 0) {
      return res.json({ matches: [], total: 0 });
    }

    const loan = Number(input.loanRequired ?? 0);
    const income = Number(input.income ?? 0);
    const applicantType = String(input.applicantType);

    const matches: any[] = [];

    for (const scheme of allSchemes) {
      const reasons: string[] = [];
      let isEligible = true;

      // Deterministic applicant type match: if targetBeneficiary is defined, it must match exactly
      if (scheme.targetBeneficiary && scheme.targetBeneficiary.trim() !== "") {
         if (scheme.targetBeneficiary !== applicantType) {
           isEligible = false;
         } else {
           reasons.push(`Designed for ${applicantType.toLowerCase()} applicants`);
         }
      }

      // Deterministic loan amount match
      if (scheme.maxLoanAmount !== null && loan > Number(scheme.maxLoanAmount)) {
        isEligible = false;
      } else if (scheme.minLoanAmount !== null && loan < Number(scheme.minLoanAmount)) {
        isEligible = false;
      } else if (scheme.maxLoanAmount !== null || scheme.minLoanAmount !== null) {
        reasons.push("Requested amount is within the scheme's limits");
      }

      // Deterministic income match
      if (scheme.maxIncome !== null && income > Number(scheme.maxIncome)) {
        isEligible = false;
      } else if (scheme.minIncome !== null && income < Number(scheme.minIncome)) {
        isEligible = false;
      } else if (scheme.maxIncome !== null || scheme.minIncome !== null) {
        reasons.push("Your income is within the recorded eligibility limit");
      }

      // Removed fuzzy purpose match: schemes currently do not have a deterministic purpose rule column.
      
      if (isEligible) {
        matches.push({
          ...scheme,
          reasons,
          // Removed arbitrary score and breakdown fields
        });
      }
    }

    if (matches.length > 0) {
      await postgresDb.transaction(async (tx) => {
        const [matchRequest] = await tx
          .insert(schemeMatchRequests)
          .values({
            userId: req.authUser!.id,
            purpose: String(input.purpose ?? ""),
            userType: applicantType,
            educationStatus: input.education ? String(input.education) : null,
            employmentStatus: input.employment ? String(input.employment) : null,
            annualIncome: input.income ? String(input.income) : null,
            requestedAmount: String(input.loanRequired ?? 0),
            state: input.location ? String(input.location.split(',')[1]?.trim() || input.location) : null,
            district: input.location ? String(input.location.split(',')[0]?.trim() || input.location) : null,
            pincode: null,
          })
          .returning({ id: schemeMatchRequests.id });

        for (const match of matches) {
          await tx.insert(schemeMatchResults).values({
            requestId: matchRequest.id,
            schemeId: match.id,
            matchStatus: "POTENTIALLY_SUITABLE",
            matchReason: { reasons: match.reasons },
            ruleVersion: 1,
          });
        }
      });
    }

    return res.json({ matches, total: matches.length });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid input" } });
    }
    console.error("Match error:", err);
    return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Could not process match" } });
  }
});


/**
 * Shared deterministic EMI calculation engine.
 *
 * Moratorium assumption: interest capitalizes on the principal during the
 * moratorium period. No repayments are made during moratorium. This is the
 * standard treatment for this calculator. Scheme-specific moratorium rules
 * (e.g. interest-free moratoriums) are NOT assumed; users should use the
 * general calculator and note the scheme's official terms.
 *
 * Rounding: internal precision kept at float; only rounds at API boundary.
 * Zero-interest: EMI = principal / repaymentMonths (no division by zero risk).
 */
function computeEmi(input: {
  principal: number;
  annualRate: number;
  tenureYears: number;
  moratoriumMonths: number;
}): {
  principalAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  moratoriumMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
} {
  const principal = input.principal;
  const totalMonths = Math.max(1, Math.round(input.tenureYears * 12));
  // Moratorium must be >= 0 and < totalMonths (at least 1 repayment month)
  const moratoriumMonths = Math.min(
    Math.max(0, Math.round(input.moratoriumMonths)),
    Math.max(totalMonths - 1, 0),
  );
  const repaymentMonths = Math.max(1, totalMonths - moratoriumMonths);
  const monthlyRate = input.annualRate / 1200; // annualRate is %, convert to monthly decimal

  // Interest capitalizes during moratorium period
  const balanceAfterMoratorium =
    monthlyRate === 0
      ? principal
      : principal * Math.pow(1 + monthlyRate, moratoriumMonths);

  // Standard amortization formula; safe for zero-interest
  const emi =
    monthlyRate === 0
      ? balanceAfterMoratorium / repaymentMonths
      : (balanceAfterMoratorium * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths)) /
        (Math.pow(1 + monthlyRate, repaymentMonths) - 1);

  const totalRepayment = emi * repaymentMonths;

  return {
    principalAmount: principal,
    annualInterestRate: input.annualRate,
    tenureMonths: totalMonths,
    moratoriumMonths,
    monthlyEmi: emi,
    totalInterest: totalRepayment - principal,
    totalRepayment,
  };
}

/**
 * POST /calculator/emi
 * Public — pure calculation, no persistence, no authentication required.
 * Returns precise result; front-end may display the rounded values.
 */
router.post("/calculator/emi", (req, res) => {
  try {
    const input = CalculateEmiBody.parse(req.body);

    // Strict validation beyond Zod minimums
    if (input.principal <= 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Principal must be greater than 0." } });
    }
    if (input.annualRate < 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Annual interest rate cannot be negative." } });
    }
    if (input.tenureYears <= 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Tenure must be greater than 0 years." } });
    }
    const totalMonths = Math.round(input.tenureYears * 12);
    if (input.moratoriumMonths >= totalMonths) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Moratorium months must be less than total tenure months." } });
    }

    const r = computeEmi(input);
    return res.json({
      // Preserve backward-compat shape for existing frontend (EmiResult)
      emi: Math.round(r.monthlyEmi),
      principal: r.principalAmount,
      totalInterest: Math.round(r.totalInterest),
      totalRepayment: Math.round(r.totalRepayment),
      // Extended fields
      tenureMonths: r.tenureMonths,
      moratoriumMonths: r.moratoriumMonths,
      annualInterestRate: r.annualInterestRate,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid financial input." } });
    }
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unexpected error." } });
  }
});

/**
 * POST /calculator/emi/save
 * Authenticated — recalculates EMI server-side, stores in PostgreSQL financial_calculations.
 * Ownership is derived exclusively from req.authUser!.id; no body/query userId accepted.
 * Optionally associates a real scheme UUID when schemeId is provided.
 */
router.post("/calculator/emi/save", loadAuthUser, requireAuth, async (req, res) => {
  try {
    const input = CalculateEmiBody.parse(req.body);
    const schemeIdRaw: string | undefined = typeof req.body.schemeId === "string" ? req.body.schemeId : undefined;

    // Strict validation
    if (input.principal <= 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Principal must be greater than 0." } });
    }
    if (input.annualRate < 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Annual interest rate cannot be negative." } });
    }
    if (input.tenureYears <= 0) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Tenure must be greater than 0 years." } });
    }
    const totalMonths = Math.round(input.tenureYears * 12);
    if (input.moratoriumMonths >= totalMonths) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Moratorium months must be less than total tenure months." } });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: { code: "SERVICE_UNAVAILABLE", message: "Saving calculations requires a database connection." },
      });
    }

    const { postgresDb, financialCalculations, schemes: pgSchemesTable } = await import("@workspace/db/postgres");

    // Server-side recalculation — never trust frontend-provided EMI totals
    const r = computeEmi(input);

    // Validate scheme UUID exists if provided — do not accept arbitrary strings
    let resolvedSchemeId: string | null = null;
    if (schemeIdRaw) {
      try {
        const [scheme] = await postgresDb
          .select({ id: pgSchemesTable.id })
          .from(pgSchemesTable)
          .where(eq(pgSchemesTable.id, schemeIdRaw));
        resolvedSchemeId = scheme?.id ?? null;
      } catch {
        // Invalid UUID format — silently ignore, save without scheme
        resolvedSchemeId = null;
      }
    }

    const [saved] = await postgresDb
      .insert(financialCalculations)
      .values({
        userId: req.authUser!.id, // ownership from session only
        schemeId: resolvedSchemeId,
        principalAmount: String(r.principalAmount),
        interestRate: String(r.annualInterestRate),
        tenureMonths: r.tenureMonths,
        moratoriumMonths: r.moratoriumMonths,
        monthlyEmi: String(r.monthlyEmi.toFixed(2)),
        totalInterest: String(r.totalInterest.toFixed(2)),
        totalRepayment: String(r.totalRepayment.toFixed(2)),
      })
      .returning();

    return res.status(201).json({
      id: saved.id,
      message: "Calculation saved successfully.",
      createdAt: saved.createdAt,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid financial input." } });
    }
    console.error("POST /calculator/emi/save error:", err);
    return res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Database is unavailable." } });
  }
});


router.get("/partners", async (_req, res) => {
  if (!process.env.DATABASE_URL) return res.json([]);
  const { postgresDb, channelPartners, partnerOperationalMetrics } = await import("@workspace/db/postgres");
  const { eq } = await import("drizzle-orm");
  const results = await postgresDb
    .select({
      partner: channelPartners,
      metrics: partnerOperationalMetrics,
    })
    .from(channelPartners)
    .leftJoin(
      partnerOperationalMetrics,
      eq(partnerOperationalMetrics.partnerId, channelPartners.id)
    );
    
  return res.json(results.map(row => ({
    id: row.partner.id,
    name: row.partner.name,
    type: row.partner.partnerType,
    address: row.partner.address,
    status: row.partner.acceptingApplications ? "Accepting" : "Unavailable",
    distance: 0,
    fundingAvailability: row.metrics ? 100 - Number(row.metrics.fundUtilizationPercent) : 0,
  })));
});

router.get("/partners/eligible", async (req, res) => {
  const schemeId = String(req.query.schemeId || "");
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const pincode = String(req.query.pincode || "");
  if (!schemeId) return res.status(400).json({ error: "schemeId is required" });
  
  const location: UserLocation | null = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    ? { latitude, longitude, source: "browser" }
    : resolvePincode(pincode);
    
  if (!location) {
    if (pincode) {
        return res.status(400).json({ error: "Location lookup is currently unavailable." });
    }
    return res.status(400).json({ error: "Provide valid coordinates or a supported Indian PIN code" });
  }
  
  try {
    const ranked = await getEligiblePartners(schemeId, location);
    const eligible = ranked.filter((partner) => partner.eligible);
    return res.json({ 
        userLocation: location, 
        schemeId, 
        recommendedPartnerId: eligible[0]?.id ?? null, 
        partners: ranked 
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/partners/recommend", async (req, res) => {
  const { schemeId, location } = RecommendPartnersBody.parse(req.body);
  const resolved = resolvePincode(location.replace(/\D/g, ""));
  if (!resolved) {
      return res.status(400).json({ error: "Location lookup is currently unavailable." });
  }
  try {
    const ranked = await getEligiblePartners(schemeId, resolved);
    return res.json(ranked);
  } catch (error) {
    console.error("Error fetching recommended partners:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/analytics", (_req, res) =>
  res.status(503).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Analytics are not yet available. Real data is required.",
    },
  }),
);

export default router;
