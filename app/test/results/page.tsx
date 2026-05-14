// app/test/results/page.tsx
//
// Post-test results screen.
//
// Data source priority:
//   1. sessionStorage (key 'test_result') — fastest, used right after submission.
//   2. GET /api/test-results/latest — fallback for refresh or direct navigation.
//
// Changes from original:
//   - "take test again" → navigates to /test/session (not /test)
//   - "back to logbook" → unchanged
//   - "view all test results →" → navigates to /test/history (was /test/test-history)
//   - "study weak areas" → unchanged (still goes to /study, score routing deferred)

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HankoStamp from '@/components/question/HankoStamp'
import TopBar from '@/components/layout/TopBar'
import type { Question } from '@/types/question'
import type { HankoCharacter } from '@/components/question/HankoStamp'
import { apiFetch } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredResultPayload {
  takenAt: number
  durationSeconds: number
  totalQuestions: number
  correct: number
  vocabScore: number
  grammarScore: number
  readingScore: number
  mistakes: string | Question[]
  userChoices?: number[]
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

// ─── Collapsible mistake card ─────────────────────────────────────────────────

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
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-inset focus-visible:ring-sakura-mid
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
        <div className="px-4 py-3 border-t border-paper-3 flex flex-col gap-2 bg-paper-2">
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function TestResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<StoredResultPayload | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadResults() {
      // 1. Try sessionStorage first
      let raw: string | null = null
      try {
        raw = sessionStorage.getItem('test_result')
      } catch { /* unavailable */ }

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as StoredResultPayload
          if (
            typeof parsed.correct === 'number' &&
            typeof parsed.totalQuestions === 'number'
          ) {
            if (!ignore) {
              setResult(parsed)
              sessionStorage.removeItem('test_result')
            }
            return
          }
        } catch { /* invalid JSON — fall through */ }
      }

      // 2. Fallback: fetch latest from database
      try {
        const data = await apiFetch<{ result: StoredResultPayload }>(
          '/api/test-results/latest'
        )
        if (!ignore && data.result) {
          setResult(data.result)
        } else if (!ignore) {
          setError(true)
        }
      } catch {
        if (!ignore) setError(true)
      }
    }

    loadResults()
    return () => { ignore = true }
  }, [])

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar />
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
          <p className="font-sans text-md text-anko-mid">
            couldn&apos;t load your test results — please take a test first.
          </p>
          <button
            onClick={() => router.push('/test')}
            className="self-start font-sans text-md text-sakura hover:text-sakura-deep transition-colors"
          >
            go to test →
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!result) {
    return (
      <div className="min-h-screen bg-paper">
        <TopBar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="font-sans text-md text-anko-light">loading results…</p>
        </div>
      </div>
    )
  }

  // ── Parse mistakes ─────────────────────────────────────────────────────────

  let mistakesArray: Question[] = []
  if (typeof result.mistakes === 'string') {
    try {
      const parsed = JSON.parse(result.mistakes)
      if (Array.isArray(parsed)) mistakesArray = parsed
    } catch { /* ignore */ }
  } else if (Array.isArray(result.mistakes)) {
    mistakesArray = result.mistakes
  }

  const stamp = stampFromScore(result.correct, result.totalQuestions)
  const isPerfect = stamp === '完'
  const mistakeCount = mistakesArray.length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-paper">
      <TopBar right={<span className="font-mono text-xs text-anko-light">試</span>} />

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

        {/* ── Mistakes list ── */}
        {!isPerfect && mistakeCount > 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-sans text-md text-anko-mid">
              {mistakeCount} question{mistakeCount !== 1 ? 's' : ''} to review
            </p>
            <div className="flex flex-col gap-2">
              {mistakesArray.map((q, idx) => (
                <MistakeCard key={idx} question={q} />
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
            onClick={() => router.push('/study')}
            className="
              w-full py-2.5 px-4 rounded
              font-sans text-md font-medium text-white
              bg-sakura hover:bg-sakura-deep
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
          >
            {isPerfect ? 'study something new →' : 'study weak areas →'}
          </button>

          <button
            onClick={() => router.push('/logbook')}
            className="
              w-full py-2.5 px-4 rounded
              font-sans text-md font-medium
              text-sakura-deep border border-sakura-mid
              hover:bg-sakura-wash
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
          >
            back to logbook
          </button>

          {/* Take test again — goes to session directly */}
          <button
            onClick={() => router.push('/test/session')}
            className="font-sans text-md text-anko-mid hover:text-anko py-2 transition-colors"
          >
            take test again
          </button>

          {/* View all results — updated to /test/history */}
          <button
            onClick={() => router.push('/test/history')}
            className="font-sans text-md text-anko-mid hover:text-anko py-2 transition-colors"
          >
            view all test results →
          </button>

        </div>
      </main>
    </div>
  )
}