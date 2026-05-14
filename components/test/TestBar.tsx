// components/test/TestBar.tsx
//
// Top bar for test mode.
//
// Contains (left to right):
//   - "no hints" badge
//   - "jlpt n5 test" title
//   - Pause button (timer pause — no AI, just timer)
//   - TimerRing
//   - Question dots (desktop) or "Q N / 20" fraction (mobile)
//
// Question dot states:
//   done correct  → sakura filled dot
//   done wrong    → dark red filled dot
//   current       → hollow sakura ring
//   upcoming      → hollow slate-3 ring
//
// The dots array accepts undefined (not yet answered), true (correct),
// or false (wrong/skipped). The current index is tracked by the parent.

import TimerRing from './TimerRing'

interface TestBarProps {
    currentIndex: number               // 0-based, 0–19
    answers: (boolean | undefined)[] // per-question result, length 20
    totalSeconds: number
    elapsedSeconds: number
    isPaused: boolean
    onPauseToggle: () => void
}

const TOTAL = 20

export default function TestBar({
    currentIndex,
    answers,
    totalSeconds,
    elapsedSeconds,
    isPaused,
    onPauseToggle,
}: TestBarProps) {
    return (
        <div
            className="sticky top-0 z-10 border-b"
            style={{ backgroundColor: '#2E3240', borderColor: '#3A3F50' }}
        >
            {/* ── Main row ── */}
            <div className="px-4 py-2 flex items-center gap-3">

                {/* No-hints badge */}
                <span
                    className="flex-none font-mono text-xs px-1.5 py-0.5 rounded border"
                    style={{ color: '#6B7285', borderColor: '#3A3F50', fontSize: 10 }}
                >
                    no hints
                </span>

                {/* Title */}
                <span
                    className="flex-1 font-serif text-md"
                    style={{ color: '#D8D4CE' }}
                >
                    jlpt n5
                </span>

                {/* Pause button */}
                <button
                    onClick={onPauseToggle}
                    aria-label={isPaused ? 'Resume test' : 'Pause test'}
                    className="
            flex-none font-mono text-xs px-2 py-1 rounded border
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
          "
                    style={{
                        color: '#6B7285',
                        borderColor: '#3A3F50',
                        backgroundColor: 'transparent',
                    }}
                >
                    {isPaused ? 'resume' : 'pause'}
                </button>

                {/* Timer ring */}
                <TimerRing
                    totalSeconds={totalSeconds}
                    elapsedSeconds={elapsedSeconds}
                    isPaused={isPaused}
                />

                {/* Fraction — mobile only */}
                <span
                    className="flex-none font-mono text-xs sm:hidden"
                    style={{ color: '#6B7285' }}
                >
                    {currentIndex + 1} / {TOTAL}
                </span>
            </div>

            {/* ── Question dots row — desktop only ── */}
            <div
                className="hidden sm:flex flex-wrap gap-1.5 px-4 pb-2"
                aria-hidden="true"
            >
                {Array.from({ length: TOTAL }).map((_, i) => {
                    const result = answers[i]
                    const isCurrent = i === currentIndex

                    let bg = 'transparent'
                    let border = '#3A3F50'

                    if (result === true) {
                        // Correct — sakura filled
                        bg = '#C4728A'
                        border = '#C4728A'
                    } else if (result === false) {
                        // Wrong — dark red filled
                        bg = '#7A1E1E'
                        border = '#7A1E1E'
                    } else if (isCurrent) {
                        // Current — hollow sakura ring
                        border = '#C4728A'
                    }

                    return (
                        <div
                            key={i}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: bg,
                                border: `1.5px solid ${border}`,
                                transition: 'background-color 0.2s, border-color 0.2s',
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}