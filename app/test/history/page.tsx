// app/test/history/page.tsx
//
// Full test history list.
//
// Previously lived at /test-history. Now at /test/history so all test
// routes live under the same prefix and the bottom nav 試 tab stays active.
//
// Shows all past test results, newest first.
// Each row: stamp, score, percentage bar, date, duration.
// Tapping a row navigates to /test/history/[id] for the detail view.

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import HankoStamp from '@/components/question/HankoStamp'
import { apiFetch } from '@/lib/api'
import type { HankoCharacter } from '@/components/question/HankoStamp'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestResultRow {
  id: number
  takenAt: number
  correct: number
  totalQuestions: number
  durationSeconds: number
  vocabScore: number
  grammarScore: number
  readingScore: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stampFromScore(correct: number, total: number): HankoCharacter {
  if (correct === total) return '完'
  if (correct / total >= 0.8) return '合'
  if (correct / total >= 0.6) return '可'
  return '再'
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({ result }: { result: TestResultRow }) {
  const stamp = stampFromScore(result.correct, result.totalQuestions)
  const percentage = Math.round((result.correct / result.totalQuestions) * 100)

  return (
    <Link
      href={`/test/history/${result.id}`}
      className="
        flex items-center gap-4 px-4 py-4
        border-b border-paper-3
        hover:bg-paper-2
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sakura-mid
      "
    >
      {/* Stamp */}
      <HankoStamp character={stamp} size={36} rotation={-3} className="flex-none" />

      {/* Score + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-xl text-anko">
            {result.correct} / {result.totalQuestions}
          </span>
          <span className="font-mono text-xs text-anko-light">
            {percentage}%
          </span>
        </div>

        {/* Section mini-bars */}
        <div className="flex items-center gap-2 mt-1.5">
          {[
            { label: 'V', score: result.vocabScore },
            { label: 'G', score: result.grammarScore },
            { label: 'R', score: result.readingScore },
          ].map(({ label, score }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="font-mono text-xs text-anko-light w-3">{label}</span>
              <div className="w-12 h-1 rounded-full bg-paper-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(score * 100)}%`,
                    backgroundColor: score >= 0.6 ? '#6B8F5E' : '#E24B4A',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="font-mono text-xs text-anko-light mt-1">
          {formatDate(result.takenAt)} at {formatTime(result.takenAt)}
          {' · '}
          {formatDuration(result.durationSeconds)}
        </p>
      </div>

      {/* Chevron */}
      <svg
        width="14" height="14" viewBox="0 0 14 14"
        fill="none" aria-hidden="true"
        className="flex-none text-anko-light"
      >
        <path
          d="M5 3l4 4-4 4"
          stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </Link>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-paper-3">
      <div className="w-9 h-9 rounded bg-sakura-pale animate-shimmer flex-none" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-24 rounded bg-paper-3 animate-shimmer" />
        <div className="h-3 w-40 rounded bg-paper-3 animate-shimmer" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestHistoryPage() {
  const router = useRouter()

  const [results, setResults] = useState<TestResultRow[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    apiFetch<{ results: TestResultRow[] }>('/api/test-results?all=true')
      .then(data => setResults(data.results))
      .catch(() => setHasError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      <TopBar
          right={
            
            
          <button
            onClick={() => router.push('/test')}
            aria-label="Back to test"
            className="
              flex items-center gap-1.5
              font-sans text-sm text-anko-mid
              hover:text-anko
              transition-colors duration-150
              focus-visible:outline-none focus-visible:underline
            "
          > 
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M9 3L5 7l4 4"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        }
        
      />

      <main className="max-w-2xl mx-auto">

        {/* Loading */}
        {loading && (
          <div>
            {[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Error */}
        {hasError && !loading && (
          <div className="px-4 py-8 flex flex-col gap-4">
            <p className="font-sans text-md text-anko-mid">
              couldn&apos;t load test history — check your connection
            </p>
            <button
              onClick={() => window.location.reload()}
              className="self-start font-sans text-md text-sakura hover:text-sakura-deep"
            >
              try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !hasError && results.length === 0 && (
          <div className="px-4 py-12 flex flex-col items-center gap-3 text-center">
            <p className="font-serif text-lg text-anko-light">
              no tests taken yet
            </p>
            <Link
              href="/test/session"
              className="font-sans text-md text-sakura hover:text-sakura-deep transition-colors"
            >
              take your first test →
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !hasError && results.length > 0 && (
          <>
            {/* Summary header */}
            <div className="px-4 py-3 border-b border-paper-3 flex items-center justify-between">
              <p className="font-mono text-xs text-anko-light">
                {results.length} test{results.length !== 1 ? 's' : ''} taken
              </p>
              <Link
                href="/test/session"
                className="
                  font-sans text-sm font-medium text-white
                  bg-sakura hover:bg-sakura-deep
                  px-3 py-1.5 rounded
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
                "
              >
                take test →
              </Link>
            </div>

            {results.map(result => (
              <ResultRow key={result.id} result={result} />
            ))}
          </>
        )}

      </main>
    </div>
  )
}