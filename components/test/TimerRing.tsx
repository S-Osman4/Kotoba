// components/test/TimerRing.tsx
//
// Circular SVG countdown timer for test mode.
//
// The ring is drawn with two overlapping circles:
//   - Background track (slate-3)
//   - Progress arc (sakura → red under 5 minutes)
//
// The arc is animated via stroke-dashoffset, which represents how much
// of the circumference is "filled". As elapsed time increases, the
// dashoffset increases, draining the arc clockwise.
//
// Props:
//   totalSeconds   — total test duration (e.g. 2400 for 40 minutes)
//   elapsedSeconds — how many seconds have elapsed so far
//   isPaused       — if true, the display shows a pause indicator
//
// The component is display-only — timing logic lives in the page.

interface TimerRingProps {
    totalSeconds: number
    elapsedSeconds: number
    isPaused: boolean
}

const RADIUS = 20    // SVG units
const STROKE = 3     // SVG units
const SIZE = (RADIUS + STROKE) * 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const RED_THRESHOLD_SECONDS = 5 * 60   // 5 minutes

function formatTime(seconds: number): string {
    const remaining = Math.max(0, seconds)
    const m = Math.floor(remaining / 60)
    const s = remaining % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TimerRing({
    totalSeconds,
    elapsedSeconds,
    isPaused,
}: TimerRingProps) {
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
    const progress = Math.min(1, elapsedSeconds / totalSeconds)
    const dashOffset = CIRCUMFERENCE * progress

    const isRed = remainingSeconds <= RED_THRESHOLD_SECONDS
    const ringColour = isRed ? '#E24B4A' : '#C4728A'  // red or sakura
    const textColour = isRed ? '#E24B4A' : '#D8D4CE'  // test body text

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: SIZE, height: SIZE }}
            role="timer"
            aria-label={`${formatTime(remainingSeconds)} remaining`}
            aria-live="off"
        >
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                style={{ transform: 'rotate(-90deg)' }}
                aria-hidden="true"
            >
                {/* Background track */}
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke="#3A3F50"
                    strokeWidth={STROKE}
                />

                {/* Progress arc */}
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={ringColour}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
            </svg>

            {/* Time label in centre */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
            >
                {isPaused ? (
                    <span style={{ color: textColour, fontSize: 7, fontFamily: 'monospace' }}>
                        ❚❚
                    </span>
                ) : (
                    <span
                        style={{
                            color: textColour,
                            fontSize: 7,
                            fontFamily: 'monospace',
                            fontWeight: 500,
                            lineHeight: 1,
                        }}
                    >
                        {formatTime(remainingSeconds)}
                    </span>
                )}
            </div>
        </div>
    )
}