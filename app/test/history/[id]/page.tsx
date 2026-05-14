// app/test/history/[id]/page.tsx
//
// Individual test result detail.
//
// Previously at /test/test-history/[id]. Moved to /test/history/[id]
// for consistent URL structure under the /test prefix.
//
// Shows:
//   - Score header with hanko stamp
//   - Section breakdown bars (vocab / grammar / reading)
//   - Collapsible mistake cards — includes SKIPPED questions
//     (the session page now includes unanswered questions in the mistake list)
//   - Actions: take another test, back to history

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import HankoStamp from '@/components/question/HankoStamp'
import { apiFetch } from '@/lib/api'
import type { Question } from '@/types/question'
import type { HankoCharacter } from '@/components/question/HankoStamp'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestResultDetail {
  id: number
  takenAt: number
  durationSeconds: number
  totalQuestions: number
  correct: number
  vocabScore: number
  grammarScore: number
  readingScore: number
  mistakes: string   // JSON string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stampFromScore(correct: number, total: number): HankoCharacter {
  if (correct === total) return '完'
  if (correct / total >= 0.8) return '合'
  if (correct / total >= 0.6) return '可'
  return '再'
}

function stampLabel(stamp: HankoCharacter): string {
  switch (stamp) {
    case '完': return 'perfect score'
    case '合': return 'pass'
    case '可': return 'borderline pass'
    case '再': return 'needs more study'
    default: return ''
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}



// ─── Section bar ──────────────────────────────────────────────────────────────

function SectionBar({
  label, score, total, correct,
}: { label: string; score: number; total: number; correct: number }) {
  const pct = Math.round(score * 100)
  const isPassing = score >= 0.6

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm text-anko-mid">{label}</span>
        <span className="font-mono text-xs text-anko-light">
          {correct} / {total} — {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-paper-3 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: isPassing ? '#6B8F5E' : '#E24B4A',
          }}
        />
      </div>
    </div>
  )
}

// ─── Mistake card ─────────────────────────────────────────────────────────────

function MistakeCard({ question }: { question: Question }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-paper-3 rounded-lg bg-paper overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full px-4 py-3 text-left
          flex items-center justify-between
          hover:bg-paper-2 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sakura-mid
        "
      >
        <span className="font-mono text-xs text-anko-light uppercase tracking-wider flex-none">
          {question.type}
        </span>
        <span className="font-serif text-md text-anko truncate max-w-[55%] mx-3">
          {question.stem}
        </span>
        <span className="font-mono text-xs text-anko-light flex-none">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-4 py-3 border-t border-paper-3 bg-paper-2 flex flex-col gap-2">
          <p className="font-sans text-sm text-anko">
            <strong className="text-sakura">correct answer:</strong>{' '}
            {question.choices[question.correctIndex]}
          </p>
          <p className="font-sans text-sm text-anko-mid leading-relaxed">
            {question.explanation}
          </p>
          {question.memoryHook && (
            <p className="font-sans text-xs text-anko-light italic">
              💡 {question.memoryHook}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestHistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [result, setResult] = useState<TestResultDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    apiFetch<{ result: TestResultDetail }>(`/api/test-results/${id}`)
      .then(data => setResult(data.result))
      .catch(() => setHasError(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/test/history')
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="font-sans text-md text-anko-light">loading result…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (hasError || !result) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar
          right={
            <button
              onClick={handleBack}
              aria-label="Back"
              className="
                flex items-center justify-center w-8 h-8 rounded
                text-anko-mid hover:text-anko hover:bg-paper-2
                transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
              "
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          }
        />
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
          <p className="font-sans text-md text-anko-mid">
            couldn&apos;t load this result — check your connection
          </p>
          <button
            onClick={handleBack}
            className="self-start font-sans text-md text-sakura hover:text-sakura-deep transition-colors"
          >
            ← back to history
          </button>
        </div>
      </div>
    )
  }

  // ── Parse mistakes ─────────────────────────────────────────────────────────

  let mistakes: Question[] = []
  try {
    const parsed = JSON.parse(result.mistakes)
    if (Array.isArray(parsed)) mistakes = parsed
  } catch { /* ignore */ }

  const stamp = stampFromScore(result.correct, result.totalQuestions)
  const isPerfect = stamp === '完'

  return (
    <div className="min-h-screen bg-paper">
      <TopBar
        right={
          <button
            onClick={handleBack}
            aria-label="Back to test history"
            className="
              flex items-center justify-center w-8 h-8 rounded
              text-anko-mid hover:text-anko hover:bg-paper-2
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
            "
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Score header ── */}
        <div className="flex items-center gap-4">
          <HankoStamp character={stamp} size={56} rotation={-4} />
          <div>
            <p className="font-serif text-3xl text-anko">
              {result.correct} / {result.totalQuestions}
            </p>
            <p className="font-sans text-md text-anko-mid">
              {stampLabel(stamp)}
            </p>
            <p className="font-mono text-xs text-anko-light mt-0.5">
              {formatDuration(result.durationSeconds)}
            </p>
          </div>
        </div>

        {/* ── Section breakdown ── */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs text-anko-light uppercase tracking-widest">
            section breakdown
          </p>
          <SectionBar
            label="vocabulary"
            score={result.vocabScore}
            total={8}
            correct={Math.round(result.vocabScore * 8)}
          />
          <SectionBar
            label="grammar"
            score={result.grammarScore}
            total={6}
            correct={Math.round(result.grammarScore * 6)}
          />
          <SectionBar
            label="reading"
            score={result.readingScore}
            total={6}
            correct={Math.round(result.readingScore * 6)}
          />
        </div>

        {/* ── Mistakes ── */}
        {!isPerfect && mistakes.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-sans text-md text-anko-mid">
              {mistakes.length} question{mistakes.length !== 1 ? 's' : ''} to review
            </p>
            <div className="flex flex-col gap-2">
              {mistakes.map((q, i) => (
                <MistakeCard key={i} question={q} />
              ))}
            </div>
          </div>
        )}

        {isPerfect && (
          <p className="font-serif text-md text-anko-mid">
            perfect score — no mistakes to review
          </p>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 pt-2 border-t border-paper-3">
          <button
            onClick={() => router.push('/test/session')}
            className="
              w-full py-2.5 px-4 rounded
              font-sans text-md font-medium text-white
              bg-sakura hover:bg-sakura-deep
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
          >
            take another test
          </button>
          <button
            onClick={() => router.push('/test/history')}
            className="
              w-full py-2.5 px-4 rounded
              font-sans text-md font-medium
              text-sakura-deep border border-sakura-mid
              hover:bg-sakura-wash
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
          >
            back to history
          </button>
        </div>

      </main>
    </div>
  )
}