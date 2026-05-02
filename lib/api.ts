// lib/api.ts
//
// Client-side fetch wrapper for internal kotoba API routes.
//
// Automatically attaches x-owner-token to every request so individual
// components never have to manage the header manually.
//
// Usage:
//   import { apiFetch } from '@/lib/api'
//
//   // POST with JSON body
//   const question = await apiFetch<Question>('/api/questions', {
//     method: 'POST',
//     body: JSON.stringify({ type: 'vocabulary', subMode: 'vocabulary' }),
//   })
//
//   // GET
//   const logbook = await apiFetch<LearnedWord[]>('/api/logbook')
//
// Error handling:
//   apiFetch throws ApiError on non-2xx responses.
//   Catch it in the calling component to show the appropriate error state.
//
//   try {
//     const question = await apiFetch<Question>(...)
//   } catch (err) {
//     if (err instanceof ApiError && err.status === 429) {
//       // rate limited — show specific message
//     }
//   }

export class ApiError extends Error {
  constructor(
    /** HTTP status code */
    public readonly status: number,
    /** Error identifier from the response body, or a generic message */
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  // NEXT_PUBLIC_OWNER_TOKEN is set in .env.local and injected into the
  // browser bundle by Next.js. It must match the server-side OWNER_TOKEN.
  const token = process.env.NEXT_PUBLIC_OWNER_TOKEN

  const headers = new Headers(init.headers)

  // Always send JSON content type for API calls
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach owner token if available
  if (token) {
    headers.set('x-owner-token', token)
  } else if (process.env.NODE_ENV === 'development') {
    // Remind the developer in the browser console, not just the terminal
    console.warn(
      '[api] NEXT_PUBLIC_OWNER_TOKEN is not set. ' +
      'Requests will fail in production unless the token is configured.'
    )
  }

  const response = await fetch(path, { ...init, headers })

  if (!response.ok) {
    let errorMessage: string

    try {
      const body = await response.json() as { error?: string; detail?: string }
      errorMessage = body.detail ?? body.error ?? `HTTP ${response.status}`
    } catch {
      errorMessage = `HTTP ${response.status}`
    }

    throw new ApiError(response.status, errorMessage)
  }

  return response.json() as Promise<T>
}