// hooks/useKeyboard.ts
//
// Detects when the soft keyboard is open by watching visualViewport height.
// When the keyboard opens, the viewport shrinks — we use that shrinkage
// to set a CSS variable that the bottom nav reads to hide itself.
//
// Why visualViewport instead of window.resize:
//   On iOS and Android, window.innerHeight does not reliably change when
//   the soft keyboard opens. visualViewport.height does.
//
// How the hide works:
//   We set --nav-translate on <html> to '100%' (slides nav off-screen)
//   or '0' (visible). The BottomNav reads this via a CSS transition.
//   Using a CSS variable instead of React state means the nav responds
//   instantly without a React re-render on every viewport resize event.
//
// SSR safety:
//   visualViewport does not exist on the server. All access is inside
//   useEffect with an explicit availability check.

"use client";

import { useEffect } from "react";

const KEYBOARD_THRESHOLD = 0.25;

export function useKeyboard(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.visualViewport) return;

    const viewport = window.visualViewport;
    const initialHeight = viewport.height;

    function handleResize() {
      if (!viewport) return;
      const currentHeight = viewport.height;
      const shrinkRatio = 1 - currentHeight / initialHeight;
      const keyboardOpen = shrinkRatio > KEYBOARD_THRESHOLD;
      document.documentElement.style.setProperty(
        "--nav-translate",
        keyboardOpen ? "100%" : "0",
      );
    }

    viewport.addEventListener("resize", handleResize);
    document.documentElement.style.setProperty("--nav-translate", "0");

    return () => {
      viewport.removeEventListener("resize", handleResize);
      document.documentElement.style.setProperty("--nav-translate", "0");
    };
  }, []);
}
