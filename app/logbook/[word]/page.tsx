// app/logbook/[word]/page.tsx
//
// Mobile drill-down word detail page.
//
// Reached by tapping a logbook entry on mobile. The word is passed
// as a URL path segment — Japanese characters are URL-encoded by
// the browser automatically when using Next.js Link or router.push.
//
// This page fetches the single entry by re-fetching the full logbook
// and finding the matching word. There is no dedicated single-word
// API endpoint — the logbook is small enough that this is fine.
//
// On desktop this route is never reached — the parent logbook page
// handles detail in a right panel without navigation.
//
// Back navigation: the back arrow in the top bar returns to /logbook.
// It uses router.back() so it respects browser history — if the user
// deep-linked directly to this page, it falls back to /logbook.

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import LogDetail from '@/components/logbook/LogDetail'
import { toLogEntry } from '@/types/logbook'
import type { LogEntry, LogbookResponse } from '@/types/logbook'
import { apiFetch } from '@/lib/api'

export default function WordDetailPage() {
    const router = useRouter()
    const params = useParams()

    // Decode the URL-encoded word param
    const wordParam = typeof params.word === 'string'
        ? decodeURIComponent(params.word)
        : null

    const [entry, setEntry] = useState<LogEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!wordParam) {
            setError(true)
            setLoading(false)
            return
        }

        const today = new Date().toLocaleDateString('en-CA')

        apiFetch<LogbookResponse>(`/api/logbook?today=${encodeURIComponent(today)}`)
            .then(data => {
                const raw = data.entries.find(e => e.word === wordParam)
                if (!raw) {
                    setError(true)
                    return
                }
                setEntry(toLogEntry(raw))
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [wordParam])

    const handleBack = () => {
        // router.back() falls back gracefully if there is no history
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push('/logbook')
        }
    }

    // Stub — will be wired to the shared ask bar in Step 9
    const handleAction = (message: string) => {
        console.log('[logbook/word] action stub:', message)
    }

    return (
        <div className="min-h-screen bg-paper">

            {/* ── Top bar with back arrow ── */}
            <header className="sticky top-0 z-10 bg-paper border-b border-paper-3">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        aria-label="Back to logbook"
                        className="
              flex items-center justify-center w-8 h-8 -ml-1 rounded
              text-anko-mid hover:text-anko hover:bg-paper-2
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
            "
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path
                                d="M10 3L5 8l5 5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <span className="font-serif text-lg text-anko">
                        {wordParam ?? 'word'}
                    </span>
                </div>
            </header>

            {/* ── Content ── */}
            <main>
                {loading && (
                    <div className="px-6 py-8 flex items-center justify-center">
                        <p className="font-sans text-md text-anko-light">loading…</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="px-6 py-8 flex flex-col gap-4">
                        <p className="font-sans text-md text-anko-mid">
                            couldn&apos;t load this word — check your connection
                        </p>
                        <button
                            onClick={handleBack}
                            className="font-sans text-md text-sakura hover:text-sakura-deep transition-colors"
                        >
                            ← back to logbook
                        </button>
                    </div>
                )}

                {!loading && !error && entry && (
                    <LogDetail entry={entry} onAction={handleAction} />
                )}
            </main>
        </div>
    )
}