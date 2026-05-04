// app/api/logbook/route.ts
//
// GET /api/logbook
//
// Returns all learned words (newest first) and aggregated stats.
//
// Response (200):
//   {
//     entries: LearnedWordRaw[]   — raw database rows, newest first
//     stats:   LogbookStats       — total, today, streak, topCategory
//   }
//
// Response (500): database error
//
// Today's date is passed as a query param (?today=YYYY-MM-DD) so the
// server uses the client's local calendar date for the "today" count,
// not the server's UTC date. Without this, users in UTC+3 to UTC+12
// would see their evening words counted as "tomorrow".
//
// Not on edge runtime — uses the Turso Node.js client.

import { type NextRequest, NextResponse } from "next/server";
import { getLogbook, getLogbookStats } from "@/lib/db/queries";

export async function GET(req: NextRequest) {
  // Extract the client's local date from the query string.
  // Fall back to server UTC date if not provided — better than crashing.
  const { searchParams } = req.nextUrl;
  const todayParam = searchParams.get("today");

  // Validate format — must be YYYY-MM-DD
  const isValidDate = todayParam && /^\d{4}-\d{2}-\d{2}$/.test(todayParam);
  const today = isValidDate
    ? todayParam
    : new Date().toISOString().split("T")[0];

  try {
    const [entries, stats] = await Promise.all([
      getLogbook(),
      getLogbookStats(today),
    ]);

    return NextResponse.json({ entries, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[logbook] GET failed:", message);

    return NextResponse.json(
      { error: "database_error", detail: message },
      { status: 500 },
    );
  }
}
