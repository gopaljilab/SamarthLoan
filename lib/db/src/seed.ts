import { closeDatabase, db } from "./index";
import { partners, schemes } from "./schema";

const schemeRows: any[] = [];
const partnerRows: any[] = [];

async function seed() {
  console.info("Notice: Mock seed data has been removed for Phase 5.");
  console.info("Use the PostgreSQL importer (`scripts/src/import-schemes.ts`) to populate verified schemes.");
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    closeDatabase();
  });
