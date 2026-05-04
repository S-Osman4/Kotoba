// components/logbook/LogDetail.tsx
//
// Detail panel for a selected logbook entry.
//
// Desktop: renders as the right panel of the two-panel layout.
// Mobile:  renders as a full-screen page (app/logbook/[word]/page.tsx).
//          The same component is used in both contexts — only the
//          surrounding layout differs.
//
// Content:
//   - Word at 32px with furigana
//   - Reading in DM Mono
//   - Meaning
//   - Category tag
//   - First-seen sentence with furigana (if available)
//   - Date/time learned
//   - Action buttons: "drill this word" and "explain kanji"
//
// Action buttons are stubbed — they will be wired to the ask bar in Step 9
// when the bottom nav and shared chat state exist. For now they call onAction
// with a message string, which the parent can route however it needs to.

import FuriganaText from '@/components/question/FuriganaText'
import HankoStamp from '@/components/question/HankoStamp'
import type { LogEntry } from '@/types/logbook'

interface LogDetailProps {
    entry: LogEntry
    /** Called when the user taps an action button. Receives the message to send. */
    onAction: (message: string) => void
}

const CATEGORY_LABELS: Record<string, string> = {
    vocabulary: 'vocab',
    grammar: 'grammar',
    kanji: 'kanji',
}

function formatDateTime(learnedAt: number): string {
    return new Date(learnedAt).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function LogDetail({ entry, onAction }: LogDetailProps) {
    const categoryLabel = CATEGORY_LABELS[entry.category] ?? entry.category

    return (
        <div className="flex flex-col gap-6 px-6 py-6">

            {/* ── Word + stamp ── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    {/* Word at 32px with furigana */}
                    <FuriganaText
                        text={entry.word}
                        furiganaMap={entry.furiganaMap}
                        className="font-serif text-4xl text-anko block"
                        rtClassName="text-sakura"
                    />
                    {/* Reading */}
                    <span className="font-mono text-md text-anko-mid">
                        {entry.reading}
                    </span>
                </div>

                {/* Hanko stamp — larger, quietly rotated */}
                <HankoStamp
                    character="正"
                    size={40}
                    rotation={-4}
                    className="opacity-70 mt-1"
                />
            </div>

            {/* ── Meaning + category ── */}
            <div className="flex items-center gap-3">
                <p className="font-sans text-md text-anko flex-1">
                    {entry.meaning}
                </p>
                <span className="
          flex-none font-mono text-xs px-2 py-0.5 rounded
          bg-sakura-pale text-sakura-deep border border-sakura-soft
        ">
                    {categoryLabel}
                </span>
            </div>

            {/* ── First-seen sentence ── */}
            {entry.firstSentence && (
                <div className="pl-3 border-l-2 border-sakura-soft">
                    <p className="font-mono text-xs text-anko-light mb-1 uppercase tracking-widest">
                        first seen in
                    </p>
                    <FuriganaText
                        text={entry.firstSentence}
                        furiganaMap={entry.furiganaMap}
                        className="font-serif text-lg text-anko block leading-relaxed"
                        rtClassName="text-sakura"
                    />
                    {entry.firstSentenceEn && (
                        <p className="font-sans text-sm text-anko-mid mt-1">
                            {entry.firstSentenceEn}
                        </p>
                    )}
                </div>
            )}

            {/* ── Date/time learned ── */}
            <p className="font-mono text-xs text-anko-light">
                learned {formatDateTime(entry.learnedAt)}
            </p>

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-2 pt-2 border-t border-paper-3">
                <button
                    onClick={() => onAction(`Drill me on the word ${entry.word} (${entry.reading}).`)}
                    className="
            w-full py-2 px-4 rounded
            font-sans text-md font-medium text-white
            bg-sakura hover:bg-sakura-deep
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-2
          "
                >
                    drill this word
                </button>

                {/* Only show "explain kanji" for kanji category entries */}
                {entry.category === 'kanji' && (
                    <button
                        onClick={() => onAction(`Explain the kanji ${entry.word} — its meaning, readings, and common compounds.`)}
                        className="
              w-full py-2 px-4 rounded
              font-sans text-md font-medium
              text-sakura-deep border border-sakura-mid
              hover:bg-sakura-wash
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
                    >
                        explain kanji
                    </button>
                )}
            </div>

        </div>
    )
}