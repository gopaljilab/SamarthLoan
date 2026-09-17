import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** PostgreSQL production schema. SQLite remains the local-development store. */
export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const userStatus = pgEnum("user_status", ["ACTIVE", "SUSPENDED"]);
export const recordStatus = pgEnum("record_status", ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]);
export const applicationStatus = pgEnum("application_status", ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "WITHDRAWN"]);
export const matchStatus = pgEnum("match_status", ["POTENTIALLY_SUITABLE", "NOT_MATCHED"]);

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  name: varchar("name", { length: 160 }).notNull(),
  passwordHash: text("password_hash"),
  role: userRole("role").notNull().default("USER"),
  status: userStatus("status").notNull().default("ACTIVE"),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  uniqueIndex("users_phone_unique").on(table.phone),
]);

/** Opaque session tokens are stored only as SHA-256 hashes. */
export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
  createdAt,
}, (table) => [
  uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash),
  index("auth_sessions_user_active_lookup").on(table.userId, table.expiresAt),
]);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  state: varchar("state", { length: 100 }),
  district: varchar("district", { length: 100 }),
  city: varchar("city", { length: 100 }),
  pincode: varchar("pincode", { length: 6 }),
  occupation: varchar("occupation", { length: 160 }),
  educationStatus: varchar("education_status", { length: 160 }),
  annualFamilyIncome: numeric("annual_family_income", { precision: 14, scale: 2 }),
  userType: varchar("user_type", { length: 40 }),
  createdAt,
  updatedAt,
}, (table) => [
  check("user_profiles_pincode_format", sql`${table.pincode} IS NULL OR ${table.pincode} ~ '^[0-9]{6}$'`),
]);

export const schemes = pgTable("schemes", {
  id: uuid("id").primaryKey().defaultRandom(),
  schemeCode: varchar("scheme_code", { length: 80 }).notNull(),
  name: varchar("name", { length: 250 }).notNull(),
  shortDescription: text("short_description").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  targetBeneficiary: text("target_beneficiary"),
  minIncome: numeric("min_income", { precision: 14, scale: 2 }),
  maxIncome: numeric("max_income", { precision: 14, scale: 2 }),
  minLoanAmount: numeric("min_loan_amount", { precision: 14, scale: 2 }),
  maxLoanAmount: numeric("max_loan_amount", { precision: 14, scale: 2 }),
  interestRateMin: numeric("interest_rate_min", { precision: 6, scale: 3 }),
  interestRateMax: numeric("interest_rate_max", { precision: 6, scale: 3 }),
  tenureMinMonths: integer("tenure_min_months"),
  tenureMaxMonths: integer("tenure_max_months"),
  moratoriumMinMonths: integer("moratorium_min_months"),
  moratoriumMaxMonths: integer("moratorium_max_months"),
  maximumFinancingPercentage: numeric("maximum_financing_percentage", { precision: 5, scale: 2 }),
  applicationProcess: text("application_process"),
  officialSourceUrl: text("official_source_url").notNull(),
  officialSourceName: varchar("official_source_name", { length: 250 }).notNull(),
  officialDepartment: varchar("official_department", { length: 250 }),
  status: recordStatus("status").notNull().default("DRAFT"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  effectiveUntil: timestamp("effective_until", { withTimezone: true }),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull(),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("schemes_code_unique").on(table.schemeCode),
  index("schemes_public_lookup").on(table.status, table.lastVerifiedAt),
  check("schemes_income_range", sql`${table.minIncome} IS NULL OR ${table.maxIncome} IS NULL OR ${table.minIncome} <= ${table.maxIncome}`),
  check("schemes_loan_range", sql`${table.minLoanAmount} IS NULL OR ${table.maxLoanAmount} IS NULL OR ${table.minLoanAmount} <= ${table.maxLoanAmount}`),
]);

export const schemeTranslations = pgTable("scheme_translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  schemeId: uuid("scheme_id").notNull().references(() => schemes.id, { onDelete: "cascade" }),
  languageCode: varchar("language_code", { length: 2 }).notNull(),
  name: varchar("name", { length: 250 }).notNull(),
  shortDescription: text("short_description").notNull(),
  description: text("description"),
  eligibilityText: text("eligibility_text"),
  applicationProcess: text("application_process"),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("scheme_translations_scheme_language_unique").on(table.schemeId, table.languageCode),
  check("scheme_translations_language", sql`${table.languageCode} IN ('en', 'hi', 'kn')`),
]);

export const schemeEligibilityRules = pgTable("scheme_eligibility_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  schemeId: uuid("scheme_id").notNull().references(() => schemes.id, { onDelete: "cascade" }),
  ruleVersion: integer("rule_version").notNull().default(1),
  rules: jsonb("rules").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("scheme_eligibility_rules_version_unique").on(table.schemeId, table.ruleVersion),
  index("scheme_eligibility_rules_active_lookup").on(table.schemeId, table.isActive),
]);

export const channelPartners = pgTable("channel_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 250 }).notNull(),
  partnerType: varchar("partner_type", { length: 40 }).notNull(),
  organizationCode: varchar("organization_code", { length: 100 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  district: varchar("district", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 6 }),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 254 }),
  website: text("website"),
  authorizedStatus: boolean("authorized_status").notNull().default(false),
  acceptingApplications: boolean("accepting_applications").notNull().default(false),
  status: recordStatus("status").notNull().default("DRAFT"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("channel_partners_organization_code_unique").on(table.organizationCode),
  index("channel_partners_discovery_lookup").on(table.status, table.authorizedStatus, table.pincode),
  check("channel_partners_coordinates", sql`(${table.latitude} IS NULL AND ${table.longitude} IS NULL) OR (${table.latitude} BETWEEN -90 AND 90 AND ${table.longitude} BETWEEN -180 AND 180)`),
]);

export const partnerSchemeMappings = pgTable("partner_scheme_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => channelPartners.id, { onDelete: "cascade" }),
  schemeId: uuid("scheme_id").notNull().references(() => schemes.id, { onDelete: "cascade" }),
  isAuthorized: boolean("is_authorized").notNull().default(false),
  status: recordStatus("status").notNull().default("DRAFT"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("partner_scheme_mappings_partner_scheme_unique").on(table.partnerId, table.schemeId),
  index("partner_scheme_mappings_scheme_lookup").on(table.schemeId, table.isAuthorized, table.status),
]);

export const partnerOperationalMetrics = pgTable("partner_operational_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => channelPartners.id, { onDelete: "cascade" }),
  fundUtilizationPercent: numeric("fund_utilization_percent", { precision: 5, scale: 2 }),
  npaPercent: numeric("npa_percent", { precision: 5, scale: 2 }),
  overduePercent: numeric("overdue_percent", { precision: 5, scale: 2 }),
  processingCapacity: integer("processing_capacity"),
  acceptingApplications: boolean("accepting_applications"),
  source: text("source").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull(),
  createdAt,
}, (table) => [index("partner_operational_metrics_current_lookup").on(table.partnerId, table.effectiveAt)]);

export const schemeMatchRequests = pgTable("scheme_match_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(),
  userType: varchar("user_type", { length: 40 }).notNull(),
  educationStatus: varchar("education_status", { length: 160 }),
  employmentStatus: varchar("employment_status", { length: 160 }),
  annualIncome: numeric("annual_income", { precision: 14, scale: 2 }),
  requestedAmount: numeric("requested_amount", { precision: 14, scale: 2 }).notNull(),
  state: varchar("state", { length: 100 }),
  district: varchar("district", { length: 100 }),
  pincode: varchar("pincode", { length: 6 }),
  createdAt,
}, (table) => [index("scheme_match_requests_user_created_lookup").on(table.userId, table.createdAt)]);

export const schemeMatchResults = pgTable("scheme_match_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => schemeMatchRequests.id, { onDelete: "cascade" }),
  schemeId: uuid("scheme_id").notNull().references(() => schemes.id, { onDelete: "restrict" }),
  matchStatus: matchStatus("match_status").notNull(),
  matchReason: jsonb("match_reason").notNull(),
  ruleVersion: integer("rule_version").notNull(),
  createdAt,
}, (table) => [uniqueIndex("scheme_match_results_request_scheme_unique").on(table.requestId, table.schemeId)]);

export const financialCalculations = pgTable("financial_calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schemeId: uuid("scheme_id").references(() => schemes.id, { onDelete: "set null" }),
  principalAmount: numeric("principal_amount", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 3 }).notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  moratoriumMonths: integer("moratorium_months").notNull().default(0),
  monthlyEmi: numeric("monthly_emi", { precision: 14, scale: 2 }).notNull(),
  totalInterest: numeric("total_interest", { precision: 14, scale: 2 }).notNull(),
  totalRepayment: numeric("total_repayment", { precision: 14, scale: 2 }).notNull(),
  createdAt,
}, (table) => [index("financial_calculations_user_created_lookup").on(table.userId, table.createdAt)]);

export const schemeApplications = pgTable("scheme_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  schemeId: uuid("scheme_id").notNull().references(() => schemes.id, { onDelete: "restrict" }),
  partnerId: uuid("partner_id").references(() => channelPartners.id, { onDelete: "set null" }),
  applicationReference: varchar("application_reference", { length: 40 }).notNull(),
  requestedAmount: numeric("requested_amount", { precision: 14, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  status: applicationStatus("status").notNull().default("DRAFT"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt,
  updatedAt,
}, (table) => [
  uniqueIndex("scheme_applications_reference_unique").on(table.applicationReference),
  index("scheme_applications_user_updated_lookup").on(table.userId, table.updatedAt),
]);

export const supportRequests = pgTable("support_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 254 }),
  phone: varchar("phone", { length: 20 }),
  category: varchar("category", { length: 80 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("OPEN"),
  createdAt,
  updatedAt,
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  rating: integer("rating"),
  category: varchar("category", { length: 80 }),
  message: text("message"),
  page: varchar("page", { length: 200 }),
  createdAt,
}, (table) => [check("feedback_rating_range", sql`${table.rating} IS NULL OR ${table.rating} BETWEEN 1 AND 5`)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 80 }).notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt,
}, (table) => [index("notifications_user_unread_lookup").on(table.userId, table.isRead, table.createdAt)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt,
}, (table) => [index("audit_logs_entity_lookup").on(table.entityType, table.entityId, table.createdAt)]);

/** Preserves pre-Phase-2 recommendation rows separately from authenticated requests. */
export const legacySchemeRecommendations = pgTable("legacy_scheme_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: varchar("legacy_id", { length: 100 }).notNull(),
  schemeId: varchar("scheme_id", { length: 100 }).notNull(),
  matchScore: numeric("match_score", { precision: 6, scale: 2 }).notNull(),
  reasons: jsonb("reasons").notNull(),
  breakdown: jsonb("breakdown").notNull(),
  legacyCreatedAt: timestamp("legacy_created_at", { withTimezone: true }),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("legacy_scheme_recommendations_legacy_id_unique").on(table.legacyId)]);
