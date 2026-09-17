import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Keep paths relative: Drizzle Kit's Windows glob resolver does not accept
  // the backslash-delimited absolute path produced by path.join here.
  schema: "./src/schema/postgres.ts",
  out: "./migrations/postgres",
  dialect: "postgresql",
  // `generate` is offline; `migrate:pg` validates DATABASE_URL before it runs.
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://migration-generator:unused@localhost:5432/samarthloan",
  },
});
