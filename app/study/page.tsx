// app/study/page.tsx
//
// Study mode screen — Step 7 update.
//
// Added in this step:
//   - POST /api/progress on correct answer (vocabulary, grammar, kanji only)
//   - Optimistic learnedCount increment in top bar
//   - Toast notification on save failure with retry
//   - Toast auto-dismiss on retry success
//
// Reading questions never write to the logbook (per design doc §2.5).

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import NotebookCard from '@/components/question/NotebookCard'
import NotebookSkeleton from '@/components/question/NotebookSkeleton'
import NotebookError from '@/components/question/NotebookError'
import FuriganaText from '@/components/question/FuriganaText'
import ChoiceList from '@/components/question/ChoiceList'
import HankoStamp from '@/components/question/HankoStamp'
import QuestionActions from '@/components/question/QuestionActions'
import AskBar from '@/components/chat/AskBar'
import ChipRow, { STUDY_CHIPS } from '@/components/chat/ChipRow'
import StreamingResponse from '@/components/chat/StreamingResponse'
import Toast from '@/components/ui/Toast'
import { useStream } from '@/hooks/useStream'
import { useToast } from '@/hooks/useToast'
import { apiFetch, ApiError } from '@/lib/api'
import type { Question, SubMode } from '@/types/question'
import type { SessionContext } from '@/types/session'

// ─── Sub-mode pill row config ─────────────────────────────────────────────────

const SUB_MODES: { mode: SubMode; label: string; jp: string }[] = [
  { mode: 'vocabulary', label: 'vocabulary', jp: '語彙' },
  { mode: 'grammar', label: 'grammar', jp: '文法' },
  { mode: 'kanji', label: 'kanji', jp: '漢字' },
  { mode: 'reading', label: 'reading', jp: '読解' },
]

// ─── Fetch state ──────────────────────────────────────────────────────────────

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; consecutiveFails: number }
  | { status: 'success'; question: Question }

// ─── Progress payload ─────────────────────────────────────────────────────────

interface ProgressPayload {
  word: string
  reading: string
  meaning: string
  category: string
  firstSentence: string
  firstSentenceEn: string
  furiganaMap: string
}

function buildProgressPayload(question: Question): ProgressPayload {
  return {
    word: question.targetWord,
    reading: question.targetReading,
    meaning: question.targetMeaning,
    category: question.type,
    firstSentence: question.stem,
    firstSentenceEn: question.choices[question.correctIndex],
    furiganaMap: JSON.stringify(question.furiganaMap),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const [subMode, setSubMode] = useState<SubMode>('vocabulary')
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' })
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [consecutiveFails, setConsecutiveFails] = useState(0)

  // Optimistic learned word count shown in the top bar.
  // Incremented immediately on correct answer, rolled back if save fails.
  const [learnedCount, setLearnedCount] = useState(0)

  // Pending save payload — kept so the toast retry can resend it.
  const [pendingPayload, setPendingPayload] = useState<ProgressPayload | null>(null)

  // Last chat message — kept so the stream retry can resend it.
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const { streamText, isStreaming, error: streamError, startStream, reset: resetStream } = useStream()
  const { toast, showError, showSuccess, dismiss: dismissToast } = useToast()

  const answered = selectedIndex !== null

  // ── Fetch a question ────────────────────────────────────────────────────────

  const fetchQuestion = useCallback(async (mode: SubMode) => {
    setFetchState({ status: 'loading' })
    setSelectedIndex(null)
    resetStream()
    setLastMessage(null)
    setPendingPayload(null)

    try {
      const question = await apiFetch<Question>('/api/questions', {
        method: 'POST',
        body: JSON.stringify({ type: mode, subMode: mode }),
      })
      setConsecutiveFails(0)
      setFetchState({ status: 'success', question })
    } catch (err) {
      const fails = consecutiveFails + 1
      setConsecutiveFails(fails)
      setFetchState({ status: 'error', consecutiveFails: fails })
      if (err instanceof ApiError) {
        console.error(`[study] Question fetch failed: ${err.status} ${err.message}`)
      } else {
        console.error('[study] Question fetch failed:', err)
      }
    }
  }, [consecutiveFails, resetStream])

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchQuestion(subMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sub-mode switch ─────────────────────────────────────────────────────────

  const handleSubModeChange = (mode: SubMode) => {
    if (mode === subMode) return
    setSubMode(mode)
    setConsecutiveFails(0)
    fetchQuestion(mode)
  }

  // ── Save to logbook ─────────────────────────────────────────────────────────

  const saveProgress = useCallback(async (payload: ProgressPayload) => {
    try {
      await apiFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      // Success — clear pending payload and any existing error toast
      setPendingPayload(null)
      dismissToast()
    } catch (err) {
      const word = payload.word
      console.error('[study] saveProgress failed:', err)

      // Roll back the optimistic count
      setLearnedCount(prev => Math.max(0, prev - 1))

      // Store payload so toast retry can resend it
      setPendingPayload(payload)

      showError(`couldn't save ${word} to your logbook — tap to retry`)
    }
  }, [dismissToast, showError])

  // Add a ref to track retry-in-progress
  const retryingRef = useRef(false)

  // ── Retry save from toast ───────────────────────────────────────────────────

  const handleRetrySave = useCallback(async () => {
    if (!pendingPayload) return
    // Prevent multiple concurrent retries
    if (retryingRef.current) return
    retryingRef.current = true

    // Re-increment optimistically before retrying (only once)
    setLearnedCount(prev => prev + 1)

    try {
      await apiFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify(pendingPayload),
      })
      // Success – clear pending and show success toast
      setPendingPayload(null)
      showSuccess(`saved ${pendingPayload.word}`)
    } catch {
      // Failed again – roll back the optimistic increment
      setLearnedCount(prev => Math.max(0, prev - 1))
      // Keep the error toast (still shows, no auto-dismiss)
      showError(`couldn't save ${pendingPayload.word} to your logbook — tap to retry`)
    } finally {
      retryingRef.current = false
    }
  }, [pendingPayload, showError, showSuccess])

  // ── Answer selection ────────────────────────────────────────────────────────

  const handleSelect = useCallback((index: number) => {
    if (answered || fetchState.status !== 'success') return

    setSelectedIndex(index)

    const { question } = fetchState
    const isCorrect = index === question.correctIndex

    // Reading comprehension never writes to the logbook (design doc §2.5)
    if (isCorrect && question.type !== 'reading') {
      setLearnedCount(prev => prev + 1)
      saveProgress(buildProgressPayload(question))
    }
  }, [answered, fetchState, saveProgress])

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = () => fetchQuestion(subMode)
  const handleSkip = () => fetchQuestion(subMode)

  // ── Chat ────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback((message: string) => {
    if (fetchState.status !== 'success') return

    setLastMessage(message)

    const context: SessionContext = {
      mode: 'study',
      subMode,
      currentQuestion: fetchState.question,
      sessionAnswered: answered,
    }

    const token = process.env.NEXT_PUBLIC_OWNER_TOKEN
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['x-owner-token'] = token

    startStream('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, context }),
    })
  }, [fetchState, subMode, answered, startStream])

  const handleRetryStream = useCallback(() => {
    if (lastMessage) sendMessage(lastMessage)
  }, [lastMessage, sendMessage])

  // ─── Render ──────────────────────────────────────────────────────────────────

  const isLoading = fetchState.status === 'loading'

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 bg-paper border-b border-paper-3">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl text-sakura-deep font-semibold">語</span>
            <span className="font-serif text-md text-anko-mid">kotoba</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Optimistic learned count pill */}
            {learnedCount > 0 && (
              <span className="
                font-mono text-xs text-sakura-deep
                bg-sakura-pale border border-sakura-soft
                px-2 py-0.5 rounded-full
              ">
                {learnedCount} learned
              </span>
            )}

            {/* Progress pips — placeholder until Step 9 */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-sakura' : 'bg-paper-3'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Sub-mode pill row ── */}
      <div className="border-b border-paper-3 bg-paper">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-none">
            {SUB_MODES.map(({ mode, label, jp }) => (
              <button
                key={mode}
                onClick={() => handleSubModeChange(mode)}
                className={`
                  flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  font-sans text-xs transition-colors duration-150 whitespace-nowrap
                  ${subMode === mode
                    ? 'bg-sakura-pale text-sakura-deep border border-sakura-mid'
                    : 'text-anko-mid hover:bg-paper-2 border border-transparent'}
                `}
              >
                <span className="font-serif text-sm">{jp}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-2xl mx-auto px-4 py-6">

        {fetchState.status === 'loading' && <NotebookSkeleton />}

        {fetchState.status === 'error' && (
          <NotebookError
            consecutiveFails={fetchState.consecutiveFails}
            onRetry={() => fetchQuestion(subMode)}
          />
        )}

        {fetchState.status === 'success' && (() => {
          const { question } = fetchState

          return (
            <>
              <NotebookCard variant="study" shadowLayers={2}>

                {/* Passage — reading type only */}
                {question.type === 'reading' && question.passage && (
                  <div className="mb-9 pl-3 border-l-2 border-sakura-soft">
                    <FuriganaText
                      text={question.passage}
                      furiganaMap={question.passageFurigana}
                      className="font-serif text-2xl text-anko block notebook-stem notebook-stem-text"
                      rtClassName="text-sakura"
                    />
                  </div>
                )}

                {/* Stem */}
                <FuriganaText
                  text={question.stem}
                  furiganaMap={question.furiganaMap}
                  className="font-serif text-2xl text-anko block notebook-stem notebook-stem-text"
                />

                {/* Instruction */}
                <p className="h-9 flex items-center font-sans text-md text-anko-mid">
                  {question.instruction}
                </p>

                {/* Choices */}
                <ChoiceList
                  question={question}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelect}
                />

                {/* Feedback bar */}
                {answered && (
                  <div
                    className="mt-4 p-4 rounded flex items-start gap-3"
                    style={
                      selectedIndex === question.correctIndex
                        ? { backgroundColor: '#EAF2E6', borderLeft: '3px solid #6B8F5E' }
                        : { backgroundColor: '#FCEBEB', borderLeft: '3px solid #E24B4A' }
                    }
                  >
                    <HankoStamp
                      character={selectedIndex === question.correctIndex ? '正' : '誤'}
                      size={40}
                      rotation={-7}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-md text-anko leading-relaxed">
                        {question.explanation}
                      </p>
                      {question.memoryHook && (
                        <p className="font-sans text-sm text-anko-mid mt-2 italic">
                          {question.memoryHook}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </NotebookCard>

              {/* Actions */}
              <QuestionActions
                answered={answered}
                onNext={handleNext}
                onSkip={handleSkip}
                loading={isLoading}
              />

              {/* Chat section */}
              <div className="mt-6">
                <StreamingResponse
                  text={streamText}
                  isStreaming={isStreaming}
                  error={streamError}
                  onRetry={handleRetryStream}
                />
                <ChipRow
                  chips={STUDY_CHIPS}
                  onChipSelect={sendMessage}
                  disabled={isStreaming}
                />
                <AskBar
                  mode="study"
                  answered={answered}
                  isStreaming={isStreaming}
                  onSubmit={sendMessage}
                />
              </div>
            </>
          )
        })()}
      </main>

      {/* Toast — outside main so it overlays the full screen */}
      <Toast
        toast={toast}
        onRetry={handleRetrySave}
        onDismiss={dismissToast}
        isRetrying={retryingRef.current}
      />
    </div>
  )
}