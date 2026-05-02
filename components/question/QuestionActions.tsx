// components/question/QuestionActions.tsx
//
// Action buttons shown below the notebook card.
//
// Before answering:  [skip →]
// After answering:   [next →]   (skip disappears)
//
// In Step 6 we add the ask bar and chip row here.
// In Step 9 we add swipe gesture support.

interface QuestionActionsProps {
  answered:  boolean
  onNext:    () => void
  onSkip:    () => void
  /** Disable next/skip while a new question is loading */
  loading?:  boolean
}

export default function QuestionActions({
  answered,
  onNext,
  onSkip,
  loading = false,
}: QuestionActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 mt-4">
      {!answered && (
        <button
          onClick={onSkip}
          disabled={loading}
          className="
            font-sans text-md text-anko-light
            hover:text-anko-mid
            disabled:opacity-40
            transition-colors duration-150
          "
        >
          skip →
        </button>
      )}

      {answered && (
        <button
          onClick={onNext}
          disabled={loading}
          className="
            px-5 py-2 rounded
            font-sans text-md font-medium
            text-white bg-sakura
            hover:bg-sakura-deep
            disabled:opacity-40
            transition-colors duration-150
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-2
          "
        >
          {loading ? 'loading…' : 'next →'}
        </button>
      )}
    </div>
  )
}