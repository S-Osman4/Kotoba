// components/layout/TopBar.tsx
//
// Shared top bar used across all screens.
//
// Desktop (≥640px):
//   [語 kotoba]  [study · drill · logbook · test]  [right slot]
//   Mode tabs sit between the wordmark and right slot.
//   Active tab highlighted in sakura. Test tab uses anko (different register).
//
// Mobile (<640px):
//   [語 kotoba]  [right slot]
//   Mode tabs are hidden — the bottom nav handles mode switching.
//
// The wordmark always reads "kotoba" and always links to /study.
// Each screen passes its own right slot content (pips, learned count, etc.)

'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// ─── Nav tab definitions ──────────────────────────────────────────────────────

const NAV_TABS = [
  { href: '/study',   label: 'study',   jp: '学', isTest: false },
  { href: '/drill',   label: 'drill',   jp: '練', isTest: false },
  { href: '/logbook', label: 'logbook', jp: '帳', isTest: false },
  { href: '/test',    label: 'test',    jp: '試', isTest: true  },
] as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  /** Content rendered on the right side of the bar */
  right?: ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopBar({ right }: TopBarProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 bg-paper border-b border-paper-3">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">

        {/* ── Wordmark — always visible on all breakpoints ── */}
        <Link
          href="/study"
          className="flex items-center gap-2 flex-none focus-visible:outline-none focus-visible:underline"
        >
          <span className="font-serif text-xl text-sakura-deep font-semibold">語</span>
          <span className="font-serif text-md text-anko-mid">kotoba</span>
        </Link>

        {/* ── Desktop mode tabs — hidden on mobile, visible sm: and up ── */}
        <nav
          aria-label="Mode navigation"
          className="hidden sm:flex items-center gap-1 flex-1"
        >
          {NAV_TABS.map((tab) => {
            // Study is exact-match to avoid /study matching /study/...
            const isActive = tab.href === '/study'
              ? pathname === '/study'
              : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  font-sans text-xs transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
                  ${isActive
                    ? tab.isTest
                      ? 'bg-paper-2 text-anko border border-paper-3'
                      : 'bg-sakura-pale text-sakura-deep border border-sakura-mid'
                    : 'text-anko-mid hover:bg-paper-2 border border-transparent'
                  }
                `}
              >
                <span className="font-serif text-sm">{tab.jp}</span>
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ── Right slot — pips, learned count, etc. ── */}
        {right && (
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {right}
          </div>
        )}

      </div>
    </header>
  )
}