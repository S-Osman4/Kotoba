// hooks/useLeaveGuard.ts
//
// Prevents accidental navigation away from an active test.
//
// Two interception points:
//
// 1. beforeunload — fires when the user closes the tab, refreshes, or
//    types a new URL in the address bar. We show the browser's native
//    "are you sure?" dialog. This cannot be suppressed or customised
//    in modern browsers — the browser controls the dialog text.
//
// 2. popstate — fires when the user taps the browser Back button.
//    We push a dummy history entry to absorb the back navigation,
//    then set `showModal = true` so the LeaveTestModal appears.
//    If the user confirms, we call the provided onConfirmLeave callback
//    which the parent uses to tear down the guard and navigate away.
//
// Next.js Link and router.push do NOT fire beforeunload or popstate.
// To block those we pass an `isActive` prop — when false the guard
// removes all listeners so the test completion → results navigation
// works without triggering the modal.
//
// Usage:
//   const { showModal, confirmLeave, cancelLeave } = useLeaveGuard(isTestActive)
//
//   // Render LeaveTestModal when showModal is true
//   // Pass confirmLeave to the modal's confirm button
//   // Pass cancelLeave to the modal's cancel button

"use client";

import { useState, useEffect, useCallback } from "react";

interface UseLeaveGuardReturn {
  /** True when the leave confirmation modal should be shown */
  showModal: boolean;
  /** Call when user confirms they want to leave — removes guard and triggers navigation */
  confirmLeave: () => void;
  /** Call when user cancels — hides the modal and resumes the test */
  cancelLeave: () => void;
}

export function useLeaveGuard(isActive: boolean): UseLeaveGuardReturn {
  const [showModal, setShowModal] = useState(false);
  const [pendingNav, setPendingNav] = useState(false);

  // ── beforeunload — browser tab close / refresh ──────────────────────────────

  useEffect(() => {
    if (!isActive) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore the returnValue string but require it to be set
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isActive]);

  // ── popstate — browser back button ─────────────────────────────────────────
  //
  // Strategy:
  //   On mount (when guard becomes active), push a dummy history entry.
  //   When the user taps Back, popstate fires and the dummy entry is consumed.
  //   We immediately push another dummy entry to keep the guard armed,
  //   then show the modal.

  useEffect(() => {
    if (!isActive) return;

    // Push the initial dummy entry that will absorb the first Back tap
    window.history.pushState({ leaveGuard: true }, "");

    function handlePopState() {
      // Re-arm the guard by pushing another dummy entry
      window.history.pushState({ leaveGuard: true }, "");
      // Show the confirmation modal
      setShowModal(true);
      setPendingNav(true);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isActive]);

  // ── Confirm leave ───────────────────────────────────────────────────────────

  const confirmLeave = useCallback(() => {
    setShowModal(false);
    setPendingNav(false);
    // Pop the dummy history entry so the browser Back works normally
    if (pendingNav) {
      window.history.back();
    }
  }, [pendingNav]);

  // ── Cancel leave ────────────────────────────────────────────────────────────

  const cancelLeave = useCallback(() => {
    setShowModal(false);
    setPendingNav(false);
  }, []);

  return { showModal, confirmLeave, cancelLeave };
}
