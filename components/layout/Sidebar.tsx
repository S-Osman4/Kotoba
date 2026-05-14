// components/layout/Sidebar.tsx
//
// Desktop study sidebar — visible sm: and up, hidden on mobile.
//
// Contains:
//   - Sub-mode navigation links (vocabulary, grammar, kanji, reading)
//   - Learned word count pill at the bottom
//
// The active sub-mode is highlighted with sakura styling.
// Clicking a sub-mode calls onSubModeChange — the parent manages state.
//
// Width: 200px fixed. Sits to the left of the question card on desktop.
// The sidebar is sticky so it stays in view as the user scrolls the card.
//
// On mobile this component renders null — sub-mode pills handle navigation.

import type { SubMode } from '@/types/question'

interface SidebarProps {
  subMode:          SubMode
  onSubModeChange:  (mode: SubMode) => void
  learnedCount:     number
}

const SUB_MODES: { mode: SubMode; label: string; jp: string }[] = [
  { mode: 'vocabulary', label: 'vocabulary', jp: '語彙' },
  { mode: 'grammar',    label: 'grammar',    jp: '文法' },
  { mode: 'kanji',      label: 'kanji',      jp: '漢字' },
  { mode: 'reading',    label: 'reading',    jp: '読解' },
]

export default function Sidebar({
  subMode,
  onSubModeChange,
  learnedCount,
}: SidebarProps) {
  return (
    // Hidden on mobile — shown sm: and up
    <aside className="
      hidden sm:flex
      flex-col gap-1
      w-50 flex-none
      py-6 pr-4
      border-r border-paper-3
      sticky top-14.25   /* clears the TopBar height */
      self-start
      min-h-[calc(100vh-57px)]
    ">

      {/* ── Section label ── */}
      <p className="font-mono text-xs text-anko-light uppercase tracking-widest px-3 mb-2">
        sub-mode
      </p>

      {/* ── Sub-mode links ── */}
      {SUB_MODES.map(({ mode, label, jp }) => {
        const isActive = mode === subMode
        return (
          <button
            key={mode}
            onClick={() => onSubModeChange(mode)}
            aria-current={isActive ? 'true' : undefined}
            className={`
              flex items-center gap-2.5 px-3 py-2 rounded-lg
              font-sans text-sm text-left
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid
              ${isActive
                ? 'bg-sakura-pale text-sakura-deep'
                : 'text-anko-mid hover:bg-paper-2 hover:text-anko'
              }
            `}
          >
            <span className={`
              font-serif text-lg leading-none w-6 flex-none text-center
              ${isActive ? 'text-sakura-deep' : 'text-anko-light'}
            `}>
              {jp}
            </span>
            <span>{label}</span>
            {/* Active indicator dot */}
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sakura flex-none" />
            )}
          </button>
        )
      })}

      {/* ── Learned count pill — bottom of sidebar ── */}
      <div className="mt-auto pt-6 px-3">
        <div className="
          flex items-center gap-2 py-2 px-3 rounded-lg
          bg-paper-2 border border-paper-3
        ">
          <span className="font-serif text-sm text-sakura-deep">語</span>
          <div className="flex flex-col">
            <span className="font-mono text-lg text-sakura-deep font-medium leading-none">
              {learnedCount}
            </span>
            <span className="font-sans text-xs text-anko-light leading-none mt-0.5">
              learned
            </span>
          </div>
        </div>
      </div>

    </aside>
  )
}