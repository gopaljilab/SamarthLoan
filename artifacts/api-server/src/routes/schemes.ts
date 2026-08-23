import { Router, type IRouter, type Request, type Response } from "express";
import {
  CalculateEmiBody,
  RecommendSchemesBody,
  RecommendPartnersBody,
  CreateApplicationBody,
} from "@workspace/api-zod";

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

const partners = [
  { id: "p1", name: "Bengaluru Enterprise Support Centre", type: "SCA", distance: 2.4, supportedSchemes: ["micro-finance", "term-loan"], serviceArea: "Central Bengaluru", status: "Accepting", processingCapacity: 86, fundingAvailability: 92, address: "14 Residency Road, Bengaluru", latitude: 12.9716, longitude: 77.5946 },
  { id: "p2", name: "Karnataka Gramin Bank — Indiranagar", type: "RRB", distance: 4.1, supportedSchemes: ["micro-finance", "term-loan", "equipment-support"], serviceArea: "East Bengaluru", status: "Accepting", processingCapacity: 78, fundingAvailability: 84, address: "100 Feet Road, Indiranagar", latitude: 12.9784, longitude: 77.6408 },
  { id: "p3", name: "Udyam MFI — Jayanagar", type: "NBFC-MFI", distance: 5.6, supportedSchemes: ["micro-finance", "working-capital"], serviceArea: "South Bengaluru", status: "Limited", processingCapacity: 68, fundingAvailability: 74, address: "4th Block, Jayanagar", latitude: 12.925, longitude: 77.5938 },
  { id: "p4", name: "People's Development Finance", type: "SCA", distance: 7.2, supportedSchemes: ["micro-finance", "education-loan"], serviceArea: "North Bengaluru", status: "Accepting", processingCapacity: 72, fundingAvailability: 88, address: "Yeshwanthpur, Bengaluru", latitude: 13.028, longitude: 77.54 },
  { id: "p5", name: "National Public Bank — Koramangala", type: "PSB", distance: 6.8, supportedSchemes: ["term-loan", "education-loan", "equipment-support"], serviceArea: "South-East Bengaluru", status: "Accepting", processingCapacity: 91, fundingAvailability: 95, address: "80 Feet Road, Koramangala", latitude: 12.9352, longitude: 77.6245 },
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
  const months = Math.max(1, Number(input.tenureYears) * 12);
  const rate = Number(input.annualRate) / 1200;
  const emi = rate === 0 ? principal / months : principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
  const totalRepayment = emi * months;
  res.json({ emi: Math.round(emi), principal, totalInterest: Math.round(totalRepayment - principal), totalRepayment: Math.round(totalRepayment) });
});
router.get("/partners", (_req, res) => res.json(partners));
router.post("/partners/recommend", (req, res) => {
  const { schemeId } = RecommendPartnersBody.parse(req.body);
  const ranked = partners.map((partner) => {
    const compatible = partner.supportedSchemes.includes(schemeId);
    const score = Math.round((compatible ? 40 : 0) + partner.fundingAvailability * 0.25 + partner.processingCapacity * 0.2 + Math.max(0, 15 - partner.distance));
    return { ...partner, score, reasons: [compatible ? "Scheme supported" : "May support related schemes", partner.status === "Accepting" ? "Currently accepting applications" : "Limited capacity", "Suitable processing capacity"] };
  }).filter((partner) => partner.supportedSchemes.includes(schemeId)).sort((a, b) => b.score - a.score);
  res.json(ranked);
});
router.post("/applications", (req, res) => {
  const input = CreateApplicationBody.parse(req.body);
  const id = `SS-26092-${Math.floor(1000 + Math.random() * 8999)}`;
  const application = { ...input, id, status: "Partner Review", createdAt: new Date().toISOString() };
  applications.set(id, application);
  res.status(201).json(application);
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