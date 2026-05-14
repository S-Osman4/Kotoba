// hooks/useNetworkStatus.ts
//
// Detects online/offline status using browser events.
//
// Initialises from navigator.onLine so the first render is accurate —
// without this, SSR renders as online and a client that starts offline
// would not show the banner until the next event fires.
//
// SSR safety: navigator is not available on the server.
// We default to true (online) and correct on mount.

"use client";

import { useState, useEffect } from "react";

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Correct initial value from the actual browser state
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
