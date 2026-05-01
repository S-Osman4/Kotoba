// lib/db/client.ts
//
// Initialises the Turso database client and the Drizzle ORM instance.
//
// This file is imported by API routes and query helpers.
// It is NEVER imported by client components — database credentials
// must only exist in server-side code.
//
// Module-level singleton pattern:
//   In Next.js, API routes run in a Node.js (or Edge) environment where
//   each module is evaluated once per worker process. Defining the client
//   at module level means we reuse the same connection across requests
//   in the same worker, rather than opening a new connection per request.

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Validate that the required environment variables are present.
// Failing loudly at startup is better than a confusing runtime error
// mid-request when the first query runs.
if (!process.env.TURSO_DATABASE_URL) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. " +
      "Add it to .env.local and restart the dev server.",
  );
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    "TURSO_AUTH_TOKEN is not set. " +
      "Add it to .env.local and restart the dev server.",
  );
}

// Create the LibSQL client.
// `url` — the Turso database URL (libsql://your-db.turso.io)
// `authToken` — the JWT token from `turso db tokens create`
const libsqlClient = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create the Drizzle instance.
// Passing `{ schema }` enables relational query helpers (db.query.learnedWords...)
// even though we don't use relations in this schema — it's good practice.
export const db = drizzle(libsqlClient, { schema });
