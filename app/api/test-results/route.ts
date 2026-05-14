// app/api/test-results/route.ts
//
// POST /api/test-results
//
// Saves a completed test result to the testResults table.
//
// Request body:
//   {
//     takenAt:         number   — unix ms timestamp
//     durationSeconds: number   — elapsed seconds at submission
//     totalQuestions:  number   — always 20
//     correct:         number   — 0–20
//     vocabScore:      number   — 0.0–1.0
//     grammarScore:    number   — 0.0–1.0
//     readingScore:    number   — 0.0–1.0
//     mistakes:        string   — JSON array of wrong Question objects
//   }
//
// Response (200): { saved: true }
// Response (400): malformed body
// Response (500): database error

import { type NextRequest, NextResponse } from "next/server";
import { saveTestResult, getLatestTestResult, getAllTestResults } from "@/lib/db/queries";

interface TestResultBody {
  takenAt: number;
  durationSeconds: number;
  totalQuestions: number;
  correct: number;
  vocabScore: number;
  grammarScore: number;
  readingScore: number;
  mistakes: string; // JSON string
}

function isValidBody(b: unknown): b is TestResultBody {
  if (!b || typeof b !== "object") return false;
  const body = b as Record<string, unknown>;
  return (
    typeof body.takenAt === "number" &&
    typeof body.durationSeconds === "number" &&
    typeof body.totalQuestions === "number" &&
    typeof body.correct === "number" &&
    typeof body.vocabScore === "number" &&
    typeof body.grammarScore === "number" &&
    typeof body.readingScore === "number" &&
    typeof body.mistakes === "string"
  );
}

export async function POST(req: NextRequest) {
  let body: TestResultBody;

  try {
    body = (await req.json()) as TestResultBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_request_body" },
      { status: 400 },
    );
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        error: "invalid_body_shape",
        detail: "All numeric fields and mistakes string are required",
      },
      { status: 400 },
    );
  }

  try {
    await saveTestResult({
      takenAt: body.takenAt,
      durationSeconds: body.durationSeconds,
      totalQuestions: body.totalQuestions,
      correct: body.correct,
      vocabScore: body.vocabScore,
      grammarScore: body.grammarScore,
      readingScore: body.readingScore,
      mistakes: body.mistakes,
    });

    return NextResponse.json({ saved: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[test-results] saveTestResult failed:", message);
    return NextResponse.json(
      { error: "database_error", detail: message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  try {
    if (all) {
      const results = await getAllTestResults(); // we'll write this
      return NextResponse.json({ results });
    } else {
      // keep the existing "latest" behaviour if you want
      const latest = await getLatestTestResult();
      if (!latest) {
        return NextResponse.json(
          { error: "no_results_found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ result: latest });
    }
  } catch (err) {
    console.error("[test-results] GET error:", err);
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }
}
