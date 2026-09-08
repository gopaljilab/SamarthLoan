import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Prototype scheme catalogue. Values are illustrative, not policy records. */
export const schemes = pgTable("schemes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  maxLoan: integer("max_loan").notNull(),
  interest: doublePrecision("interest").notNull(),
  moratorium: integer("moratorium").notNull(),
  tenure: integer("tenure").notNull(),
  applicantType: text("applicant_type").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  isPrototypeData: boolean("is_prototype_data").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Operationally eligible demo channel partners. */
export const partners = pgTable("partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  supportedSchemes: jsonb("supported_schemes").$type<string[]>().notNull(),
  serviceArea: text("service_area").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  authorized: boolean("authorized").notNull(),
  active: boolean("active").notNull(),
  fundUtilizationPercent: doublePrecision("fund_utilization_percent").notNull(),
  npaPercent: doublePrecision("npa_percent").notNull(),
  overduePercent: doublePrecision("overdue_percent").notNull(),
  processingCapacity: integer("processing_capacity").notNull(),
  applicationsToday: integer("applications_today").notNull(),
  acceptingApplications: boolean("accepting_applications").notNull(),
  serviceQuality: integer("service_quality").notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull(),
});
