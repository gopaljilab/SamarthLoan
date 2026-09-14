import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/** Prototype scheme catalogue. Values are illustrative, not policy records. */
export const schemes = sqliteTable("schemes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  maxLoan: real("max_loan").notNull(),
  interest: real("interest").notNull(),
  moratorium: integer("moratorium").notNull(),
  tenure: integer("tenure").notNull(),
  applicantType: text("applicant_type").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
  isPrototypeData: integer("is_prototype_data", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

/** Operationally eligible demo channel partners. */
export const partners = sqliteTable("partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  supportedSchemes: text("supported_schemes", { mode: "json" }).$type<string[]>().notNull(),
  serviceArea: text("service_area").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  authorized: integer("authorized", { mode: "boolean" }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull(),
  fundUtilizationPercent: real("fund_utilization_percent").notNull(),
  npaPercent: real("npa_percent").notNull(),
  overduePercent: real("overdue_percent").notNull(),
  processingCapacity: integer("processing_capacity").notNull(),
  applicationsToday: integer("applications_today").notNull(),
  acceptingApplications: integer("accepting_applications", { mode: "boolean" }).notNull(),
  serviceQuality: integer("service_quality").notNull(),
  lastUpdated: text("last_updated").notNull(),
});

export const applicantProfiles = sqliteTable("applicant_profiles", {
  id: text("id").primaryKey(),
  name: text("name"),
  applicantType: text("applicant_type").notNull(),
  age: integer("age").notNull(),
  category: text("category").notNull(),
  education: text("education"),
  employment: text("employment"),
  income: real("income").notNull(),
  purpose: text("purpose").notNull(),
  projectCost: real("project_cost"),
  loanRequired: real("loan_required").notNull(),
  location: text("location").notNull(),
  createdAt: text("created_at").notNull(),
});

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  schemeId: text("scheme_id").notNull(),
  partnerId: text("partner_id").notNull(),
  income: real("income").notNull(),
  loanRequired: real("loan_required").notNull(),
  projectType: text("project_type").notNull(),
  projectCost: real("project_cost").notNull(),
  documents: text("documents", { mode: "json" }).$type<string[]>().notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const schemeRecommendations = sqliteTable("scheme_recommendations", {
  id: text("id").primaryKey(),
  applicantProfileId: text("applicant_profile_id"),
  schemeId: text("scheme_id").notNull(),
  matchScore: real("match_score").notNull(),
  reasons: text("reasons", { mode: "json" }).$type<string[]>().notNull(),
  breakdown: text("breakdown", { mode: "json" }).$type<Record<string, number>>().notNull(),
  createdAt: text("created_at").notNull(),
});

export const emiCalculations = sqliteTable("emi_calculations", {
  id: text("id").primaryKey(),
  principal: real("principal").notNull(),
  annualRate: real("annual_rate").notNull(),
  tenureYears: real("tenure_years").notNull(),
  moratoriumMonths: integer("moratorium_months").notNull(),
  emi: real("emi").notNull(),
  totalInterest: real("total_interest").notNull(),
  totalRepayment: real("total_repayment").notNull(),
  createdAt: text("created_at").notNull(),
});

export const contactEnquiries = sqliteTable("contact_enquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message").notNull(),
  preferredContact: text("preferred_contact"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});
