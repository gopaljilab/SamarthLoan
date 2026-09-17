import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for PostgreSQL-backed API features.");
}

export const postgresPool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined,
});

export const postgresDb = drizzle({ client: postgresPool, schema });

export async function closePostgresDatabase(): Promise<void> {
  await postgresPool.end();
}

export * from "./schema/postgres";
