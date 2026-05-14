// app/api/questions/route.ts
//
// POST /api/questions
//
// Generates a single JLPT N5 question using the configured AI provider.
//
// Request body:
//   { type: QuestionType, subMode: SubMode }
//
// Response (200):
//   Question JSON — validated against isValidQuestion()
//
// Response (500):
//   { error: 'error_generating_question', detail: string }
//
// Retry logic:
//   If the AI returns malformed JSON or a shape that fails isValidQuestion(),
//   we retry once with the same prompt. Two consecutive failures return 500.
//   The frontend shows NotebookError on 500.
//
// Edge runtime:
//   Declared below. This runs on Vercel's edge network — lower latency,
//   no cold starts. Both Gemini (HTTPS) and Ollama (local only) work here.
//   Note: Ollama is only reachable in local dev, not on Vercel edge.

import { type NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/client";
import {
  generateQuestionPrompt,
  GENERATE_TRIGGER,
} from "@/lib/prompts/generate";
import {
  isValidQuestion,
  type QuestionType,
  type SubMode,
} from "@/types/question";

export const runtime = "edge";

// ─── Request body type ────────────────────────────────────────────────────────

interface QuestionsRequestBody {
  type: QuestionType;
  subMode: SubMode;
  recentKanji?: string[]; // optional, used for kanji question generation to avoid repeats
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

/**
 * Extracts a JSON object from a string that may contain surrounding text.
 *
 * Some models wrap their JSON in markdown fences (```json ... ```) or
 * add a preamble sentence despite being told not to. This function finds
 * the first { and last } in the string and attempts to parse what's between.
 *
 * Returns null if no valid JSON object is found.
 */
function extractJSON(text: string): unknown {
  // Remove <think>...</think> blocks (including multi-line content)
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const trimmed = cleaned.trim();

  // Fast path — starts with {
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Fall through
    }
  }

  // Slow path — find outermost { ... }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ─── Single attempt ───────────────────────────────────────────────────────────

/**
 * Makes one attempt at generating a valid question.
 * Returns the validated Question or null if generation/validation fails.
 */
async function attemptGeneration(type: QuestionType, avoidKanji?: string[]) {
  let system = generateQuestionPrompt(type);

  if (type === "kanji" && avoidKanji?.length) {
    system += `\n\n**DO NOT USE ANY OF THESE KANJI:** ${avoidKanji.join(", ")}`;
  }

  const model =
    type === "kanji" ? "llama-3.3-70b-versatile" : "llama-3.3-70b-versatile";

  const { text } = await generateText({
    system,
    prompt: GENERATE_TRIGGER,
    maxTokens: type === "reading" ? 1200 : 700,
    model,
  });

  const parsed = extractJSON(text);

  if (!parsed) {
    console.error(
      "[questions] JSON extraction failed. Raw output:",
      text.slice(0, 200),
    );
    return null;
  }

  if (!isValidQuestion(parsed)) {
    console.error(
      "[questions] isValidQuestion failed. Parsed object:",
      JSON.stringify(parsed).slice(0, 300),
    );
    return null;
  }

  return parsed;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse and validate request body
  let body: QuestionsRequestBody;

  try {
    body = (await req.json()) as QuestionsRequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "invalid_request_body",
        detail: "Expected JSON body with type and subMode",
      },
      { status: 400 },
    );
  }

  const validTypes: QuestionType[] = [
    "vocabulary",
    "grammar",
    "kanji",
    "reading",
  ];

  if (!validTypes.includes(body.type)) {
    return NextResponse.json(
      {
        error: "invalid_type",
        detail: `type must be one of: ${validTypes.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const { type, recentKanji } = body; // ← extract

  // 2. First attempt
  try {
    const question = await attemptGeneration(type, recentKanji); // ← pass

    if (question) {
      return NextResponse.json(question);
    }
  } catch (err) {
    // Log but don't return yet — we still have one retry
    console.error("[questions] First attempt threw:", err);
  }

  // 3. Single retry
  console.warn("[questions] First attempt failed — retrying once");

  try {
    const question = await attemptGeneration(type, recentKanji); // ← pass

    if (question) {
      return NextResponse.json(question);
    }

    // Both attempts produced invalid output
    return NextResponse.json(
      {
        error: "error_generating_question",
        detail: "AI returned malformed output on both attempts",
      },
      { status: 500 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.error("[questions] Retry also threw:", message);

    return NextResponse.json(
      {
        error: "error_generating_question",
        detail: message,
      },
      { status: 500 },
    );
  }
}
