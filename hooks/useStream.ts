// hooks/useStream.ts
//
// Consumes a plain text ReadableStream from /api/chat and feeds
// the arriving tokens into React state.
//
// Usage:
//   const { streamText, isStreaming, error, startStream, reset } = useStream()
//
//   // To start a stream:
//   await startStream('/api/chat', {
//     method: 'POST',
//     body: JSON.stringify({ message, context }),
//   })
//
// State:
//   streamText  — the text accumulated so far (grows as tokens arrive)
//   isStreaming — true while the stream is open and reading
//   error       — set if the request fails or the stream errors mid-response
//
// The hook handles:
//   - Aborting an in-flight stream when a new one starts (via AbortController)
//   - Decoding Uint8Array chunks into UTF-8 text
//   - Cleaning up on unmount

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseStreamReturn {
  /** Text accumulated from the stream so far */
  streamText: string;
  /** True while actively reading from the stream */
  isStreaming: boolean;
  /** Set if the stream request fails or errors mid-response */
  error: string | null;
  /** Start a new stream. Aborts any in-flight stream first. */
  startStream: (path: string, init: RequestInit) => Promise<void>;
  /** Reset all state back to initial values */
  reset: () => void;
}

export function useStream(): UseStreamReturn {
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController ref — lets us cancel the previous stream
  // when startStream is called again before the first one finishes.
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight stream on unmount to prevent state updates
  // on an unmounted component.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamText("");
    setIsStreaming(false);
    setError(null);
  }, []);

  const startStream = useCallback(async (path: string, init: RequestInit) => {
    // Abort any previous in-flight stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset state for the new stream
    setStreamText("");
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch(path, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        // Try to extract an error message from the response body
        let detail = `Request failed with status ${response.status}`;
        try {
          const body = (await response.json()) as {
            detail?: string;
            error?: string;
          };
          detail = body.detail ?? body.error ?? detail;
        } catch {
          // Body wasn't JSON — use the status message
        }
        throw new Error(detail);
      }

      const body = response.body;
      if (!body) {
        throw new Error("Response body is empty");
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Accumulate text — use functional update to avoid stale closure
          setStreamText((prev) => prev + chunk);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      // Ignore abort errors — they happen when we cancel intentionally
      if (err instanceof DOMException && err.name === "AbortError") return;

      const message = err instanceof Error ? err.message : String(err);
      console.error("[useStream] Stream error:", message);
      setError(message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { streamText, isStreaming, error, startStream, reset };
}
