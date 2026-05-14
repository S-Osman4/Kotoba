// app/api/test-results/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { testResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }, 
) {
  const { id: idParam } = await params; 
  const id = parseInt(idParam);

  if (isNaN(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  try {
    const result = await db
      .select()
      .from(testResults)
      .where(eq(testResults.id, id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ result: result[0] });
  } catch (err) {
    console.error("[test-results/id] error:", err);
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }
}
