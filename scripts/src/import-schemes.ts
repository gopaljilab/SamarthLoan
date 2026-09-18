import { postgresDb, closePostgresDatabase } from "../../lib/db/src/postgres-client";
import { schemes, channelPartners, partnerSchemeMappings, schemeEligibilityRules } from "../../lib/db/src/schema/postgres";

const verifiedSchemes = [
  {
    id: "b45068bc-38b3-4f96-857e-f42fcc2164e8",
    schemeCode: "NSFDC-TLS",
    name: "Term Loan Scheme",
    shortDescription: "Financing for commercially viable projects up to Rs. 30 Lakhs.",
    description: "The Term Loan Scheme by NSFDC is designed to provide financial assistance for any commercially viable income generating business, including agriculture and allied activities.",
    category: "Term Loan",
    targetBeneficiary: "Scheduled Caste Entrepreneurs",
    minLoanAmount: "0",
    maxLoanAmount: "3000000",
    interestRateMin: "6",
    interestRateMax: "8",
    tenureMinMonths: 0,
    tenureMaxMonths: 120,
    moratoriumMinMonths: 0,
    moratoriumMaxMonths: 6,
    maximumFinancingPercentage: "90",
    officialSourceUrl: "https://nsfdc.nic.in/en/term-loan-scheme",
    officialSourceName: "National Scheduled Castes Finance and Development Corporation (NSFDC)",
    officialDepartment: "Ministry of Social Justice and Empowerment",
    status: "ACTIVE" as const,
    lastVerifiedAt: new Date(),
  },
  {
    id: "e9f0d11d-620a-49c0-811c-2f9547d7c679",
    schemeCode: "NSFDC-MCF",
    name: "Micro Credit Finance (MCF)",
    shortDescription: "Micro finance for small income generating activities up to Rs. 1.40 Lakhs.",
    description: "MCF provides small loans to the target group for small/micro business and income generating activities.",
    category: "Micro Finance",
    targetBeneficiary: "Scheduled Caste Individuals",
    minLoanAmount: "0",
    maxLoanAmount: "140000",
    interestRateMin: "5",
    interestRateMax: "5",
    tenureMinMonths: 0,
    tenureMaxMonths: 42,
    moratoriumMinMonths: 0,
    moratoriumMaxMonths: 3,
    maximumFinancingPercentage: "90",
    officialSourceUrl: "https://nsfdc.nic.in/en/micro-credit-finance-mcf",
    officialSourceName: "National Scheduled Castes Finance and Development Corporation (NSFDC)",
    officialDepartment: "Ministry of Social Justice and Empowerment",
    status: "ACTIVE" as const,
    lastVerifiedAt: new Date(),
  },
  {
    id: "2d2cdfb9-3176-47b2-8c10-85fcc132a033",
    schemeCode: "NSFDC-MSY",
    name: "Mahila Samriddhi Yojana (MSY)",
    shortDescription: "Micro credit finance specifically for women entrepreneurs.",
    description: "MSY provides micro credit finance to women beneficiaries for starting small/micro business and income generating activities.",
    category: "Micro Finance",
    targetBeneficiary: "Scheduled Caste Women",
    minLoanAmount: "0",
    maxLoanAmount: "140000",
    interestRateMin: "4",
    interestRateMax: "4",
    tenureMinMonths: 0,
    tenureMaxMonths: 42,
    moratoriumMinMonths: 0,
    moratoriumMaxMonths: 3,
    maximumFinancingPercentage: "90",
    officialSourceUrl: "https://nsfdc.nic.in/en/mahila-samriddhi-yojana-msy",
    officialSourceName: "National Scheduled Castes Finance and Development Corporation (NSFDC)",
    officialDepartment: "Ministry of Social Justice and Empowerment",
    status: "ACTIVE" as const,
    lastVerifiedAt: new Date(),
  },
];

const verifiedPartners = [
  {
    id: "f3f3ab8e-d9e2-4328-9bf5-c99453713d7d",
    name: "Karnataka State Dr B R Ambedkar Development Corporation Ltd",
    partnerType: "SCA",
    organizationCode: "KA-ADCL-01",
    address: "9th & 10th Floor, Vishweshwaraiah Mini Tower, Dr B R Ambedkar Veedhi, Bengaluru - 560 001",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560001",
    latitude: "12.979693",
    longitude: "77.590658",
    phone: "080-22283307",
    website: "https://adcl.karnataka.gov.in/",
    authorizedStatus: true,
    acceptingApplications: true,
    status: "ACTIVE" as const,
    lastVerifiedAt: new Date(),
  },
  {
    id: "a1a8c5e6-bd95-46e2-89cc-23a7e3d7b7e7",
    name: "Delhi SC / ST / OBC / Minorities and Handicapped Financial and Development Corporation",
    partnerType: "SCA",
    organizationCode: "DL-DSFDC-01",
    address: "2 Institutional Area, Vishwas Nagar, Shahdara, Delhi-110032",
    city: "Delhi",
    district: "East Delhi",
    state: "Delhi",
    pincode: "110032",
    latitude: "28.665721",
    longitude: "77.300589",
    phone: "011-22323381",
    website: "http://dsfdc.delhigovt.nic.in",
    authorizedStatus: true,
    acceptingApplications: true,
    status: "ACTIVE" as const,
    lastVerifiedAt: new Date(),
  }
];

async function importData() {
  console.log("Starting transactional import of verified government schemes...");

  await postgresDb.transaction(async (tx) => {
    for (const scheme of verifiedSchemes) {
      await tx
        .insert(schemes)
        .values(scheme)
        .onConflictDoUpdate({
          target: schemes.schemeCode,
          set: scheme,
        });
        
      await tx
        .insert(schemeEligibilityRules)
        .values({
          schemeId: scheme.id,
          ruleVersion: 1,
          rules: {
            maxLoan: Number(scheme.maxLoanAmount),
            category: "SC",
            gender: scheme.schemeCode === "NSFDC-MSY" ? "Female" : undefined,
          },
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [schemeEligibilityRules.schemeId, schemeEligibilityRules.ruleVersion],
          set: {
            rules: {
              maxLoan: Number(scheme.maxLoanAmount),
              category: "SC",
              gender: scheme.schemeCode === "NSFDC-MSY" ? "Female" : undefined,
            },
          },
        });
    }

    console.log(`Inserted/Updated ${verifiedSchemes.length} schemes.`);

    for (const partner of verifiedPartners) {
      await tx
        .insert(channelPartners)
        .values(partner)
        .onConflictDoUpdate({
          target: channelPartners.organizationCode,
          set: partner,
        });

      for (const scheme of verifiedSchemes) {
        await tx
          .insert(partnerSchemeMappings)
          .values({
            partnerId: partner.id,
            schemeId: scheme.id,
            isAuthorized: true,
            status: "ACTIVE" as const,
            lastVerifiedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [partnerSchemeMappings.partnerId, partnerSchemeMappings.schemeId],
            set: { isAuthorized: true, status: "ACTIVE" as const },
          });
      }
    }

    console.log(`Inserted/Updated ${verifiedPartners.length} channel partners and created mappings.`);
  });

  console.log("Import completed successfully.");
}

importData()
  .catch((e) => {
    console.error("Error importing data:", e);
    process.exit(1);
  })
  .finally(() => {
    closePostgresDatabase();
  });
