"use client";

import { useCallback, useRef } from "react";
import { useToast } from "./useToast";
import { useGroqRate } from "./useGroqRate";

interface UseAIActionGuardReturn {
  guard: (action: () => void) => void;
}

export function useAIActionGuard(
  defaultCooldownMs: number = 3000,
): UseAIActionGuardReturn {
  const { remainingTokensMinute } = useGroqRate();

  // Increase cooldown to 10s if per‑minute tokens are critically low
  const cooldownMs =
    remainingTokensMinute !== null && remainingTokensMinute < 200
      ? 10_000
      : defaultCooldownMs;

  const { showRateLimit } = useToast();
  const lastActionRef = useRef<number>(0);

  const guard = useCallback(
    (action: () => void) => {
      const now = Date.now();
      const elapsed = now - lastActionRef.current;
      if (elapsed < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
        showRateLimit(remainingSeconds);
        return;
      }
      lastActionRef.current = now;
      action();
    },
    [cooldownMs, showRateLimit],
  );

  return { guard };
}
