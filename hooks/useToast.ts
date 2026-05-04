// hooks/useToast.ts
//
// Manages toast notification state.
//
// The toast has three variants:
//   error   — persists until dismissed or retried (failed save)
//   success — auto-dismisses after 2000ms (successful retry)
//   idle    — not visible
//
// Usage:
//   const { toast, showError, showSuccess, dismiss } = useToast()
//
//   // Show a persistent error with a retry callback
//   showError('couldn\'t save 電車 to your logbook', handleRetry)
//
//   // Show a brief success then auto-dismiss
//   showSuccess('saved 電車')
//
//   // Dismiss manually
//   dismiss()

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type ToastVariant = 'error' | 'success'

export interface ToastState {
  visible:  boolean
  variant:  ToastVariant
  message:  string
  onRetry?: () => void
}

interface UseToastReturn {
  toast:       ToastState
  showError:   (message: string, onRetry?: () => void) => void
  showSuccess: (message: string) => void
  dismiss:     () => void
}

const INITIAL_STATE: ToastState = {
  visible:  false,
  variant:  'error',
  message:  '',
  onRetry:  undefined,
}

const SUCCESS_DISMISS_MS = 2000

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastState>(INITIAL_STATE)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending auto-dismiss timer
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  const dismiss = useCallback(() => {
    clearTimer()
    setToast(INITIAL_STATE)
  }, [clearTimer])

  const showError = useCallback((message: string, onRetry?: () => void) => {
    clearTimer()
    setToast({ visible: true, variant: 'error', message, onRetry })
  }, [clearTimer])

  const showSuccess = useCallback((message: string) => {
    clearTimer()
    setToast({ visible: true, variant: 'success', message, onRetry: undefined })

    // Auto-dismiss after SUCCESS_DISMISS_MS
    timerRef.current = setTimeout(() => {
      setToast(INITIAL_STATE)
    }, SUCCESS_DISMISS_MS)
  }, [clearTimer])

  return { toast, showError, showSuccess, dismiss }
}