// drizzle.config.ts
//
// This file is read by the drizzle-kit CLI only — it is never imported
// by Next.js at runtime. It tells drizzle-kit:
//   - where the schema file lives
//   - which database dialect to use
//   - how to connect to the database for push/pull/migrate commands
import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// We read credentials directly from environment variables.
// When running drizzle-kit commands locally, dotenv-style loading
// is handled automatically by drizzle-kit reading .env.local.
// If it doesn't pick them up, prefix the command:
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx drizzle-kit push

config({ path: ".env.local" });
export default {
  // Path to the schema file drizzle-kit will read
  schema: "./lib/db/schema.ts",

  // Output directory for generated SQL migration files.
  // We use drizzle-kit push (schema push) rather than migrations
  // for this project — but drizzle-kit still wants this set.
  out: "./drizzle",

  // LibSQL is the dialect for Turso databases (SQLite-compatible)
  dialect: "turso",

  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  },
} satisfies Config;
