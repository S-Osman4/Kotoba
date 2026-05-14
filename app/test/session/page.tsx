// app/test/session/page.tsx
//
// JLPT test mode — 20 questions, no hints, countdown timer.
//
// This file was previously at app/test/page.tsx. It has been moved here
// so that /test can serve a lobby page (recent results + start CTA).
//
// Changes from the original:
//   - Questions are cached by index in questionsCache ref. Re-visiting a
//     section (via SectionStrip) shows the SAME question, not a new one.
//     This fixes the bug where jumping away and back changed the question.
//   - Timer reduced to 25 minutes (1500s) — more realistic for N5.
//   - Skipped questions (undefined answers) are treated as wrong at submit
//     AND appear in the mistake review list.
//   - After submit, navigates to /test/results (unchanged).
//   - Leave guard navigates back to /test (lobby), not the browser back stack.
//
// Section layout (deterministic):
//   Q 1–8   vocabulary  (8 questions)
//   Q 9–14  grammar     (6 questions)
//   Q 15–20 reading     (6 questions)

'use client'

import {
  useState, useCallback, useEffect,
  useRef, useMemo,
} from 'react'
import { useRouter } from 'next/navigation'
import TestBar from '@/components/test/TestBar'
import SectionStrip from '@/components/test/SectionStrip'
import LeaveTestModal from '@/components/test/LeaveTestModal'
import NotebookCard from '@/components/question/NotebookCard'
import NotebookSkeleton from '@/components/question/NotebookSkeleton'
import NotebookError from '@/components/question/NotebookError'
import ChoiceList from '@/components/question/ChoiceList'
import { useLeaveGuard } from '@/hooks/useLeaveGuard'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { apiFetch, ApiError } from '@/lib/api'
import type { Question, QuestionType } from '@/types/question'
import FuriganaText from '@/components/question/FuriganaText'

// ─── Session config ───────────────────────────────────────────────────────────

// 25 minutes — more realistic for JLPT N5 language knowledge section
const TOTAL_SECONDS = 25 * 60

const SECTIONS = [
  { id: 'vocabulary' as const, label: 'vocabulary', start: 0, end: 7,  total: 8 },
  { id: 'grammar'    as const, label: 'grammar',    start: 8, end: 13, total: 6 },
  { id: 'reading'    as const, label: 'reading',    start: 14, end: 19, total: 6 },
]

const TOTAL_QUESTIONS = 20

function typeForIndex(index: number): QuestionType {
  if (index <= 7)  return 'vocabulary'
  if (index <= 13) return 'grammar'
  return 'reading'
}

function sectionForIndex(index: number): typeof SECTIONS[number]['id'] {
  if (index <= 7)  return 'vocabulary'
  if (index <= 13) return 'grammar'
  return 'reading'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; consecutiveFails: number }
  | { status: 'success'; question: Question }

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestSessionPage() {
  const router = useRouter()

  // ── Session state ─────────────────────────────────────────────────────────

  const [currentIndex, setCurrentIndex]   = useState(0)
  const [fetchState,   setFetchState]     = useState<FetchState>({ status: 'loading' })
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // answers[i]: true = correct, false = wrong, undefined = not yet answered
  const [answers,     setAnswers]     = useState<(boolean | undefined)[]>(Array(TOTAL_QUESTIONS).fill(undefined))
  // userChoices[i]: which choice index the user picked (undefined = skipped/unanswered)
  const [userChoices, setUserChoices] = useState<(number | undefined)[]>(Array(TOTAL_QUESTIONS).fill(undefined))

  // ── Question cache ────────────────────────────────────────────────────────
  //
  // Keyed by question index. Once a question is fetched for a given index,
  // re-visiting that index (via SectionStrip) shows the cached question
  // rather than fetching a new one from the AI. This ensures the question
  // doesn't change between visits — critical for test integrity.
  const questionsCache = useRef<Map<number, Question>>(new Map())

  // ── Timer ─────────────────────────────────────────────────────────────────

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused,       setIsPaused]       = useState(false)
  const elapsedRef    = useRef(0)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Section strip ─────────────────────────────────────────────────────────

  const [activeSection, setActiveSection] = useState<typeof SECTIONS[number]['id']>('vocabulary')

  // ── Submission ────────────────────────────────────────────────────────────

  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [isTestActive,  setIsTestActive]  = useState(true)

  const isOnline = useNetworkStatus()
  const { showModal, confirmLeave, cancelLeave } = useLeaveGuard(isTestActive)

  const answered  = selectedIndex !== null
  const isLastQ   = currentIndex === TOTAL_QUESTIONS - 1
  const cardRef   = useRef<HTMLDivElement>(null)

  // ── Timer logic ───────────────────────────────────────────────────────────

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resumeTimer = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1
      setElapsedSeconds(elapsedRef.current)
      if (elapsedRef.current >= TOTAL_SECONDS) {
        pauseTimer()
      }
    }, 1000)
  }, [pauseTimer])

  useEffect(() => {
    resumeTimer()
    return () => pauseTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pause automatically on network loss
  useEffect(() => {
    if (!isOnline) {
      pauseTimer()
      setIsPaused(true)
    }
    // Intentionally not auto-resuming on reconnect — user must tap resume
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)
      resumeTimer()
    } else {
      setIsPaused(true)
      pauseTimer()
    }
  }, [isPaused, pauseTimer, resumeTimer])

  // ── Fetch question ────────────────────────────────────────────────────────

  const fetchQuestion = useCallback(async (index: number) => {
    // Check cache first — if we already fetched this question, reuse it
    const cached = questionsCache.current.get(index)
    if (cached) {
      setFetchState({ status: 'success', question: cached })
      setSelectedIndex(userChoices[index] ?? null)
      setActiveSection(sectionForIndex(index))
      return
    }

    setFetchState({ status: 'loading' })
    setSelectedIndex(null)
    setActiveSection(sectionForIndex(index))

    const type = typeForIndex(index)

    try {
      const question = await apiFetch<Question>('/api/questions', {
        method: 'POST',
        body: JSON.stringify({ type, subMode: type }),
      })

      // Store in cache before setting state
      questionsCache.current.set(index, question)

      setFetchState({ status: 'success', question })
    } catch (err) {
      const prevFails = fetchState.status === 'error' ? fetchState.consecutiveFails : 0
      setFetchState({ status: 'error', consecutiveFails: prevFails + 1 })
      if (err instanceof ApiError) {
        console.error(`[test] fetch failed Q${index + 1}: ${err.status}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userChoices])

  useEffect(() => {
    fetchQuestion(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll card into view when question changes
  useEffect(() => {
    if (fetchState.status === 'success' && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [fetchState, currentIndex])

  // ── Answer ────────────────────────────────────────────────────────────────

  const handleSelect = useCallback((index: number) => {
    if (answered || fetchState.status !== 'success') return

    const { question } = fetchState
    const isCorrect = index === question.correctIndex

    setSelectedIndex(index)
    setUserChoices(prev => {
      const next = [...prev]
      next[currentIndex] = index
      return next
    })
    setAnswers(prev => {
      const next = [...prev]
      next[currentIndex] = isCorrect
      return next
    })
  }, [answered, fetchState, currentIndex])

  // ── Navigate ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (!answered) return
    if (isLastQ) return

    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)
    fetchQuestion(nextIndex)
  }, [answered, isLastQ, currentIndex, fetchQuestion])

  // SectionStrip: jump to first unanswered question in the tapped section
  const handleSectionChange = useCallback((id: typeof SECTIONS[number]['id']) => {
    const section = SECTIONS.find(s => s.id === id)
    if (!section) return

    let targetIndex = section.start
    for (let i = section.start; i <= section.end; i++) {
      if (answers[i] === undefined) {
        targetIndex = i
        break
      }
    }

    setCurrentIndex(targetIndex)
    fetchQuestion(targetIndex)
    setActiveSection(id)
  }, [answers, fetchQuestion])

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setIsTestActive(false)
    pauseTimer()

    // Treat any undefined answer as wrong (skipped)
    const finalAnswers = answers.map(a => a === true)

    const vocabCorrect   = finalAnswers.slice(0, 8).filter(Boolean).length
    const grammarCorrect = finalAnswers.slice(8, 14).filter(Boolean).length
    const readCorrect    = finalAnswers.slice(14, 20).filter(Boolean).length
    const totalCorrect   = vocabCorrect + grammarCorrect + readCorrect

    // Build mistake list — wrong answers AND skipped questions both appear
    // so the user can review everything they didn't get right
    const mistakeList: Question[] = []
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const q = questionsCache.current.get(i)
      // Include if: wrong answer, OR skipped (undefined), but only if we have the question
      if (q && answers[i] !== true) {
        mistakeList.push(q)
      }
    }

    const payload = {
      takenAt:         Date.now(),
      durationSeconds: elapsedRef.current,
      totalQuestions:  TOTAL_QUESTIONS,
      correct:         totalCorrect,
      vocabScore:      vocabCorrect   / 8,
      grammarScore:    grammarCorrect / 6,
      readingScore:    readCorrect    / 6,
      mistakes:        JSON.stringify(mistakeList),
    }

    try {
      await apiFetch('/api/test-results', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.error('[test] saveTestResult failed (non-fatal):', err)
    }

    try {
      sessionStorage.setItem('test_result', JSON.stringify({
        ...payload,
        userChoices,
      }))
    } catch {
      // sessionStorage unavailable — results page will fetch from DB
    }

    router.push('/test/results')
  }, [isSubmitting, answers, userChoices, pauseTimer, router])

  // ── Section counts ────────────────────────────────────────────────────────

  const sectionData = useMemo(() => SECTIONS.map(s => ({
    ...s,
    answered: answers.slice(s.start, s.end + 1).filter(a => a !== undefined).length,
  })), [answers])

  // ── Confirm leave — navigates to lobby ───────────────────────────────────

  const handleConfirmLeave = useCallback(() => {
    setIsTestActive(false)
    pauseTimer()
    confirmLeave()
  }, [confirmLeave, pauseTimer])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#23262E' }}>

      <TestBar
        currentIndex={currentIndex}
        answers={answers}
        totalSeconds={TOTAL_SECONDS}
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
      />

      {/* Network loss banner */}
      {!isOnline && (
        <div
          className="px-4 py-2 font-sans text-sm text-center"
          style={{ backgroundColor: '#3A3F50', color: '#D8D4CE' }}
        >
          connection lost — timer paused
        </div>
      )}

      <SectionStrip
        sections={sectionData}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {fetchState.status === 'loading' && <NotebookSkeleton />}

        {fetchState.status === 'error' && (
          <NotebookError
            consecutiveFails={fetchState.consecutiveFails}
            onRetry={() => fetchQuestion(currentIndex)}
          />
        )}

        {fetchState.status === 'success' && (() => {
          const { question } = fetchState

          return (
            <>
              <div ref={cardRef}>
                <NotebookCard variant="test" shadowLayers={1}>

                  {/* Reading passage — no furigana in test mode */}
                  {question.type === 'reading' && question.passage && (
                    <div
                      className="mb-4 pl-3 border-l-2"
                      style={{ borderColor: 'rgba(196,114,138,0.4)' }}
                    >
                      <p
                        className="font-serif text-2xl block notebook-stem notebook-stem-text"
                        style={{ color: '#D8D4CE' }}
                      >
                        <FuriganaText text={question.passage} furiganaMap={question.passageFurigana} />
                      </p>
                    </div>
                  )}

                  {/* Stem — no furigana */}
                  <p
                    className="font-serif text-2xl block notebook-stem notebook-stem-text"
                    style={{ color: '#D8D4CE' }}
                  >
                    {question.stem}
                  </p>

                  <p
                    className="h-9 flex items-center font-sans text-md"
                    style={{ color: '#6B7285' }}
                  >
                    {question.instruction}
                  </p>

                  <ChoiceList
                    question={question}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelect}
                  />

                  {/* Minimal feedback — no explanation in test mode */}
                  {answered && (
                    <div
                      className="mt-4 px-4 py-3 rounded font-sans text-sm"
                      style={
                        selectedIndex === question.correctIndex
                          ? { backgroundColor: 'rgba(106,143,94,0.15)', color: '#8AAD7C' }
                          : { backgroundColor: 'rgba(226,75,74,0.12)', color: '#F09595' }
                      }
                    >
                      {selectedIndex === question.correctIndex
                        ? 'correct'
                        : `incorrect — the answer was: ${question.choices[question.correctIndex]}`
                      }
                    </div>
                  )}
                </NotebookCard>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">

                {/* Left: no hints reminder when unanswered */}
                {!answered && (
                  <p
                    className="font-sans text-xs"
                    style={{ color: '#4E5468' }}
                  >
                    no hints available during the test
                  </p>
                )}

                {/* Right: next or submit */}
                <div className="flex items-center gap-3 ml-auto">
                  {answered && !isLastQ && (
                    <button
                      onClick={handleNext}
                      className="
                        px-5 py-2 rounded
                        font-sans text-md font-medium text-white
                        bg-sakura hover:bg-sakura-deep
                        transition-colors duration-150
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-sakura-mid focus-visible:ring-offset-2
                      "
                    >
                      next →
                    </button>
                  )}

                  {/* Submit on last question — available whether or not answered */}
                  {isLastQ && (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="
                        px-5 py-2 rounded
                        font-sans text-md font-medium text-white
                        bg-sakura hover:bg-sakura-deep
                        disabled:opacity-50
                        transition-colors duration-150
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-sakura-mid focus-visible:ring-offset-2
                      "
                    >
                      {isSubmitting ? 'submitting…' : 'submit test →'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )
        })()}
      </main>

      {showModal && (
        <LeaveTestModal
          onConfirm={handleConfirmLeave}
          onCancel={cancelLeave}
        />
      )}
    </div>
  )
}