// components/drill/DrillBar.tsx
//
// Session header for quick drill mode.
//
// Contains (left to right):
//   - Hanko stamp (練 character, drill-accent colour)
//   - Title "quick drill"
//   - Pip dots (desktop) or fraction label (mobile) showing progress
//
// Pip states:
//   answered correct   → filled drill-accent dot
//   answered wrong     → filled red dot
//   current            → hollow drill-accent ring
//   upcoming           → hollow paper-3 ring
//
// On mobile the pip row is replaced by "Q N / 5" fraction label
// to conserve horizontal space (design doc §1.7 test mode pattern,
// applied consistently to drill).

import HankoStamp from '@/components/question/HankoStamp'

interface DrillBarProps {
    /** 0-based index of the current question (0–4) */
    currentIndex: number
    /** Array of results per answered question: true=correct, false=wrong, undefined=unanswered */
    results: (boolean | undefined)[]
}

export default function DrillBar({ currentIndex, results }: DrillBarProps) {
    const total = 5

    return (
        <div className="
      sticky top-0 z-10
      bg-drill border-b border-drill-border
      px-4 py-3
      flex items-center justify-between gap-3
    ">

            {/* Left: stamp + title */}
            <div className="flex items-center gap-2">
                <HankoStamp
                    character="合"
                    size={28}
                    rotation={-4}
                    className="opacity-80"
                />
                <span className="font-serif text-md text-anko">
                    quick drill
                </span>
            </div>

            {/* Right: pips (desktop) or fraction (mobile) */}

            {/* Fraction — mobile only */}
            <span className="font-mono text-xs text-anko-mid sm:hidden">
                Q {currentIndex + 1} / {total}
            </span>

            {/* Pip dots — desktop only */}
            <div className="hidden sm:flex items-center gap-2" aria-hidden="true">
                {Array.from({ length: total }).map((_, i) => {
                    const result = results[i]
                    const isCurrent = i === currentIndex
                    const isAnswered = result !== undefined

                    let dotClass = ''

                    if (isAnswered) {
                        dotClass = result
                            ? 'bg-drill-accent border-drill-accent'   // correct
                            : 'bg-wrong-border border-wrong-border'   // wrong
                    } else if (isCurrent) {
                        dotClass = 'bg-transparent border-drill-accent'  // current — hollow ring
                    } else {
                        dotClass = 'bg-transparent border-paper-3'       // upcoming
                    }

                    return (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full border ${dotClass} transition-colors duration-200`}
                        />
                    )
                })}
            </div>

        </div>
    )
}