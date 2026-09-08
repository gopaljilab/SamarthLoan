import { db, pool } from "./index";
import { partners, schemes } from "./schema";

const schemeRows = [
  { id: "micro-finance", name: "Micro Finance Scheme", purpose: "Small projects and first-stage businesses", maxLoan: 140000, interest: 6.5, moratorium: 3, tenure: 5, applicantType: "Entrepreneur", tags: ["Small projects", "Income compatible", "Low interest"] },
  { id: "term-loan", name: "Term Loan Scheme", purpose: "Larger business and project requirements", maxLoan: 5000000, interest: 8, moratorium: 6, tenure: 7, applicantType: "Entrepreneur", tags: ["Larger projects", "Flexible tenure"] },
  { id: "education-loan", name: "Education Loan Scheme", purpose: "Higher education and professional courses", maxLoan: 2000000, interest: 7, moratorium: 12, tenure: 10, applicantType: "Student", tags: ["Higher education", "Moratorium"] },
  { id: "equipment-support", name: "Equipment Support Scheme", purpose: "Productive equipment for an established enterprise", maxLoan: 1000000, interest: 7.25, moratorium: 6, tenure: 5, applicantType: "Entrepreneur", tags: ["Equipment", "Business growth"] },
  { id: "working-capital", name: "Working Capital Scheme", purpose: "Inventory and day-to-day business expenses", maxLoan: 500000, interest: 7.5, moratorium: 3, tenure: 3, applicantType: "Entrepreneur", tags: ["Working capital", "Quick access"] },
  { id: "women-enterprise", name: "Women Enterprise Starter Scheme", purpose: "Starter finance for women-led micro enterprises and home businesses", maxLoan: 150000, interest: 6.5, moratorium: 3, tenure: 5, applicantType: "Entrepreneur", tags: ["Women-led", "Starter", "Micro enterprise"] },
  { id: "livelihood-fund", name: "Livelihood Growth Fund", purpose: "Patient capital for livelihood activities in rural and semi-urban communities", maxLoan: 300000, interest: 7, moratorium: 6, tenure: 5, applicantType: "Entrepreneur", tags: ["Livelihood", "Rural", "Community"] },
  { id: "skill-support", name: "Skill Development Support", purpose: "Education support for vocational training and job-ready certification", maxLoan: 350000, interest: 5.5, moratorium: 12, tenure: 5, applicantType: "Student", tags: ["Skills", "Vocational", "Students"] },
  { id: "green-equipment", name: "Green Enterprise Equipment Fund", purpose: "Finance for energy-efficient tools and environmentally responsible enterprises", maxLoan: 1200000, interest: 7.25, moratorium: 6, tenure: 7, applicantType: "Entrepreneur", tags: ["Green business", "Equipment"] },
].map((scheme) => ({ ...scheme, isPrototypeData: true }));

const partnerRows = [
  { id: "p1", name: "Bengaluru Enterprise Support Centre", type: "SCA", supportedSchemes: ["micro-finance", "term-loan"], serviceArea: "Central Bengaluru", address: "14 Residency Road, Bengaluru", latitude: 12.9716, longitude: 77.5946, authorized: true, active: true, fundUtilizationPercent: 72, npaPercent: 2.1, overduePercent: 1.8, processingCapacity: 86, applicationsToday: 18, acceptingApplications: true, serviceQuality: 92, lastUpdated: new Date("2026-09-08T09:00:00.000Z") },
  { id: "p2", name: "Karnataka Gramin Bank - Indiranagar", type: "RRB", supportedSchemes: ["micro-finance", "term-loan", "equipment-support"], serviceArea: "East Bengaluru", address: "100 Feet Road, Indiranagar, Bengaluru", latitude: 12.9784, longitude: 77.6408, authorized: true, active: true, fundUtilizationPercent: 82, npaPercent: 2.8, overduePercent: 2.4, processingCapacity: 28, applicationsToday: 31, acceptingApplications: true, serviceQuality: 88, lastUpdated: new Date("2026-09-08T08:30:00.000Z") },
  { id: "p3", name: "Udyam MFI - Jayanagar", type: "NBFC-MFI", supportedSchemes: ["micro-finance", "working-capital"], serviceArea: "South Bengaluru", address: "4th Block, Jayanagar, Bengaluru", latitude: 12.925, longitude: 77.5938, authorized: true, active: true, fundUtilizationPercent: 68, npaPercent: 7.2, overduePercent: 6.1, processingCapacity: 68, applicationsToday: 14, acceptingApplications: true, serviceQuality: 81, lastUpdated: new Date("2026-09-08T07:45:00.000Z") },
  { id: "p4", name: "People's Development Finance", type: "SCA", supportedSchemes: ["micro-finance", "education-loan"], serviceArea: "North Bengaluru", address: "Yeshwanthpur, Bengaluru", latitude: 13.028, longitude: 77.54, authorized: true, active: false, fundUtilizationPercent: 44, npaPercent: 1.4, overduePercent: 1.2, processingCapacity: 72, applicationsToday: 10, acceptingApplications: false, serviceQuality: 76, lastUpdated: new Date("2026-09-07T16:00:00.000Z") },
  { id: "p5", name: "National Public Bank - Koramangala", type: "PSB", supportedSchemes: ["term-loan", "education-loan", "equipment-support"], serviceArea: "South-East Bengaluru", address: "80 Feet Road, Koramangala, Bengaluru", latitude: 12.9352, longitude: 77.6245, authorized: true, active: true, fundUtilizationPercent: 61, npaPercent: 1.9, overduePercent: 1.5, processingCapacity: 91, applicationsToday: 8, acceptingApplications: true, serviceQuality: 89, lastUpdated: new Date("2026-09-08T09:15:00.000Z") },
];

async function seed() {
  for (const row of schemeRows) {
    await db.insert(schemes).values(row).onConflictDoUpdate({ target: schemes.id, set: row });
  }
  for (const row of partnerRows) {
    await db.insert(partners).values(row).onConflictDoUpdate({ target: partners.id, set: row });
  }
  console.info(`Seeded ${schemeRows.length} schemes and ${partnerRows.length} partners.`);
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
