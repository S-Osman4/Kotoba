import { NextRequest } from "next/server";
import { getLogbookStats } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  try {
    const stats = await getLogbookStats(today);
    return Response.json(stats);
  } catch (error) {
    console.error("[logbook-stats] Error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
