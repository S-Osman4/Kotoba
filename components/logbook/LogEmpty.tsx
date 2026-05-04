// components/logbook/LogEmpty.tsx
//
// Empty state shown when the logbook has no entries.
//
// Per design doc §3.3:
//   "blank notebook card: spine, rings, ruled lines — but no content blocks,
//    no stacked shadow. Inside the content area: one line in anko-light
//    Noto Serif JP: 'your first word will appear here'. Below the card: a
//    subtle arrow pointing down toward the bottom nav study tab."
//
// The arrow is rendered as a simple SVG chevron.
// No illustration, no mascot — the blank card IS the empty state.

import NotebookCard from '@/components/question/NotebookCard'

export default function LogEmpty() {
    return (
        <div className="flex flex-col items-center">
            <NotebookCard variant="study" shadowLayers={0} className="w-full">
                <div className="py-12 flex items-center justify-center">
                    <p className="font-serif text-lg text-anko-light">
                        your first word will appear here
                    </p>
                </div>
            </NotebookCard>

            {/* Subtle arrow pointing toward the bottom nav */}
            <div className="mt-6 flex flex-col items-center gap-1 text-anko-light">
                <span className="font-sans text-xs">study to add words</span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M8 3v10M8 13L4 9M8 13l4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    )
}