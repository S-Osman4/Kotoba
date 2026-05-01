// components/question/NotebookError.tsx
//
// Error card shown when question generation fails.
// Same notebook anatomy as NotebookCard, no shadow layers.
//
// After two consecutive failures the retry button is hidden and a
// "check your connection" message replaces it.
"use client";
import NotebookCard from './NotebookCard'

interface NotebookErrorProps {
    /** Called when the user taps the retry button */
    onRetry?: () => void
    /** After 2 consecutive failures, hide the retry button */
    consecutiveFails?: number
    className?: string
}

export default function NotebookError({
    onRetry,
    consecutiveFails = 1,
    className,
}: NotebookErrorProps) {
    const showRetry = consecutiveFails < 2
    const hardFail = consecutiveFails >= 2

    return (
        <NotebookCard variant="error" shadowLayers={0} className={className}>
            <div className="flex flex-col items-start gap-4 py-4">

                {/* Error message */}
                <p className="font-serif text-lg text-anko-mid">
                    {hardFail
                        ? 'having trouble generating questions — check your connection'
                        : 'couldn\'t load this question'}
                </p>

                {/* Retry button — hidden after two consecutive failures */}
                {showRetry && onRetry && (
                    <button
                        onClick={onRetry}
                        className="
              px-4 py-2 rounded
              font-sans text-md font-medium
              text-white bg-sakura
              hover:bg-sakura-deep
              transition
              -colors duration-150
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
                    >
                        try again
                    </button>
                )}
            </div>
        </NotebookCard>
    )
}