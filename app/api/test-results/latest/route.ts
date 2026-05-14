// app/api/test-results/latest/route.ts
//
// GET /api/test-results/latest
//
// Returns the most recent test result from the database.
// Used by the results page when sessionStorage is empty (e.g. after a refresh).
//
// Response (200): { result: TestResultInsert }
// Response (404): { error: "no_results_found" }
// Response (500): database error

import { NextResponse } from "next/server";
import { getLatestTestResult } from "@/lib/db/queries";

export async function GET() {
  try {
    const latest = await getLatestTestResult();
    if (!latest) {
      return NextResponse.json({ error: "no_results_found" }, { status: 404 });
    }
    return NextResponse.json({ result: latest });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[test-results/latest] error:", message);
    return NextResponse.json(
      { error: "database_error", detail: message },
      { status: 500 },
    );
  }
}
