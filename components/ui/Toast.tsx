// components/ui/Toast.tsx
//
// Bottom toast notification.
//
// Variants:
//   error   — persists until the user dismisses or retries.
//             Shows the word name and a "tap to retry" button.
//             Used when POST /api/progress fails.
//
//   success — auto-dismisses after 2 seconds.
//             Shows "saved [word]" in sage colour.
//             Used when a retry succeeds.
//
// Positioning:
//   Fixed to the bottom of the viewport, centred horizontally.
//   Sits above the bottom nav bar (which will be added in Step 9).
//   Uses mb-20 to clear the future bottom nav height.
//   Safe area inset is handled via pb-safe on the nav — the toast
//   sits above that, so no additional safe area padding is needed here.
//
// Animation:
//   Slides up from below on mount, slides back down on dismiss.
//   Implemented with a CSS translate transition on the `visible` prop.

'use client'

import type { ToastState } from '@/hooks/useToast'

interface ToastProps {
  toast: ToastState
  onRetry?: () => void
  onDismiss: () => void
  isRetrying?: boolean
}

export default function Toast({ toast, onRetry, onDismiss, isRetrying }: ToastProps) {
  const { visible, variant, message } = toast

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`
        fixed bottom-20 left-1/2 z-50
        -translate-x-1/2
        transition-transform duration-200 ease-out
        ${visible ? 'translate-y-0' : 'translate-y-24'}
      `}
    >
      {visible && (
        <div
          className={`
            flex items-center gap-3
            px-4 py-3 rounded-lg shadow-lg
            font-sans text-sm
            max-w-xs w-max
            ${variant === 'success'
              ? 'bg-sage-pale text-sage-deep border border-sage-mid'
              : 'bg-paper text-anko border border-paper-3'
            }
          `}
        >
          {/* Message */}
          <span className="flex-1">{message}</span>

          {/* Retry button — error variant only */}
          {variant === 'error' && onRetry && (
            <button
              onClick={() => {
                onRetry()
              }}
              disabled={isRetrying}
              className="
                flex-none font-sans text-sm font-medium
                text-sakura hover:text-sakura-deep
                transition-colors duration-150
                focus-visible:outline-none focus-visible:underline
              "
            >
              retry
            </button>
          )}

          {/* Dismiss button — error variant only */}
          {variant === 'error' && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="
                flex-none text-anko-light hover:text-anko-mid
                transition-colors duration-150
                focus-visible:outline-none
              "
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}