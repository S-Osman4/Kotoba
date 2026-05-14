// app/test/page.tsx
//
// Test lobby — shown when the user navigates to /test.
//
// Previously /test jumped immediately into the 20-question exam.
// This lobby gives the user context before committing:
//   - A clear "start test" CTA
//   - Their last 3 results as compact cards
//   - A link to the full history
//
// The exam itself is now at /test/session.
// Results live at /test/results (unchanged).
// Full history is at /test/history.
//
// Data: fetches the last 3 test results from /api/test-results?all=true.
// Shows a skeleton while loading, a quiet empty state if no tests yet.

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import HankoStamp from '@/components/question/HankoStamp'
import { apiFetch } from '@/lib/api'
import type { HankoCharacter } from '@/components/question/HankoStamp'

// Note: HankoStamp is used in RecentResultCard. The hero 試 stamp is a raw
// div because '試' is not in the HankoCharacter union (it's not a feedback char).

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestResultSummary {
  id: number
  takenAt: number
  correct: number
  totalQuestions: number
  durationSeconds: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stampFromScore(correct: number, total: number): HankoCharacter {
  if (correct === total) return '完'
  if (correct / total >= 0.8) return '合'
  if (correct / total >= 0.6) return '可'
  return '再'
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHrs = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

// ─── Recent result card ───────────────────────────────────────────────────────

function RecentResultCard({ result }: { result: TestResultSummary }) {
  const stamp = stampFromScore(result.correct, result.totalQuestions)
  const percentage = Math.round((result.correct / result.totalQuestions) * 100)

  return (
    <Link
      href={`/test/history/${result.id}`}
      className="
        flex items-center gap-4 px-4 py-3
        border border-paper-3 rounded
        hover:bg-paper-2
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
      "
    >
      <HankoStamp character={stamp} size={32} rotation={-3} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-lg text-anko">
            {result.correct} / {result.totalQuestions}
          </span>
          <span className="font-mono text-xs text-anko-light">
            {percentage}%
          </span>
        </div>
        <p className="font-mono text-xs text-anko-light">
          {formatRelativeTime(result.takenAt)} · {formatDuration(result.durationSeconds)}
        </p>
      </div>

      {/* Chevron */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M5 3l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-anko-light"
        />
      </svg>
    </Link>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border border-paper-3 rounded">
      <div className="w-8 h-8 rounded bg-sakura-pale animate-shimmer flex-none" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-4 w-20 rounded bg-paper-3 animate-shimmer" />
        <div className="h-3 w-32 rounded bg-paper-3 animate-shimmer" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestLobbyPage() {
  const router = useRouter()

  const [results, setResults] = useState<TestResultSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    apiFetch<{ results: TestResultSummary[] }>('/api/test-results?all=true')
      .then(data => {
        // Show only the 3 most recent
        setResults(data.results.slice(0, 3))
      })
      .catch(() => setHasError(true))
      .finally(() => setLoading(false))
  }, [])

  const hasResults = results.length > 0

  return (
    <div className="min-h-screen bg-paper">
      <TopBar right={<span className="font-mono text-xs text-anko-light">試</span>} />

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* ── Hero section ── */}
        <div className="flex flex-col gap-6">

          {/* Stamp + title */}
          <div className="flex items-center gap-4">
            {/* 試 is not a feedback HankoCharacter so we render it directly */}
            <div
              className="inline-flex items-center justify-center flex-none"
              style={{
                width: 56, height: 56,
                border: '2px solid #7A5568',   // anko-mid
                borderRadius: 4,
                color: '#4A2D3A',               // anko
                transform: 'rotate(-4deg)',
                opacity: 0.85,
              }}
              aria-hidden="true"
            >
              <span className="font-serif font-semibold select-none" style={{ fontSize: 30 }}>
                試
              </span>
            </div>
            <div>
              <h1 className="font-serif text-2xl text-anko">
                jlpt n5 test
              </h1>
              <p className="font-sans text-md text-anko-mid">
                20 questions · 25 minutes · no hints
              </p>
            </div>
          </div>

          {/* What to expect */}
          <div className="flex flex-col gap-2 pl-4 border-l-2 border-sakura-soft">
            {[
              '8 vocabulary questions',
              '6 grammar questions',
              '6 reading comprehension questions',
            ].map(item => (
              <p key={item} className="font-sans text-sm text-anko-mid">
                {item}
              </p>
            ))}
          </div>

          {/* Start CTA */}
          <button
            onClick={() => router.push('/test/session')}
            className="
              w-full sm:w-auto sm:self-start
              px-8 py-3 rounded
              font-sans text-md font-medium text-white
              bg-sakura hover:bg-sakura-deep
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
          >
            start test →
          </button>
        </div>

        {/* ── Recent results ── */}
        <div className="flex flex-col gap-3">

          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-anko-light uppercase tracking-widest">
              recent results
            </p>
            {hasResults && (
              <Link
                href="/test/history"
                className="
                  font-sans text-sm text-sakura
                  hover:text-sakura-deep
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:underline
                "
              >
                view all →
              </Link>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Error */}
          {hasError && !loading && (
            <p className="font-sans text-sm text-anko-light">
              couldn&apos;t load recent results
            </p>
          )}

          {/* Empty — no tests taken yet */}
          {!loading && !hasError && !hasResults && (
            <div className="
              flex flex-col items-center gap-2 py-8
              border border-paper-3 rounded
            ">
              <p className="font-serif text-lg text-anko-light">
                no tests taken yet
              </p>
              <p className="font-sans text-sm text-anko-light">
                your results will appear here after your first test
              </p>
            </div>
          )}

          {/* Result cards */}
          {!loading && !hasError && hasResults && (
            <div className="flex flex-col gap-2">
              {results.map(result => (
                <RecentResultCard key={result.id} result={result} />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}