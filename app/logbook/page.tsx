// app/logbook/page.tsx
//
// Logbook screen.
//
// Desktop layout: two-panel
//   Left panel  — 280px fixed, scrollable LogList
//   Right panel — flex-1, LogDetail for the selected entry
//                 or a prompt to select an entry if none selected
//
// Mobile layout: list only
//   Tapping an entry navigates to /logbook/[word] (drill-down)
//   The LogDetail component is not rendered on mobile here —
//   it lives at app/logbook/[word]/page.tsx
//
// States:
//   loading  — skeleton rows
//   error    — plain text + retry (distinct from empty state)
//   empty    — LogEmpty blank notebook card
//   success  — LogStats + LogList + LogDetail (desktop)
//
// Data fetching:
//   Fetches once on mount. Does not refetch on focus — the logbook
//   is append-only so stale data is not a problem within a session.
//   A manual refresh button is provided in the error state.
//
// The today date param uses the client's local date (en-CA format
// = YYYY-MM-DD) so the server counts "today" correctly for the user's
// timezone. This is computed once at fetch time.

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import LogStats from '@/components/logbook/LogStats'
import LogList from '@/components/logbook/LogList'
import LogDetail from '@/components/logbook/LogDetail'
import LogEmpty from '@/components/logbook/LogEmpty'
import { apiFetch } from '@/lib/api'
import {
    toLogEntry,
    groupByDate,
    type LogEntry,
    type LogbookResponse,
    type LogbookStats,
} from '@/types/logbook'

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-paper-3">
            <div className="w-12 h-5 rounded bg-sakura-pale animate-shimmer flex-none" />
            <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-20 rounded bg-paper-3 animate-shimmer" />
                <div className="h-3 w-32 rounded bg-paper-3 animate-shimmer" />
            </div>
            <div className="w-10 h-4 rounded bg-paper-3 animate-shimmer flex-none" />
        </div>
    )
}
function SkeletonList() {
    return (
        <div>
            {/* Skeleton date header */}
            <div className="px-4 py-1.5 bg-paper-2 border-b border-paper-3">
                <div className="h-3 w-16 rounded bg-paper-3 animate-shimmer" />
            </div>
            {[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
        </div>
    )
}

export default function LogbookPage() {
    const router = useRouter()

    const [loadState, setLoadState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'success'; entries: LogEntry[]; stats: LogbookStats }>({ status: 'loading' })
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'vocabulary' | 'grammar' | 'kanji'>('all')

    // ── Fetch logbook data (only once on mount) ───────────────────────────────
    const fetchLogbook = useCallback(async () => {
        setLoadState({ status: 'loading' })
        const today = new Date().toLocaleDateString('en-CA')
        try {
            const data = await apiFetch<LogbookResponse>(`/api/logbook?today=${encodeURIComponent(today)}`)
            const entries = data.entries.map(toLogEntry)
            setLoadState({ status: 'success', entries, stats: data.stats })
            // Reset selected entry if it no longer exists
            if (selectedId !== null && !entries.find(e => e.id === selectedId)) {
                setSelectedId(null)
                setSelectedEntry(null)
            }
        } catch {
            setLoadState({ status: 'error' })
        }
    }, [selectedId])

    useEffect(() => { fetchLogbook() }, [fetchLogbook])

    // ── Derive filtered groups from the raw entries ───────────────────────────
    const filteredEntries = loadState.status === 'success'
        ? (categoryFilter === 'all' ? loadState.entries : loadState.entries.filter(e => e.category === categoryFilter))
        : []
    const groups = groupByDate(filteredEntries)
    const isEmpty = loadState.status === 'success' && groups.length === 0

    // ── Entry selection ───────────────────────────────────────────────────────
    const handleSelect = useCallback((entry: LogEntry) => {
        if (window.innerWidth < 640) {
            router.push(`/logbook/${encodeURIComponent(entry.word)}`)
            return
        }
        setSelectedId(entry.id)
        setSelectedEntry(entry)
    }, [router])

    // ── Action stub ──────────────────────────────────────────────────────────
    const handleAction = useCallback((message: string) => {
        console.log('[logbook] action stub:', message)
    }, [])

    return (
        <div className="min-h-screen bg-paper">
            {/* Top bar */}
            <header className="sticky top-0 z-10 bg-paper border-b border-paper-3">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-serif text-xl text-sakura-deep font-semibold">語</span>
                        <span className="font-serif text-md text-anko-mid">logbook</span>
                    </div>
                    <span className="font-mono text-xs text-anko-light">帳</span>
                </div>
            </header>

            {/* Stats row */}
            {loadState.status === 'success' && (
                <div className="max-w-5xl mx-auto px-4">
                    <LogStats stats={loadState.stats} />
                </div>
            )}

            {/* Loading skeleton */}
            {loadState.status === 'loading' && (
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-paper-3">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="flex flex-col items-center gap-1 flex-none px-4">
                                <div className="h-6 w-8 rounded bg-sakura-pale animate-shimmer" />
                                <div className="h-3 w-16 rounded bg-paper-3 animate-shimmer" />
                            </div>
                        ))}
                    </div>
                    <SkeletonList />
                </div>
            )}

            {/* Error state */}
            {loadState.status === 'error' && (
                <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4">
                    <p className="font-sans text-md text-anko-mid">couldn&apos;t load your logbook — check your connection</p>
                    <button onClick={fetchLogbook} className="self-start px-4 py-2 rounded font-sans text-md font-medium text-white bg-sakura hover:bg-sakura-deep">try again</button>
                </div>
            )}

            {/* Empty state */}
            {isEmpty && (
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <LogEmpty />
                </div>
            )}

            {/* Two‑panel layout (only when data loaded and not empty) */}
            {loadState.status === 'success' && !isEmpty && (
                <>
                    {/* Filter row */}
                    <div className="max-w-5xl mx-auto px-4 pt-2">
                        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
                            {(['all', 'vocabulary', 'grammar', 'kanji'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`
                                        flex-none px-3 py-1 rounded-full font-sans text-xs transition-colors
                                        ${categoryFilter === cat
                                            ? 'bg-sakura-pale text-sakura-deep border border-sakura-mid'
                                            : 'text-anko-mid hover:bg-paper-2 border border-transparent'}
                                    `}
                                >
                                    {cat === 'all' ? 'All' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Left list + right detail */}
                    <div className="max-w-5xl mx-auto flex">
                        {/* Left panel */}
                        <div className="w-full sm:w-70 sm:flex-none sm:border-r sm:border-paper-3 sm:min-h-[calc(100vh-120px)] overflow-y-auto">
                            <LogList groups={groups} selectedId={selectedId} onSelect={handleSelect} />
                        </div>
                        {/* Right panel (desktop only) */}
                        <div className="hidden sm:flex flex-1 min-h-[calc(100vh-120px)]">
                            {selectedEntry ? (
                                <div className="w-full">
                                    <LogDetail entry={selectedEntry} onAction={handleAction} />
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="font-serif text-lg text-anko-light">select a word to see details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}