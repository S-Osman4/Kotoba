// components/question/ChoiceList.tsx
//
// Renders the four answer choices for a question.
//
// Manages which choice is in which state based on:
//   selectedIndex — which choice the user tapped (null = unanswered)
//   correctIndex  — which choice is correct (from the Question object)
//
// State derivation per choice:
//   Unanswered:  all choices are 'idle'
//   After answer:
//     correctIndex choice  → 'correct' (always shown in sage)
//     selectedIndex choice → 'wrong' if wrong, otherwise already 'correct'
//     all others           → 'disabled'

import ChoiceItem from './ChoiceItem'
import type { Question } from '@/types/question'

interface ChoiceListProps {
  question:      Question
  selectedIndex: number | null
  onSelect:      (index: number) => void
}

type ChoiceState = 'idle' | 'correct' | 'wrong' | 'revealed' | 'disabled'

function deriveState(
  choiceIndex:   number,
  selectedIndex: number | null,
  correctIndex:  number
): ChoiceState {
  // Not answered yet
  if (selectedIndex === null) return 'idle'

  // This is the correct answer
  if (choiceIndex === correctIndex) return 'correct'

  // This is what the user picked (and it's wrong)
  if (choiceIndex === selectedIndex) return 'wrong'

  // Everything else
  return 'disabled'
}

export default function ChoiceList({
  question,
  selectedIndex,
  onSelect,
}: ChoiceListProps) {
  return (
    <div>
      {question.choices.map((choice, index) => (
        <ChoiceItem
          key={index}
          label={choice}
          index={index}
          state={deriveState(index, selectedIndex, question.correctIndex)}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  )
}