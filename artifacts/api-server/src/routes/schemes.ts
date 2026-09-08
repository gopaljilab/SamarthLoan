import { Router, type IRouter, type Request, type Response } from "express";
import {
  CalculateEmiBody,
  RecommendSchemesBody,
  RecommendPartnersBody,
  CreateApplicationBody,
} from "@workspace/api-zod";
import { getEligiblePartners, partners, partnerPolicy, resolvePincode, type UserLocation } from "../services/partner-routing";

const router: IRouter = Router();

const schemes = [
  { id: "micro-finance", name: "Micro Finance Scheme", purpose: "Small projects and first-stage businesses", maxLoan: 140000, interest: 6.5, moratorium: 3, tenure: 5, applicantType: "Entrepreneur", tags: ["Small projects", "Income compatible", "Low interest"], isPrototypeData: true },
  { id: "term-loan", name: "Term Loan Scheme", purpose: "Larger business and project requirements", maxLoan: 5000000, interest: 8, moratorium: 6, tenure: 7, applicantType: "Entrepreneur", tags: ["Larger projects", "Flexible tenure"], isPrototypeData: true },
  { id: "education-loan", name: "Education Loan Scheme", purpose: "Higher education and professional courses", maxLoan: 2000000, interest: 7, moratorium: 12, tenure: 10, applicantType: "Student", tags: ["Higher education", "Moratorium"], isPrototypeData: true },
  { id: "equipment-support", name: "Equipment Support Scheme", purpose: "Productive equipment for an established enterprise", maxLoan: 1000000, interest: 7.25, moratorium: 6, tenure: 5, applicantType: "Entrepreneur", tags: ["Equipment", "Business growth"], isPrototypeData: true },
  { id: "working-capital", name: "Working Capital Scheme", purpose: "Inventory and day-to-day business expenses", maxLoan: 500000, interest: 7.5, moratorium: 3, tenure: 3, applicantType: "Entrepreneur", tags: ["Working capital", "Quick access"], isPrototypeData: true },
  { id: "women-enterprise", name: "Women Enterprise Starter Scheme", purpose: "Starter finance for women-led micro enterprises and home businesses", maxLoan: 150000, interest: 6.5, moratorium: 3, tenure: 5, applicantType: "Entrepreneur", tags: ["Women-led", "Starter", "Micro enterprise"], isPrototypeData: true },
  { id: "livelihood-fund", name: "Livelihood Growth Fund", purpose: "Patient capital for livelihood activities in rural and semi-urban communities", maxLoan: 300000, interest: 7, moratorium: 6, tenure: 5, applicantType: "Entrepreneur", tags: ["Livelihood", "Rural", "Community"], isPrototypeData: true },
  { id: "skill-support", name: "Skill Development Support", purpose: "Education support for vocational training and job-ready certification", maxLoan: 350000, interest: 5.5, moratorium: 12, tenure: 5, applicantType: "Student", tags: ["Skills", "Vocational", "Students"], isPrototypeData: true },
  { id: "green-equipment", name: "Green Enterprise Equipment Fund", purpose: "Finance for energy-efficient tools and environmentally responsible enterprises", maxLoan: 1200000, interest: 7.25, moratorium: 6, tenure: 7, applicantType: "Entrepreneur", tags: ["Green business", "Equipment"], isPrototypeData: true },
];

const applications = new Map<string, Record<string, unknown>>();

function scoreScheme(input: Record<string, unknown>, scheme: (typeof schemes)[number]) {
  const applicantType = String(input.applicantType);
  const purpose = String(input.purpose ?? "");
  const loan = Number(input.loanRequired ?? 0);
  const income = Number(input.income ?? 0);
  const typeMatch = applicantType === scheme.applicantType;
  const amountMatch = loan > 0 && loan <= scheme.maxLoan;
  const purposeMatch = scheme.id === "education-loan" ? applicantType === "Student" : applicantType === "Entrepreneur";
  const incomeMatch = income <= 500000 || scheme.id === "term-loan";
  if (!typeMatch || !amountMatch) return null;
  const purposeBoost = purpose.toLowerCase().includes(scheme.id === "micro-finance" ? "business" : scheme.id.replace("-", " ")) ? 10 : 5;
  const breakdown = { income: incomeMatch ? 25 : 12, projectType: purposeMatch ? 25 : 10, loanAmount: amountMatch ? 20 : 0, applicantType: typeMatch ? 15 : 0, purpose: purposeBoost, other: 5 };
  const score = Math.min(99, Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  const reasons = [
    incomeMatch ? "Your income is within the configured prototype range" : "Income may need additional verification",
    "Your applicant type is compatible",
    "Your requested amount is within the prototype limit",
  ];
  return { ...scheme, score, reasons, breakdown };
}

router.get("/schemes", (_req, res) => res.json(schemes));
router.get("/schemes/:id", (req, res) => {
  const scheme = schemes.find((item) => item.id === req.params.id);
  scheme ? res.json(scheme) : res.status(404).json({ error: "Scheme not found" });
});
router.post("/schemes/recommend", (req, res) => {
  const input = RecommendSchemesBody.parse(req.body) as Record<string, unknown>;
  const matches = schemes.map((scheme) => scoreScheme(input, scheme)).filter(Boolean).sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  res.json(matches);
});
router.post("/calculator/emi", (req, res) => {
  const input = CalculateEmiBody.parse(req.body);
  const principal = Number(input.principal);
  const totalMonths = Math.max(1, Number(input.tenureYears) * 12);
  const moratoriumMonths = Math.min(Math.max(0, Number(input.moratoriumMonths)), Math.max(totalMonths - 1, 1));
  const repaymentMonths = Math.max(1, totalMonths - moratoriumMonths);
  const rate = Number(input.annualRate) / 1200;
  const balanceAfterMoratorium = rate === 0 ? principal : principal * Math.pow(1 + rate, moratoriumMonths);
  const emi = rate === 0 ? balanceAfterMoratorium / repaymentMonths : balanceAfterMoratorium * rate * Math.pow(1 + rate, repaymentMonths) / (Math.pow(1 + rate, repaymentMonths) - 1);
  const totalRepayment = emi * repaymentMonths;
  res.json({ emi: Math.round(emi), principal, totalInterest: Math.round(totalRepayment - principal), totalRepayment: Math.round(totalRepayment) });
});
router.get("/partners", (_req, res) => res.json(partners.map((partner) => ({
  ...partner, distance: 0, status: partner.acceptingApplications ? "Accepting" : "Unavailable",
  fundingAvailability: 100 - partner.fundUtilizationPercent,
}))));
router.get("/partners/eligible", (req, res) => {
  const schemeId = String(req.query.schemeId || "");
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const pincode = String(req.query.pincode || "");
  if (!schemeId) return res.status(400).json({ error: "schemeId is required" });
  const location: UserLocation | null = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    ? { latitude, longitude, source: "browser" }
    : resolvePincode(pincode);
  if (!location) return res.status(400).json({ error: "Provide valid coordinates or a supported Indian PIN code" });
  const ranked = getEligiblePartners(schemeId, location);
  const eligible = ranked.filter((partner) => partner.eligible);
  return res.json({ userLocation: location, schemeId, recommendedPartnerId: eligible[0]?.id ?? null, policy: partnerPolicy, partners: ranked });
});
router.post("/partners/recommend", (req, res) => {
  const { schemeId, location } = RecommendPartnersBody.parse(req.body);
  const resolved = resolvePincode(location.replace(/\D/g, "")) ?? { latitude: 12.9716, longitude: 77.5946, source: "pincode" as const };
  const ranked = getEligiblePartners(schemeId, resolved);
  res.json(ranked);
});
router.post("/applications", (req, res) => {
  const input = CreateApplicationBody.parse(req.body);
  const existing = [...applications.values()].find((application) => application.name === input.name && application.schemeId === input.schemeId && application.partnerId === input.partnerId);
  if (existing) return res.status(200).json(existing);
  const id = `SS-26092-${Math.floor(1000 + Math.random() * 8999)}`;
  const application = { ...input, id, status: "Partner Review", createdAt: new Date().toISOString() };
  applications.set(id, application);
  return res.status(201).json(application);
});
router.get("/applications/:id", (req, res) => {
  const application = applications.get(req.params.id);
  application ? res.json(application) : res.status(404).json({ error: "Application not found" });
});
router.get("/admin/analytics", (_req, res) => res.json({
  totalApplications: 1284, matchedApplications: 1042, routedApplications: 936, assistance: 48000000,
  monthly: [{ month: "Jan", applications: 104 }, { month: "Feb", applications: 132 }, { month: "Mar", applications: 148 }, { month: "Apr", applications: 182 }, { month: "May", applications: 216 }, { month: "Jun", applications: 244 }],
  demand: [{ name: "Micro Finance", value: 420 }, { name: "Term Loan", value: 280 }, { name: "Education", value: 210 }, { name: "Other", value: 132 }],
  status: [{ name: "Partner Review", value: 342 }, { name: "Matched", value: 408 }, { name: "Approved", value: 216 }, { name: "Other", value: 318 }],
  partners: [{ name: "Enterprise Support", applications: 188 }, { name: "Gramin Bank", applications: 164 }, { name: "Udyam MFI", applications: 142 }, { name: "People's Finance", applications: 118 }],
}));

export default router;