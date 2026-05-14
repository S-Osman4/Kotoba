// app/page.tsx
//
// Root route — entry point for portfolio visitors and fresh sessions.
//
// This is a Server Component with no data fetching — the session check
// is handled entirely client-side in WelcomeScreen using sessionStorage.
//
// Why no DB check here:
//   The original spec showed the welcome screen only once (first-time user).
//   For a portfolio app the better behaviour is: show the welcome screen
//   to every fresh browser session (new tab, external link) so visitors
//   always get a proper introduction. sessionStorage — which clears when
//   the tab is closed — is exactly the right scope for this.

import WelcomeScreen from './WelcomeScreen'

export default function RootPage() {
  return <WelcomeScreen />
}