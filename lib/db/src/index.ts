import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const databasePath = process.env.SQLITE_DATABASE_PATH ?? path.resolve(process.cwd(), "data", "samarthloan.db");
mkdirSync(path.dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS schemes (id TEXT PRIMARY KEY, name TEXT NOT NULL, purpose TEXT NOT NULL, max_loan REAL NOT NULL, interest REAL NOT NULL, moratorium INTEGER NOT NULL, tenure INTEGER NOT NULL, applicant_type TEXT NOT NULL, tags TEXT NOT NULL, is_prototype_data INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS partners (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, supported_schemes TEXT NOT NULL, service_area TEXT NOT NULL, address TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, authorized INTEGER NOT NULL, active INTEGER NOT NULL, fund_utilization_percent REAL NOT NULL, npa_percent REAL NOT NULL, overdue_percent REAL NOT NULL, processing_capacity INTEGER NOT NULL, applications_today INTEGER NOT NULL, accepting_applications INTEGER NOT NULL, service_quality INTEGER NOT NULL, last_updated TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS applicant_profiles (id TEXT PRIMARY KEY, name TEXT, applicant_type TEXT NOT NULL, age INTEGER NOT NULL, category TEXT NOT NULL, education TEXT, employment TEXT, income REAL NOT NULL, purpose TEXT NOT NULL, project_cost REAL, loan_required REAL NOT NULL, location TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, address TEXT NOT NULL, scheme_id TEXT NOT NULL, partner_id TEXT NOT NULL, income REAL NOT NULL, loan_required REAL NOT NULL, project_type TEXT NOT NULL, project_cost REAL NOT NULL, documents TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS scheme_recommendations (id TEXT PRIMARY KEY, applicant_profile_id TEXT, scheme_id TEXT NOT NULL, match_score REAL NOT NULL, reasons TEXT NOT NULL, breakdown TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS emi_calculations (id TEXT PRIMARY KEY, principal REAL NOT NULL, annual_rate REAL NOT NULL, tenure_years REAL NOT NULL, moratorium_months INTEGER NOT NULL, emi REAL NOT NULL, total_interest REAL NOT NULL, total_repayment REAL NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS contact_enquiries (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, message TEXT NOT NULL, preferred_contact TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL);
`);

export const db = drizzle(sqlite, { schema });

export function closeDatabase() {
  sqlite.close();
}

export * from "./schema";
