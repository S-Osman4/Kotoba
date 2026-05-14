// components/drill/DrillResults.tsx
//
// Inline results screen shown after all 5 drill questions are answered.
//
// Stamp scoring (design doc §1.6):
//   合 — 4–5 correct (pass)
//   可 — 3 correct   (borderline)
//   再 — 0–2 correct (retry)
//
// Mistake list:
//   Shows each wrong question with: stem, user's choice, correct answer.
//   If all 5 correct → shows "no mistakes this round" instead.
//
// Action buttons:
//   "drill again"       — resets the session (always shown)
//   "study weak areas"  — navigates to /study (always shown)
//   "review in logbook" — navigates to /logbook (always shown)
//
// The "drill again" label replaces nothing — it is always "drill again"
// regardless of score. "study weak areas" is always present.

import { useRouter } from 'next/navigation'
import HankoStamp from '@/components/question/HankoStamp'
import FuriganaText from '@/components/question/FuriganaText'
import type { Question } from '@/types/question'

interface MistakeRecord {
    question: Question
    userChoiceIndex: number   // what the user actually picked
}

interface DrillResultsProps {
    correct: number          // 0–5
    mistakes: MistakeRecord[]
    onDrillAgain: () => void
}

// ─── Stamp from score ─────────────────────────────────────────────────────────

function stampFromScore(correct: number): '合' | '可' | '再' {
    if (correct >= 4) return '合'
    if (correct === 3) return '可'
    return '再'
}

// ─── Mistake card ─────────────────────────────────────────────────────────────

function MistakeCard({ record }: { record: MistakeRecord }) {
    const { question, userChoiceIndex } = record
    const userChoice = question.choices[userChoiceIndex]
    const correctChoice = question.choices[question.correctIndex]

    return (
        <div className="border border-drill-border rounded p-4 bg-drill flex flex-col gap-2">

            {/* Stem */}
            <FuriganaText
                text={question.stem}
                furiganaMap={question.furiganaMap}
                className="font-serif text-lg text-anko block"
                rtClassName="text-drill-accent"
            />

            {/* User's wrong choice */}
            <div className="flex items-start gap-2">
                <span className="font-mono text-xs text-wrong-text bg-wrong-bg border border-wrong-border rounded px-1.5 py-0.5 flex-none">
                    your answer
                </span>
                <span className="font-sans text-sm text-wrong-text">
                    {userChoice}
                </span>
            </div>

            {/* Correct answer */}
            <div className="flex items-start gap-2">
                <span className="font-mono text-xs text-sage-deep bg-sage-pale border border-sage-mid rounded px-1.5 py-0.5 flex-none">
                    correct
                </span>
                <span className="font-sans text-sm text-sage-deep">
                    {correctChoice}
                </span>
            </div>

            {/* Explanation */}
            <p className="font-sans text-sm text-anko-mid leading-relaxed border-t border-drill-border pt-2 mt-1">
                {question.explanation}
            </p>

        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrillResults({
    correct,
    mistakes,
    onDrillAgain,
}: DrillResultsProps) {
    const router = useRouter()
    const stamp = stampFromScore(correct)
    const perfect = mistakes.length === 0

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

            {/* ── Score header ── */}
            <div className="flex items-center gap-4">
                <HankoStamp
                    character={stamp}
                    size={56}
                    rotation={-4}
                />
                <div>
                    <p className="font-serif text-2xl text-anko">
                        {correct} / 5
                    </p>
                    <p className="font-sans text-md text-anko-mid">
                        {stamp === '合' && 'well done'}
                        {stamp === '可' && 'almost there'}
                        {stamp === '再' && 'keep practising'}
                    </p>
                </div>
            </div>

            {/* ── Mistake list or perfect message ── */}
            {perfect ? (
                <p className="font-sans text-md text-anko-mid">
                    no mistakes this round
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    <p className="font-mono text-xs text-anko-light uppercase tracking-widest">
                        mistakes
                    </p>
                    {mistakes.map((record, i) => (
                        <MistakeCard key={i} record={record} />
                    ))}
                </div>
            )}

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-2 pt-2 border-t border-drill-border">

                <button
                    onClick={onDrillAgain}
                    className="
            w-full py-2.5 px-4 rounded
            font-sans text-md font-medium
            text-white bg-drill-accent hover:opacity-90
            transition-opacity duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-drill-ring focus-visible:ring-offset-2
          "
                >
                    drill again
                </button>

                <button
                    onClick={() => router.push('/study')}
                    className="
            w-full py-2.5 px-4 rounded
            font-sans text-md font-medium
            text-drill-accent border border-drill-border
            hover:bg-drill-spine
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-drill-ring focus-visible:ring-offset-2
          "
                >
                    study weak areas
                </button>

                <button
                    onClick={() => router.push('/logbook')}
                    className="
            font-sans text-md text-anko-mid
            hover:text-anko
            transition-colors duration-150
            py-2
          "
                >
                    review in logbook
                </button>

            </div>
        </div>
    )
}