// components/test/SectionStrip.tsx
//
// Section navigation strip for test mode.
// Shows vocabulary / grammar / reading tabs with live completion counts.
//
// Each tab displays:
//   - Section name
//   - "N / total" count showing how many questions in that section are answered
//
// The active section is highlighted with a sakura bottom border.
// Horizontally scrollable on mobile (design doc §1.7).
//
// Counts are derived from the parent's answers array — this component
// is purely display and navigation, it owns no state.

interface Section {
    id: 'vocabulary' | 'grammar' | 'reading'
    label: string
    total: number
    answered: number
}

interface SectionStripProps {
    sections: Section[]
    activeSection: Section['id']
    onSectionChange: (id: Section['id']) => void
}

export default function SectionStrip({
    sections,
    activeSection,
    onSectionChange,
}: SectionStripProps) {
    return (
        <div className="
      flex overflow-x-auto scrollbar-none
      border-b border-slate-3
      bg-slate-2
    ">
            {sections.map(section => {
                const isActive = section.id === activeSection
                const isComplete = section.answered === section.total

                return (
                    <button
                        key={section.id}
                        onClick={() => onSectionChange(section.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`
              flex-none flex flex-col items-center gap-0.5
              px-5 py-2.5 relative
              font-sans text-xs transition-colors duration-150
              focus-visible:outline-none focus-visible:bg-slate-3
              ${isActive ? 'text-sakura' : 'text-slate-5'}
            `}
                    >
                        {/* Section name */}
                        <span className="font-medium whitespace-nowrap">
                            {section.label}
                        </span>

                        {/* Count */}
                        <span className={`
              font-mono text-xs
              ${isComplete
                                ? 'text-sage'        // all done — sage colour
                                : isActive
                                    ? 'text-sakura-mid'
                                    : 'text-slate-4'
                            }
            `}>
                            {section.answered} / {section.total}
                        </span>

                        {/* Active bottom border */}
                        {isActive && (
                            <span
                                aria-hidden="true"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sakura"
                            />
                        )}
                    </button>
                )
            })}
        </div>
    )
}