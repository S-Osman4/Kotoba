// hooks/useSwipe.ts
//
// Detects horizontal swipe gestures on a target element.
//
// Rules (per design doc §1.10):
//   - Minimum horizontal delta: 50px to prevent accidental triggers
//   - Vertical-dominant swipes are ignored (user is scrolling, not swiping)
//   - Swipe is fully disabled when enabled=false (unanswered question)
//
// How it works:
//   We record touchstart position, then on touchend compute the delta.
//   If the horizontal delta exceeds the threshold AND is larger than the
//   vertical delta, we fire onSwipeLeft or onSwipeRight.
//
// Why we ignore vertical-dominant swipes:
//   On mobile, scrolling the page involves a downward touch movement.
//   Without this check, a scroll that starts with a slight horizontal
//   component would incorrectly trigger a card advance.
//
// Returns a ref to attach to the swipeable element and a stable
// handler object — the component spreads the handlers onto the element.

// hooks/useSwipe.ts
"use client";

import { useRef, useCallback } from "react";

const MIN_HORIZONTAL_DELTA = 50;
const MAX_VERTICAL_RATIO = 0.6;

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  enabled,
}: UseSwipeOptions): SwipeHandlers {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      if (startX.current === null || startY.current === null) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      startX.current = null;
      startY.current = null;

      if (absX < MIN_HORIZONTAL_DELTA) return;
      if (absY > 0 && absY / absX > MAX_VERTICAL_RATIO) return;

      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [enabled, onSwipeLeft, onSwipeRight],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
