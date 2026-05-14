// components/layout/BottomNav.tsx
//
// Fixed bottom navigation bar — four tabs, always visible on mobile
// except when the soft keyboard is open (controlled via --nav-translate
// CSS variable set by useKeyboard in the root layout).
//
// Tabs (design doc §1.9):
//   学 study    → /study
//   練 drill    → /drill
//   帳 logbook  → /logbook
//   試 test     → /test
//
// Active state — Option B from the design doc:
//   A sakura 2px rule sits at the very top of the nav bar spanning the
//   full width. Above the active tab, a shorter section of this rule is
//   coloured sakura — like a physical page tab marker on a notebook.
//   Active character and label shift to sakura-deep.
//   A 4px sakura dot sits below the label.
//
// Test tab exception (design doc §1.9):
//   The 試 tab uses anko-mid as its inactive colour AND a muted active
//   colour (anko) regardless of active mode — it signals a different
//   register. The sakura indicator still appears when /test is active
//   but the text does not go sakura-deep.
//
// Safe area:
//   padding-bottom: env(safe-area-inset-bottom) prevents the nav from
//   being obscured by the iPhone home indicator gesture bar.
//
// Keyboard hide:
//   The nav reads --nav-translate (set by useKeyboard) and applies it
//   as a CSS transform. This is intentionally CSS-only so the nav
//   responds without a React re-render on every viewport resize event.

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Tab definitions ──────────────────────────────────────────────────────────

interface Tab {
    href: string
    character: string
    label: string
    isTest: boolean
}

const TABS: Tab[] = [
    { href: '/study', character: '学', label: 'study', isTest: false },
    { href: '/drill', character: '練', label: 'drill', isTest: false },
    { href: '/logbook', character: '帳', label: 'logbook', isTest: false },
    { href: '/test', character: '試', label: 'test', isTest: true },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function BottomNav() {
    const pathname = usePathname()

    if (pathname === '/') return null

    return (
        <nav
            aria-label="Main navigation"
            className="
        fixed bottom-0 left-0 right-0 z-40
        bg-paper border-t border-paper-3 sm:hidden
      "
            style={{
                // Keyboard hide — useKeyboard sets this on document.documentElement
                transform: 'translateY(var(--nav-translate, 0))',
                transition: 'transform 200ms ease-out',
                // Safe area for iPhone home indicator
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            {/* Full-width top rule — 2px sakura line spanning the whole bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-paper-3" aria-hidden="true" />

            <div className="flex items-stretch h-14">
                {TABS.map((tab) => {
                    const isActive = pathname === tab.href ||
                        (tab.href !== '/study' && pathname.startsWith(tab.href))

                    // Study is exact-match only to avoid /study matching /study/...
                    // All other tabs use startsWith for sub-routes

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            aria-current={isActive ? 'page' : undefined}
                            className="
                relative flex-1 flex flex-col items-center justify-center gap-0.5
                focus-visible:outline-none focus-visible:bg-paper-2
              "
                        >
                            {/* Active sakura segment above this tab */}
                            {isActive && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-0 left-2 right-2 h-0.5 bg-sakura rounded-b"
                                />
                            )}

                            {/* Japanese character */}
                            <span
                                className={`
                  font-serif text-xl leading-none transition-colors duration-150
                  ${isActive
                                        ? tab.isTest ? 'text-anko' : 'text-sakura-deep'
                                        : tab.isTest ? 'text-anko-mid' : 'text-anko-mid'
                                    }
                `}
                            >
                                {tab.character}
                            </span>

                            {/* Label */}
                            <span
                                className={`
                  font-sans text-xs leading-none transition-colors duration-150
                  ${isActive
                                        ? tab.isTest ? 'text-anko' : 'text-sakura-deep'
                                        : 'text-anko-light'
                                    }
                `}
                            >
                                {tab.label}
                            </span>

                            {/* Active dot below label */}
                            {isActive && (
                                <span
                                    aria-hidden="true"
                                    className="absolute bottom-1 w-1 h-1 rounded-full bg-sakura"
                                />
                            )}

                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}