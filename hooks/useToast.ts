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

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type ToastVariant = "error" | "success" | "rateLimit";

export interface ToastState {
  visible: boolean;
  variant: ToastVariant;
  message: string;
  secondsRemaining?: number;
  onRetry?: () => void;
}

interface UseToastReturn {
  toast: ToastState;
  showError: (message: string, onRetry?: () => void) => void;
  showSuccess: (message: string) => void;
  showRateLimit: (seconds: number) => void;
  dismiss: () => void;
}

const INITIAL_STATE: ToastState = {
  visible: false,
  variant: "error",
  message: "",
  onRetry: undefined,
};

const SUCCESS_DISMISS_MS = 2000;

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any pending auto-dismiss timer
  const clearAll = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAll();
  }, [clearAll]);

  const dismiss = useCallback(() => {
    clearAll();
    setToast(INITIAL_STATE);
  }, [clearAll]);

  const showError = useCallback(
    (message: string, onRetry?: () => void) => {
      clearAll();
      setToast({ visible: true, variant: "error", message, onRetry });
    },
    [clearAll],
  );

  const showSuccess = useCallback(
    (message: string) => {
      clearAll();
      setToast({
        visible: true,
        variant: "success",
        message,
        onRetry: undefined,
      });

      // Auto-dismiss after SUCCESS_DISMISS_MS
      timerRef.current = setTimeout(() => {
        setToast(INITIAL_STATE);
      }, SUCCESS_DISMISS_MS);
    },
    [clearAll],
  );

  const showRateLimit = useCallback(
    (seconds: number) => {
      clearAll();
      const initialMessage = `Too fast! Wait ${seconds} second${seconds !== 1 ? "s" : ""}…`;
      setToast({
        visible: true,
        variant: "rateLimit",
        message: initialMessage,
        secondsRemaining: seconds,
      });

      countdownRef.current = setInterval(() => {
        setToast((prev) => {
          if (!prev.visible) return prev;
          const next = (prev.secondsRemaining ?? 0) - 1;
          if (next <= 0) {
            clearInterval(countdownRef.current!);
            return INITIAL_STATE;
          }
          return {
            ...prev,
            secondsRemaining: next,
            message: `Too fast! Wait ${next} second${next !== 1 ? "s" : ""}…`,
          };
        });
      }, 1000);
    },
    [clearAll],
  );

  return { toast, showError, showSuccess, dismiss, showRateLimit };
}
