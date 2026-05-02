// components/question/ChoiceItem.tsx
//
// A single answer choice button.
//
// States:
//   idle      — default, tappable
//   correct   — sage green background, shown after correct answer
//   wrong     — red background, shown on the choice the user picked incorrectly
//   revealed  — sage green, shown on the correct choice when user picked wrong
//   disabled  — after answering, unchosen choices become non-interactive
//
// The key circle (A/B/C/D) sits on the left, label text on the right.
// Height is fixed at h-9 (36px) to align with notebook ruled lines.

type ChoiceState = 'idle' | 'correct' | 'wrong' | 'revealed' | 'disabled'

interface ChoiceItemProps {
  label: string
  index: number
  state: ChoiceState
  onClick: () => void
}

// Maps A/B/C/D key letters to choice indices
const KEY_LABELS = ['A', 'B', 'C', 'D'] as const

// Per-state styles
const STATE_STYLES: Record<ChoiceState, {
  wrapper: string
  keyCircle: string
  label: string
}> = {
  idle: {
    wrapper: 'border-b border-paper-3 bg-paper-2 hover:bg-paper-3 cursor-pointer active:bg-paper-3 transition-colors duration-100',
    keyCircle: 'border border-paper-3 text-anko-mid',
    label: 'text-anko',
  },
  correct: {
    wrapper: 'border-b border-sage-mid bg-sage-pale cursor-default',
    keyCircle: 'border border-sage-mid text-sage-deep bg-sage-pale',
    label: 'text-sage-deep font-medium',
  },
  wrong: {
    wrapper: 'border-b cursor-default',
    keyCircle: 'border text-wrong-text',
    label: 'text-wrong-text font-medium',
    // wrong colours applied via inline style — Tailwind purges dynamic colour classes
  },
  revealed: {
    wrapper: 'border-b border-sage-mid bg-sage-pale cursor-default',
    keyCircle: 'border border-sage-mid text-sage-deep',
    label: 'text-sage-deep',
  },
  disabled: {
    wrapper: 'border-b border-paper-3 cursor-default opacity-40',
    keyCircle: 'border border-paper-3 text-anko-light',
    label: 'text-anko-light',
  },
}

export default function ChoiceItem({
  label,
  index,
  state,
  onClick,
}: ChoiceItemProps) {
  const styles = STATE_STYLES[state]
  const isWrong = state === 'wrong'

  return (
    <div
      role="button"
      tabIndex={state === 'idle' ? 0 : -1}
      aria-disabled={state !== 'idle'}
      onClick={state === 'idle' ? onClick : undefined}
      onKeyDown={(e) => {
        if (state === 'idle' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={`
        h-9 flex items-center gap-3 px-4
        first:border-t
        ${styles.wrapper}
      `}
      style={isWrong ? {
        borderColor: '#F09595',
        backgroundColor: '#FCEBEB',
      } : undefined}
    >
      {/* Key circle — A / B / C / D */}
      <div
        className={`
          flex-none w-5 h-5 rounded-full flex items-center justify-center
          font-mono text-xs bg-anko-light
          ${styles.keyCircle}
        `}
        style={isWrong ? {
          borderColor: '#F09595',
          color: '#501313',
        } : undefined}
      >
        {KEY_LABELS[index]}
      </div>

      {/* Choice label */}
      <span className={`font-sans text-md flex-1 ${styles.label}`}
        style={isWrong ? { color: '#501313' } : undefined}
      >
        {label}
      </span>
    </div>
  )
}