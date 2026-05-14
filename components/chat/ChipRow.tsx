// components/chat/ChipRow.tsx
//
// Quick-action chips that send preset messages to the ask bar.
//
// Desktop: full list of chips
// Mobile:  collapses to 3 chips — "new question", "explain this", "more ···"
//          "more ···" chip expands to show the rest inline
//
// Chips are only shown when the bar is not locked (i.e. not drill-unanswered).
// Tapping a chip calls onChipSelect with the chip's message string.
// The parent feeds that into the same onSubmit handler as the AskBar.

'use client'

import { useAIActionGuard } from '@/hooks/useAIActionGuard'
import { useState } from 'react'

// ─── Chip definitions ─────────────────────────────────────────────────────────

interface Chip {
    label: string
    message: string
}

// These are the chips shown in study mode.
// Other modes will pass their own chip sets via props.
export const STUDY_CHIPS: Chip[] = [
    { label: 'new question', message: 'Give me a new question on this topic.' },
    { label: 'explain this', message: 'Can you explain this question in more detail?' },
    { label: 'example', message: 'Give me an example sentence using this word.' },
    { label: 'memory hook', message: 'Give me a mnemonic to remember this.' },
    { label: 'similar words', message: 'What are similar words I should know at N5?' },
    { label: 'culture note', message: 'Is there a cultural note related to this?' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChipRowProps {
    chips: Chip[]
    onChipSelect: (message: string) => void
    onNewQuestion?: () => void
    /** Disable all chips while streaming */
    disabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChipRow({
    chips,
    onChipSelect,
    onNewQuestion,
    disabled = false,
}: ChipRowProps) {
    const [expanded, setExpanded] = useState(false)
    const { guard } = useAIActionGuard(5000) 

    // On mobile we show first 2 chips + a "more" chip
    // On desktop we show all chips
    // We implement this with CSS visibility — the "more" button is only visible on mobile

    const firstTwo = chips.slice(0, 2)
    const restChips = chips.slice(2)
    const hasMore = restChips.length > 0

    const handleChip = (chip: Chip) => {
        if (disabled) return
        if (chip.label === 'new question' && onNewQuestion) {
            guard(onNewQuestion) 
        } else {
            guard(() => onChipSelect(chip.message))
        }
    }

    const chipClass = `
    flex-none px-3 py-1 rounded-full
    font-sans text-xs
    border border-paper-3 bg-paper text-anko-mid
    hover:bg-paper-2 hover:text-anko
    disabled:opacity-40 disabled:cursor-not-allowed
    transition-colors duration-100
    whitespace-nowrap
  `

    return (
        <div className="mt-2 flex flex-wrap gap-1.5">

            {/* First 2 chips — always visible */}
            {firstTwo.map((chip) => (
                <button
                    key={chip.label}
                    onClick={() => handleChip(chip)}
                    disabled={disabled}
                    className={chipClass}
                >
                    {chip.label}
                </button>
            ))}

            {/* Remaining chips — hidden on mobile unless expanded */}
            {restChips.map((chip) => (
                <button
                    key={chip.label}
                    onClick={() => handleChip(chip)}
                    disabled={disabled}
                    className={`
            ${chipClass}
            hidden sm:inline-flex
            ${expanded ? 'inline-flex' : ''}
          `}
                >
                    {chip.label}
                </button>
            ))}

            {/* "more ···" chip — mobile only, hidden once expanded */}
            {hasMore && !expanded && (
                <button
                    onClick={() => setExpanded(true)}
                    disabled={disabled}
                    className={`
            ${chipClass}
            sm:hidden
          `}
                    aria-label="Show more quick actions"
                >
                    more ···
                </button>
            )}

        </div>
    )
}