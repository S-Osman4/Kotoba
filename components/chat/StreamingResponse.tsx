// components/chat/StreamingResponse.tsx
//
// Displays the AI tutor's response as it streams in.
//
// States:
//   Idle (no text, not streaming) — renders nothing
//   Streaming, no text yet       — three-dot typing indicator
//   Streaming, text arriving     — streamed text (dots replaced)
//   Done, text present           — final text, no indicator
//   Error                        — error message with retry button
//
// The typing indicator uses three dots that pulse via CSS animation.
// Once the first token arrives the dots are replaced by the text.
// This matches the design doc §3.1 AI ask bar streaming behaviour.

'use client'

interface StreamingResponseProps {
    text: string
    isStreaming: boolean
    error: string | null
    onRetry?: () => void
}

// Strip <think>...</think> blocks (including content and line breaks)
function stripThinkTags(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/g, '')
}

export default function StreamingResponse({
    text,
    isStreaming,
    error,
    onRetry,
}: StreamingResponseProps) {
    const cleanText = stripThinkTags(text)

    if (!isStreaming && !cleanText && !error) return null

    return (
        <div className="mt-4 px-1">
            {isStreaming && !cleanText && (
                <div className="flex items-center gap-1 py-2" aria-label="先生 is typing">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="inline-block w-1.5 h-1.5 rounded-full bg-anko-light animate-shimmer"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            )}

            {cleanText && (
                <div className="font-sans text-md text-anko leading-relaxed whitespace-pre-wrap">
                    {cleanText}
                    {isStreaming && (
                        <span className="inline-block w-0.5 h-4 bg-anko-light ml-0.5 align-middle animate-shimmer" aria-hidden="true" />
                    )}
                </div>
            )}

            {error && !isStreaming && (
                <div className="flex items-center gap-3 py-2">
                    <p className="font-sans text-md text-anko-mid flex-1">
                        {cleanText ? '— response cut short, tap to retry' : 'couldn\'t reach 先生 — tap to try again'}
                    </p>
                    {onRetry && (
                        <button onClick={onRetry} className="font-sans text-sm text-sakura hover:text-sakura-deep transition-colors duration-150 focus-visible:outline-none focus-visible:underline">
                            retry
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}