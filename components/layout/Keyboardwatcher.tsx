// components/layout/KeyboardWatcher.tsx
//
// A renderless client component that runs useKeyboard as a side effect.
//
// Why this exists:
//   app/layout.tsx is a React Server Component — it cannot call hooks.
//   useKeyboard needs to run in a client context so it can access
//   window.visualViewport and add event listeners.
//
//   This thin wrapper lets us mount the hook from the server layout
//   without making the entire layout a client component (which would
//   opt out of server-side rendering for the whole app).
//
// Renders nothing — purely a side-effect component.

// components/layout/KeyboardWatcher.tsx
'use client'

import { useKeyboard } from '@/hooks/useKeyboard'

export default function KeyboardWatcher() {
  useKeyboard()
  return null
}