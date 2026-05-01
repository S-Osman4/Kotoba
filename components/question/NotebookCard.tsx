// components/question/NotebookCard.tsx
//
// The notebook page card — the single most important UI component.
// Every question in every mode lives inside this wrapper.
//
// Anatomy (left to right):
//   [spine strip] [margin rule] [content area with ruled lines]
//
// Behind the card:
//   [shadow layer 2] [shadow layer 1] [card itself]
//
// Props:
//   variant      — controls colours (study | drill | test | skeleton | error)
//   shadowLayers — how many stacked page shadows to show (0, 1, or 2)
//                  pass 0 on the last question of a set
//   children     — the question content rendered inside the content area
//   className    — additional classes on the outermost wrapper

export type NotebookVariant = 'study' | 'drill' | 'test' | 'skeleton' | 'error'

interface NotebookCardProps {
    variant?: NotebookVariant
    /** Number of stacked shadow layers behind the card. 0 = last question. */
    shadowLayers?: 0 | 1 | 2
    children?: React.ReactNode
    className?: string
}

// ─── Per-variant design tokens ────────────────────────────────────────────────
//
// Each variant has a set of colours that match the design doc tables.
// We define them as plain objects so the component stays readable and
// each value is traceable back to the design doc.

interface VariantTokens {
    /** Card background colour */
    cardBg: string
    /** Spine strip background */
    spineBg: string
    /** Ring indicator border colour */
    ringBorder: string
    /** Ring indicator fill — usually matches card background */
    ringFill: string
    /** Ruled line colour — used as CSS custom property --ruled-line-color */
    ruledLine: string
    /** Shadow layer 1 (closest to card) */
    shadow1: string
    /** Shadow layer 2 (furthest from card) */
    shadow2: string
    /** Whether to show ruled lines */
    showLines: boolean
}

const VARIANT_TOKENS: Record<NotebookVariant, VariantTokens> = {
    study: {
        cardBg: '#FDFAF8', // paper
        spineBg: '#F7ECF0', // sakura-pale
        ringBorder: '#D4899A', // sakura-mid
        ringFill: '#FDFAF8', // paper (matches card)
        ruledLine: '#EDE3E7', // paper-3
        shadow1: '#F7F1F3', // paper-2
        shadow2: '#EDE3E7', // paper-3
        showLines: true,
    },
    drill: {
        cardBg: '#FBF5EF', // drill
        spineBg: '#F5E8D8', // drill-spine
        ringBorder: '#D4B070', // drill-ring
        ringFill: '#FBF5EF', // drill (matches card)
        ruledLine: '#E8D8C4', // drill-border
        shadow1: '#F5E8D8', // drill-spine (slightly darker than card)
        shadow2: '#E8D8C4', // drill-border
        showLines: true,
    },
    test: {
        cardBg: '#2E3240', // slate-2
        spineBg: 'rgba(196, 114, 138, 0.08)', // sakura at 8% opacity
        ringBorder: 'rgba(196, 114, 138, 0.40)', // sakura at 40% opacity
        ringFill: '#2E3240', // slate-2 (matches card)
        ruledLine: '#3A3F50', // slate-3
        shadow1: '#23262E', // slate (darker than card)
        shadow2: '#1C1F26', // deeper than slate
        showLines: true,
    },
    skeleton: {
        cardBg: '#F7F1F3', // paper-2
        spineBg: '#EDE3E7', // paper-3
        ringBorder: '#E0D4D8', // paper-4
        ringFill: '#F7F1F3', // paper-2 (matches card)
        ruledLine: '#EDE3E7', // paper-3
        shadow1: '#EDE3E7', // paper-3
        shadow2: '#E0D4D8', // paper-4
        showLines: false,     // no lines on skeleton — shimmer fills the space
    },
    error: {
        cardBg: '#FDFAF8', // paper
        spineBg: '#EDE3E7', // paper-3
        ringBorder: '#E0D4D8', // paper-4
        ringFill: '#FDFAF8', // paper (matches card)
        ruledLine: '#EDE3E7', // paper-3
        shadow1: '#F7F1F3', // paper-2
        shadow2: '#EDE3E7', // paper-3
        showLines: false,     // no lines on error state
    },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotebookCard({
    variant = 'study',
    shadowLayers = 2,
    children,
    className = '',
}: NotebookCardProps) {
    const tokens = VARIANT_TOKENS[variant]

    // Number of ring indicators in the spine.
    // 4 on desktop, 3 on mobile — we render 4 and hide the last one on mobile.
    const rings = [0, 1, 2, 3]

    return (
        // ── Outermost wrapper — positions shadow layers behind the card ──
        <div className={`relative ${className}`}>

            {/* ── Shadow layer 2 — furthest back ── */}
            {shadowLayers >= 2 && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-sm"
                    style={{
                        backgroundColor: tokens.shadow2,
                        transform: 'translate(6px, 6px)',
                        zIndex: 0,
                    }}
                />
            )}

            {/* ── Shadow layer 1 ── */}
            {shadowLayers >= 1 && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-sm"
                    style={{
                        backgroundColor: tokens.shadow1,
                        transform: 'translate(3px, 3px)',
                        zIndex: 1,
                    }}
                />
            )}

            {/* ── The card itself ── */}
            <div
                className="relative flex rounded-sm overflow-hidden"
                style={{
                    backgroundColor: tokens.cardBg,
                    // Border — use a box shadow so it doesn't add to layout dimensions.
                    // For test mode we use a slightly lighter border than the card bg.
                    boxShadow: variant === 'test'
                        ? '0 0 0 1px #3A3F50'  // slate-3
                        : '0 0 0 1px #EDE3E7', // paper-3
                    zIndex: 2,
                }}
            >
                {/* ── Spine strip ── */}
                <div
                    aria-hidden="true"
                    className="
            relative flex-none flex flex-col items-center justify-around py-4
            w-[24px] sm:w-spine
          "
                    style={{ backgroundColor: tokens.spineBg }}
                >
                    {/* Margin rule — 0.5px vertical line at the spine's right edge */}
                    <div
                        className="absolute right-0 top-0 bottom-0 w-px"
                        style={{
                            backgroundColor: '#EAB8C4', // sakura-soft
                            opacity: 0.4,
                        }}
                    />

                    {/* Ring indicators */}
                    {rings.map((i) => (
                        <div
                            key={i}
                            // Hide the 4th ring on mobile (index 3)
                            className={i === 3 ? 'hidden sm:block' : 'block'}
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                border: `1.5px solid ${tokens.ringBorder}`,
                                backgroundColor: tokens.ringFill,
                                flexShrink: 0,
                            }}
                        />
                    ))}
                </div>

                {/* ── Content area ── */}
                <div
                    className={`
            relative flex-1 min-w-0 p-4 sm:p-6
            ${tokens.showLines ? 'notebook-lines' : ''}
          `}
                    style={
                        tokens.showLines
                            ? { '--ruled-line-color': tokens.ruledLine } as React.CSSProperties
                            : undefined
                    }
                >
                    {children}
                </div>
            </div>
        </div>
    )
}