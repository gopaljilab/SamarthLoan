import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.SQLITE_DATABASE_PATH ?? path.resolve(process.cwd(), "data", "samarthloan.db"),
  },
});
