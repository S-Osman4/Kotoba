// components/logbook/LogStats.tsx
//
// Four-stat summary row shown at the top of the logbook.
//
// Stats: total words learned · today count · current streak · top category
//
// Each stat is a labelled number. The row is horizontally scrollable on
// mobile so all four stats are always accessible without wrapping.
// On desktop they sit comfortably in a row.

import type { LogbookStats } from '@/types/logbook'

interface LogStatsProps {
    stats: LogbookStats
}

interface StatItemProps {
    value: string | number
    label: string
}

function StatItem({ value, label }: StatItemProps) {
    return (
        <div className="flex flex-col items-center gap-0.5 flex-none px-4 first:pl-0 last:pr-0">
            <span className="font-mono text-2xl text-sakura-deep font-medium">
                {value}
            </span>
            <span className="font-sans text-xs text-anko-light whitespace-nowrap">
                {label}
            </span>
        </div>
    )
}

// Maps category key to a readable label
const CATEGORY_LABELS: Record<string, string> = {
    vocabulary: 'vocab',
    grammar: 'grammar',
    kanji: 'kanji',
}

export default function LogStats({ stats }: LogStatsProps) {
    const { total, today, streak, topCategory } = stats

    const topLabel = topCategory
        ? CATEGORY_LABELS[topCategory] ?? topCategory
        : '—'

    return (
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-4 border-b border-paper-3">
            <StatItem value={total} label="words learned" />
            <div className="w-px h-8 bg-paper-3 mx-4 flex-none" aria-hidden="true" />
            <StatItem value={today} label="today" />
            <div className="w-px h-8 bg-paper-3 mx-4 flex-none" aria-hidden="true" />
            <StatItem
                value={streak > 0 ? `${streak}d` : '—'}
                label="streak"
            />
            <div className="w-px h-8 bg-paper-3 mx-4 flex-none" aria-hidden="true" />
            <StatItem value={topLabel} label="top category" />
        </div>
    )
}