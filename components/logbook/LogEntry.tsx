// components/logbook/LogEntry.tsx
//
// A single entry row in the logbook list.
//
// Layout (left to right):
//   [word large serif]  [reading mono + meaning sans stacked]  [category tag]  [hanko stamp]  [time]
//
// The row is a button — tapping it selects the entry and opens the detail view.
// Selected state uses sakura-wash background to indicate active entry on desktop.
//
// The hanko stamp is small (24px) and not rotated here — rotation is only used
// in feedback contexts (post-answer). In the logbook it sits as a quiet record.

import HankoStamp from '@/components/question/HankoStamp'
import type { LogEntry } from '@/types/logbook'

interface LogEntryProps {
    entry: LogEntry
    isSelected: boolean
    onClick: (entry: LogEntry) => void
}

// Maps category to a display label and colour classes
const CATEGORY_STYLES: Record<string, { label: string; className: string }> = {
    vocabulary: { label: 'vocab', className: 'bg-sakura-pale text-sakura-deep border-sakura-soft' },
    grammar: { label: 'grammar', className: 'bg-paper-2 text-anko-mid border-paper-3' },
    kanji: { label: 'kanji', className: 'bg-paper-2 text-anko-mid border-paper-3' },
}

function formatTime(learnedAt: number): string {
    return new Date(learnedAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function LogEntryRow({ entry, isSelected, onClick }: LogEntryProps) {
    const categoryStyle = CATEGORY_STYLES[entry.category] ?? {
        label: entry.category,
        className: 'bg-paper-2 text-anko-mid border-paper-3',
    }

    return (
        <button
            onClick={() => onClick(entry)}
            className={`
        w-full flex items-center gap-3 px-4 py-3
        border-b border-paper-3
        text-left transition-colors duration-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sakura-mid
        ${isSelected
                    ? 'bg-sakura-wash'
                    : 'hover:bg-paper-2 active:bg-paper-2'
                }
      `}
            aria-current={isSelected ? 'true' : undefined}
        >
            {/* Word — large serif */}
            <span className="font-serif text-xl text-anko flex-none w-16 truncate">
                {entry.word}
            </span>

            {/* Reading + meaning stacked */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="font-mono text-xs text-anko-mid truncate">
                    {entry.reading}
                </span>
                <span className="font-sans text-xs text-anko-light truncate">
                    {entry.meaning}
                </span>
            </div>

            {/* Category tag */}
            <span className={`
        flex-none font-mono text-xs px-1.5 py-0.5 rounded
        border ${categoryStyle.className}
      `}>
                {categoryStyle.label}
            </span>

            {/* Hanko stamp — small, upright, quiet */}
            <HankoStamp
                character="正"
                size={24}
                rotation={0}
                className="flex-none opacity-60"
            />

            {/* Time */}
            <span className="flex-none font-mono text-xs text-anko-light w-10 text-right">
                {formatTime(entry.learnedAt)}
            </span>
        </button>
    )
}