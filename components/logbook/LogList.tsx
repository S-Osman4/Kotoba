// components/logbook/LogList.tsx
//
// Date-grouped list of learned word entries.
//
// Each group has a date header ('Today', 'Yesterday', or a formatted date)
// followed by LogEntry rows for that date.
//
// On mobile this is the full-screen list view.
// On desktop this is the left 280px panel — fixed width, scrollable.
//
// Selected entry is tracked by the parent and passed down as selectedId
// so the active row can show its selected state.

import LogEntryRow from './LogEntry'
import { formatDateLabel } from '@/types/logbook'
import type { LogEntry } from '@/types/logbook'

interface LogListProps {
    groups: { date: string; items: LogEntry[] }[]
    selectedId: number | null
    onSelect: (entry: LogEntry) => void
}

export default function LogList({ groups, selectedId, onSelect }: LogListProps) {
    if (groups.length === 0) return null

    return (
        <div className="flex flex-col">
            {groups.map(({ date, items }) => (
                <div key={date}>
                    {/* Date group header */}
                    <div className="
            sticky top-0 z-10
            px-4 py-1.5
            bg-paper-2 border-b border-paper-3
            font-mono text-xs text-anko-light
            uppercase tracking-widest
          ">
                        {formatDateLabel(date)}
                    </div>

                    {/* Entries for this date */}
                    {items.map((entry) => (
                        <LogEntryRow
                            key={entry.id}
                            entry={entry}
                            isSelected={entry.id === selectedId}
                            onClick={onSelect}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}