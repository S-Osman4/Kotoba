// app/study/page.tsx
//
// Study mode screen — Step 6 update.
//
// Added in this step:
//   - AskBar with mode-aware label and placeholder
//   - ChipRow with quick-action chips
//   - StreamingResponse consuming useStream
//   - Chat state (last message, streaming text, error) reset on each new question
//
// Planned for Step 7:
//   - Logbook save on correct answer (POST /api/progress)
//   - Optimistic sidebar pill count update

'use client'

import { useState, useCallback, useEffect } from 'react'
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
import { useStream } from '@/hooks/useStream'
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const [subMode, setSubMode] = useState<SubMode>('vocabulary')
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' })
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [consecutiveFails, setConsecutiveFails] = useState(0)

  // The last message the user sent — used to retry on stream error
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const { streamText, isStreaming, error: streamError, startStream, reset: resetStream } = useStream()

  const answered = selectedIndex !== null

  // ── Fetch a question ────────────────────────────────────────────────────────

  const fetchQuestion = useCallback(async (mode: SubMode) => {
    setFetchState({ status: 'loading' })
    setSelectedIndex(null)
    resetStream()
    setLastMessage(null)

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

  // ── Answer selection ────────────────────────────────────────────────────────

  const handleSelect = (index: number) => {
    if (answered) return
    setSelectedIndex(index)
    // Step 7: POST /api/progress here if correct
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => fetchQuestion(subMode), [fetchQuestion, subMode]);
  const handleSkip = useCallback(() => fetchQuestion(subMode), [fetchQuestion, subMode]);

  // ── Chat submission ─────────────────────────────────────────────────────────

  const sendMessage = useCallback((message: string) => {
    if (fetchState.status !== 'success') return

    setLastMessage(message)

    // Build context from current state
    const context: SessionContext = {
      mode: 'study',
      subMode,
      currentQuestion: fetchState.question,
      sessionAnswered: answered,
    }

    // Owner token for the middleware
    const token = process.env.NEXT_PUBLIC_OWNER_TOKEN

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['x-owner-token'] = token

    startStream('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, context }),
    })
  }, [fetchState, subMode, answered, startStream])

  // Retry the last message after a stream error
  const handleRetry = useCallback(() => {
    if (lastMessage) sendMessage(lastMessage)
  }, [lastMessage, sendMessage])

  // ─── Render ──────────────────────────────────────────────────────────────────

  const isLoading = fetchState.status === 'loading'

  // Handle chip clicks – intercept 'new question'
  const handleChipSelect = useCallback((message: string) => {
    if (message === 'Give me a new question on this topic.') {
      if (!isLoading && !isStreaming) {
        handleNext();
      }
      return;
    }
    sendMessage(message);
  }, [handleNext, sendMessage, isLoading, isStreaming]);

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 bg-paper border-b border-paper-3">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl text-sakura-deep font-semibold">語</span>
            <span className="font-serif text-md text-anko-mid">kotoba</span>
          </div>
          {/* Progress pips — 5 per set. Placeholder until Step 9 wires up real state. */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-sakura' : 'bg-paper-3'}`}
              />
            ))}
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

        {/* Loading skeleton */}
        {fetchState.status === 'loading' && <NotebookSkeleton />}

        {/* Error card */}
        {fetchState.status === 'error' && (
          <NotebookError
            consecutiveFails={fetchState.consecutiveFails}
            onRetry={() => fetchQuestion(subMode)}
          />
        )}

        {/* Question card */}
        {fetchState.status === 'success' && (() => {
          const { question } = fetchState

          return (
            <>
              <NotebookCard variant="study" shadowLayers={2}>

                {/* Passage — reading type only */}
                {question.type === 'reading' && question.passage && (
                  <div className="mb-9 pl-3 border-l-2 border-sakura-soft">   {/* was mb-4 */}
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

              {/* ── Chat section ── */}
              <div className="mt-6">
                {/* Streaming response */}
                <StreamingResponse
                  text={streamText}
                  isStreaming={isStreaming}
                  error={streamError}
                  onRetry={handleRetry}
                />

                {/* Quick-action chips */}
                <ChipRow
                  chips={STUDY_CHIPS}
                  onChipSelect={handleChipSelect}
                  disabled={isStreaming || isLoading}
                />

                {/* Ask bar */}
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
    </div>
  )
}