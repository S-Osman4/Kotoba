// app/api/progress/route.ts
//
// POST /api/progress
//
// Called by the study page immediately after the user selects a correct answer.
// Writing happens server-side so the client never touches the database directly.
//
// Request body:
//   {
//     word:            string   — the Japanese word e.g. '電車'
//     reading:         string   — hiragana reading e.g. 'でんしゃ'
//     meaning:         string   — English meaning e.g. 'train, electric train'
//     category:        string   — 'vocabulary' | 'grammar' | 'kanji'
//     firstSentence:   string   — the question stem the word appeared in
//     firstSentenceEn: string   — English meaning of the correct choice
//     furiganaMap:     string   — JSON-serialised FuriganaMap object
//   }
//
// Response (200):
//   { saved: boolean, word: string }
//   saved = true  → new row inserted
//   saved = false → word already existed (ON CONFLICT DO NOTHING fired)
//
// Response (400): malformed body
// Response (500): database error
//
// This route is NOT on the edge runtime — it uses the Turso Node.js client
// which requires a full Node.js environment (not available on Vercel Edge).

import { type NextRequest, NextResponse } from 'next/server'
import { saveLearnedWord }    from '@/lib/db/queries'
import { updateSessionStats } from '@/lib/db/queries'

// ─── Request body type ────────────────────────────────────────────────────────

interface ProgressRequestBody {
  word:            string
  reading:         string
  meaning:         string
  category:        string
  firstSentence:   string
  firstSentenceEn: string
  furiganaMap:     string   // JSON string — already serialised by the client
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidBody(b: unknown): b is ProgressRequestBody {
  if (!b || typeof b !== 'object') return false
  const body = b as Record<string, unknown>
  return (
    typeof body.word            === 'string' && body.word.length > 0 &&
    typeof body.reading         === 'string' &&
    typeof body.meaning         === 'string' && body.meaning.length > 0 &&
    typeof body.category        === 'string' && body.category.length > 0 &&
    typeof body.firstSentence   === 'string' &&
    typeof body.firstSentenceEn === 'string' &&
    typeof body.furiganaMap     === 'string'
  )
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: ProgressRequestBody

  try {
    body = (await req.json()) as ProgressRequestBody
  } catch {
    return NextResponse.json(
      { error: 'invalid_request_body', detail: 'Expected JSON body' },
      { status: 400 }
    )
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        error:  'invalid_body_shape',
        detail: 'Required fields: word, reading, meaning, category, firstSentence, firstSentenceEn, furiganaMap',
      },
      { status: 400 }
    )
  }

  // 2. Write to learnedWords — ON CONFLICT DO NOTHING on word column
  let saved: boolean

  try {
    saved = await saveLearnedWord({
      word:            body.word,
      reading:         body.reading,
      meaning:         body.meaning,
      category:        body.category,
      firstSentence:   body.firstSentence   || null,
      firstSentenceEn: body.firstSentenceEn || null,
      furiganaMap:     body.furiganaMap      || null,
      learnedAt:       Date.now(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[progress] saveLearnedWord failed:', message)
    return NextResponse.json(
      { error: 'database_error', detail: message },
      { status: 500 }
    )
  }

  // 3. Update session stats — always called, even if word already existed.
  //    wordStudied = true because this endpoint is only called on correct answers.
  try {
    await updateSessionStats({ wordStudied: true })
  } catch (err) {
    // Non-fatal — stats are best-effort. Log but don't fail the request.
    const message = err instanceof Error ? err.message : String(err)
    console.error('[progress] updateSessionStats failed (non-fatal):', message)
  }

  // 4. Respond
  return NextResponse.json({ saved, word: body.word })
}