// middleware.ts
//
// Protects all /api/* routes with a simple owner token.
//
// How it works:
//   Every request to /api/* must include the header:
//     x-owner-token: <value of OWNER_TOKEN env var>
//   Requests without it or with the wrong value get a 401.
//
// Why this approach:
//   kotoba is a single-user app with no auth system. This is not
//   authentication — it is a thin deterrent that prevents strangers
//   from burning through your Cerebras free-tier quota or writing
//   garbage to your logbook.
//
// Dev behaviour:
//   If OWNER_TOKEN is not set in .env.local, the middleware warns
//   and passes all requests through. This means the app works in dev
//   without any setup, but you should always set the token before deploying.
//
// The token value must match NEXT_PUBLIC_OWNER_TOKEN (client-side).
// Both are set to the same string — one is read server-side here,
// the other is sent as a header by lib/api.ts on every frontend request.

import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const expected = process.env.OWNER_TOKEN

  // No token configured — warn and allow through (dev convenience)
  if (!expected) {
    // Only warn once per cold start, not on every request
    if (req.nextUrl.pathname === '/api/questions') {
      console.warn(
        '[middleware] ⚠️  OWNER_TOKEN is not set. ' +
        'API routes are unprotected. ' +
        'Set OWNER_TOKEN and NEXT_PUBLIC_OWNER_TOKEN in .env.local.'
      )
    }
    return NextResponse.next()
  }

  const token = req.headers.get('x-owner-token')

  if (token !== expected) {
    return new NextResponse(
      JSON.stringify({ error: 'unauthorized' }),
      {
        status:  401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  // Run only on API routes.
  // Pages, static files, and Next.js internals are unaffected.
  matcher: '/api/:path*',
}