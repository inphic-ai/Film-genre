import { defineConfig } from "drizzle-kit";

// Prioritize CUSTOM_DATABASE_URL (Railway PostgreSQL) over DATABASE_URL (TiDB)
const connectionString = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or CUSTOM_DATABASE_URL is required to run drizzle commands");
}

// Validate PostgreSQL connection string
if (!connectionString.startsWith('postgresql://')) {
  throw new Error('Only PostgreSQL is supported. Please set CUSTOM_DATABASE_URL to Railway PostgreSQL connection string.');
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: { rejectUnauthorized: false }, // Railway PostgreSQL requires SSL
  },
});
