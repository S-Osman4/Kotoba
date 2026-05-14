// components/chat/AskBar.tsx
//
// The AI tutor ask input bar.
//
// Behaviour varies by mode (design doc §1.11):
//
//   mode          label    placeholder                          state
//   study         先生:    ask anything — e.g. what does に mean?  enabled
//   drill/unans   —        answer first, then ask               disabled + dimmed
//   drill/ans     先生:    ask about this question...            enabled
//   test          hidden (replaced by pause button — Step 11)
//   review        先生:    ask about any mistake...              enabled
//   logbook       先生:    ask about a word in your log...       enabled
//
// The bar is always mounted in study mode regardless of answered state.
// In drill mode the parent controls the `disabled` prop based on answered state.
//
// Submission:
//   - Enter key (without Shift) submits
//   - Shift+Enter inserts a newline
//   - Send button submits
//   - Submitting while isStreaming is a no-op (button + enter both blocked)

'use client'

import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import type { AppMode } from '@/types/session'
import { useAIActionGuard } from '@/hooks/useAIActionGuard'

// ─── Mode config ──────────────────────────────────────────────────────────────

interface ModeConfig {
    label: string | null   // null = no label
    placeholder: string
    hidden: boolean         // true = don't render (test mode)
}

function getModeConfig(mode: AppMode, answered: boolean): ModeConfig {
    switch (mode) {
        case 'study':
            return {
                label: '先生:',
                placeholder: 'ask anything — e.g. what does に mean?',
                hidden: false,
            }
        case 'drill':
            return {
                label: answered ? '先生:' : null,
                placeholder: answered ? 'ask about this question...' : 'answer first, then ask',
                hidden: false,
            }
        case 'test':
            return { label: null, placeholder: '', hidden: true }
        case 'review':
            return {
                label: '先生:',
                placeholder: 'ask about any mistake...',
                hidden: false,
            }
        case 'logbook':
            return {
                label: '先生:',
                placeholder: 'ask about a word in your log...',
                hidden: false,
            }
        default:
            return {
                label: '先生:',
                placeholder: 'ask anything...',
                hidden: false,
            }
    }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AskBarProps {
    mode: AppMode
    /** Whether the current question has been answered — affects drill mode state */
    answered: boolean
    /** True while the AI is streaming a response — disables submission */
    isStreaming: boolean
    /** Called with the trimmed message when the user submits */
    onSubmit: (message: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AskBar({
    mode,
    answered,
    isStreaming,
    onSubmit,
}: AskBarProps) {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { guard } = useAIActionGuard(3000)

    const config = getModeConfig(mode, answered)

    // Drill mode with unanswered question — bar exists but is locked
    const isLocked = mode === 'drill' && !answered

    // Fully disabled = locked OR currently streaming
    const isDisabled = isLocked || isStreaming

    // Can submit = has text, not disabled
    const canSubmit = value.trim().length > 0 && !isDisabled

    // ── Submit ──────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(() => {
        if (!canSubmit) return
        guard(() => {
            const message = value.trim()
            setValue('')
            if (textareaRef.current) textareaRef.current.style.height = 'auto'
            onSubmit(message)
        })
    }, [canSubmit, value, guard, onSubmit])

    // ── Keyboard: Enter submits, Shift+Enter newline ────────────────────────────

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }, [handleSubmit])

    // ── Auto-resize textarea as user types ─────────────────────────────────────

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
        // Auto-resize: reset then grow to scrollHeight, capped at ~4 lines
        const el = e.target
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 96)}px`
    }, [])

    // ── Hidden in test mode ─────────────────────────────────────────────────────

    if (config.hidden) return null

    return (
        <div
            className={`
        mt-4 flex items-end gap-2 p-3 rounded
        border border-paper-3 bg-paper-2
        transition-opacity duration-150
        ${isLocked ? 'opacity-50' : 'opacity-100'}
      `}
        >
            {/* Label — 先生: */}
            {config.label && (
                <span
                    className="
            flex-none font-serif text-md text-sakura-deep
            pb-1 select-none
          "
                    aria-hidden="true"
                >
                    {config.label}
                </span>
            )}

            {/* Input */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={config.placeholder}
                disabled={isDisabled}
                rows={1}
                aria-label="Ask 先生"
                className="
          flex-1 resize-none bg-transparent
          font-sans text-md text-anko
          placeholder:text-anko-light
          focus:outline-none
          disabled:cursor-not-allowed
          leading-relaxed
          min-h-[1.5rem] max-h-24
        "
                style={{ overflow: 'hidden' }}
            />

            {/* Send button */}
            <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                aria-label="Send message"
                className="
          flex-none w-7 h-7 rounded-full
          flex items-center justify-center
          bg-sakura text-white
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:bg-sakura-deep
          transition-colors duration-150
          focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-1
        "
            >
                {/* Up-arrow icon */}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M6 10V2M6 2L2 6M6 2L10 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </div>
    )
}