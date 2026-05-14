// app/study/page.tsx
//
// Study mode screen — desktop layout pass.
//
// Desktop layout (≥640px):
//   TopBar (wordmark + mode tabs + right slot)
//   └─ body: Sidebar (200px) | question card (flex-1)
//      Sidebar shows sub-mode links and learned count.
//      Sub-mode pill row is hidden on desktop.
//
// Mobile layout (<640px):
//   TopBar (wordmark + right slot, no mode tabs)
//   Sub-mode pill row below TopBar
//   Full-width question card

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
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
import { useSwipe } from '@/hooks/useSwipe'
import { apiFetch, ApiError } from '@/lib/api'
import type { Question, SubMode } from '@/types/question'
import type { SessionContext } from '@/types/session'
import { LogbookStats } from '@/types/logbook'

// ─── Sub-mode config ──────────────────────────────────────────────────────────

const SUB_MODES: { mode: SubMode; label: string; jp: string }[] = [
  { mode: 'vocabulary', label: 'vocabulary', jp: '語彙' },
  { mode: 'grammar', label: 'grammar', jp: '文法' },
  { mode: 'kanji', label: 'kanji', jp: '漢字' },
  { mode: 'reading', label: 'reading', jp: '読解' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; consecutiveFails: number }
  | { status: 'success'; question: Question }

interface ProgressPayload {
  word: string; reading: string; meaning: string
  category: string; firstSentence: string
  firstSentenceEn: string; furiganaMap: string
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
  const [pendingPayload, setPendingPayload] = useState<ProgressPayload | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const recentKanjiRef = useRef<string[]>([])

  // History for swipe-right — capped at 10
  const [history, setHistory] = useState<Question[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const cardRef = useRef<HTMLDivElement>(null)

  const { streamText, isStreaming, error: streamError, startStream, reset: resetStream } = useStream()
  const { toast, showError, showSuccess, showRateLimit, dismiss: dismissToast } = useToast()

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
        body: JSON.stringify({ type: mode, subMode: mode, recentKanji: recentKanjiRef.current }),
      })
      setConsecutiveFails(0)
      setFetchState({ status: 'success', question })

      setHistory(prev => {
        const next = [...prev, question].slice(-10)
        setHistoryIndex(next.length - 1)
        return next
      })

      if (question.type === 'kanji') {
        recentKanjiRef.current = [
          question.targetWord,
          ...recentKanjiRef.current.filter(k => k !== question.targetWord),
        ].slice(0, 10)
      }

    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const match = err.message.match(/Retry after (\d+)s/);
        const seconds = match ? parseInt(match[1], 10) : 18; // fallback 18s
        showRateLimit(seconds);
        return;
      }

      const fails = consecutiveFails + 1;
      setConsecutiveFails(fails);
      setFetchState({ status: 'error', consecutiveFails: fails });
      if (err instanceof ApiError) {
        console.error(`[study] fetch failed: ${err.status} ${err.message}`);
      }
    }
  }, [consecutiveFails, resetStream, showRateLimit])
  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchQuestion(subMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Scroll reset on new question ────────────────────────────────────────────

  useEffect(() => {
    if (fetchState.status === 'success' && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [fetchState])

  // ── Sub-mode switch ─────────────────────────────────────────────────────────

  const handleSubModeChange = useCallback((mode: SubMode) => {
    if (mode === subMode) return
    setSubMode(mode)
    setConsecutiveFails(0)
    setHistory([])
    setHistoryIndex(-1)
    if (mode !== 'kanji') recentKanjiRef.current = []
    fetchQuestion(mode)
  }, [subMode, fetchQuestion])



  // Add this state only
  const [logbookStats, setLogbookStats] = useState<LogbookStats | null>(null)

  // Fetch once on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await apiFetch<LogbookStats>('/api/logbook/stats')
        setLogbookStats(stats)
      } catch (err) {
        console.error('[study] logbook stats failed:', err)
      }
    }
    loadStats()
  }, [])

  // ── Save to logbook ─────────────────────────────────────────────────────────

  const saveProgress = useCallback(async (payload: ProgressPayload) => {
    try {
      await apiFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setPendingPayload(null)
      dismissToast()

      // Refetch stats to get updated total (simple + accurate)
      const stats = await apiFetch<LogbookStats>('/api/logbook/stats')
      setLogbookStats(stats)
    } catch (err) {
      console.error('[study] saveProgress failed:', err)
      setPendingPayload(payload)
      showError(`couldn't save ${payload.word} to your logbook — tap to retry`)
    }
  }, [dismissToast, showError])

  // ── Retry save ──────────────────────────────────────────────────────────────

  const handleRetrySave = useCallback(async () => {
    if (!pendingPayload || isRetrying) return
    setIsRetrying(true)
    try {
      await apiFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify(pendingPayload),
      })
      setPendingPayload(null)
      showSuccess(`saved ${pendingPayload.word}`)
    } catch {
      showError(`couldn't save ${pendingPayload.word} to your logbook — tap to retry`)
    } finally {
      setIsRetrying(false)
    }
  }, [pendingPayload, isRetrying, showError, showSuccess])

  // ── Answer selection ────────────────────────────────────────────────────────

  const handleSelect = useCallback((index: number) => {
    if (answered || fetchState.status !== 'success') return
    setSelectedIndex(index)
    const { question } = fetchState
    if (index === question.correctIndex && question.type !== 'reading') {
      saveProgress(buildProgressPayload(question))  // ✅ Just this
    }

  }, [answered, fetchState, saveProgress])

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => fetchQuestion(subMode), [fetchQuestion, subMode])
  const handleSkip = useCallback(() => fetchQuestion(subMode), [fetchQuestion, subMode])

  const handleBack = useCallback(() => {
    if (historyIndex <= 0) return
    const prev = history[historyIndex - 1]
    if (!prev) return
    setHistoryIndex(i => i - 1)
    setSelectedIndex(null)
    resetStream()
    setLastMessage(null)
    setPendingPayload(null)
    setFetchState({ status: 'success', question: prev })
  }, [history, historyIndex, resetStream])

  const handleCardTap = useCallback(() => {
    if (answered) handleNext()
  }, [answered, handleNext])

  // ── Swipe ───────────────────────────────────────────────────────────────────

  const swipeHandlers = useSwipe({
    enabled: answered,
    onSwipeLeft: handleNext,
    onSwipeRight: handleBack,
  })

  // ── Chat ────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback((message: string) => {
    if (fetchState.status !== 'success') return
    setLastMessage(message)
    const context: SessionContext = {
      mode: 'study', subMode,
      currentQuestion: fetchState.question,
      sessionAnswered: answered,
    }
    const token = process.env.NEXT_PUBLIC_OWNER_TOKEN
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['x-owner-token'] = token
    startStream('/api/chat', {
      method: 'POST', headers,
      body: JSON.stringify({ message, context }),
    })
  }, [fetchState, subMode, answered, startStream])

  const handleRetryStream = useCallback(() => {
    if (lastMessage) sendMessage(lastMessage)
  }, [lastMessage, sendMessage])

  // ─── Render ──────────────────────────────────────────────────────────────────

  const isLoading = fetchState.status === 'loading'

  // Progress pips — shown in top bar right slot on mobile only
  // On desktop the sidebar shows the learned count instead
  // Progress pips + learned count pill — both platforms
  // Top bar right slot — pips only


  return (
    <div className="min-h-screen bg-paper">

      <TopBar right={<span className="font-mono text-xs text-anko-light">学</span>} />

      {/* ── Sub-mode pill row + learned count — mobile only ── */}
      <div className="sm:hidden border-b border-paper-3 bg-paper">
        <div className="px-4">
          <div className="flex items-center justify-between py-2">
            {/* Sub-mode pills */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
              {SUB_MODES.map(({ mode, label, jp }) => (
                <button
                  key={mode}
                  onClick={() => handleSubModeChange(mode)}
                  className={`
              flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full
              font-sans text-xs transition-colors duration-150 whitespace-nowrap
              ${subMode === mode
                      ? 'bg-sakura-pale text-sakura-deep border border-sakura-mid'
                      : 'text-anko-mid hover:bg-paper-2 border border-transparent'}`}
                >
                  <span className="font-serif text-sm">{jp}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Learned count pill — same row, right-aligned */}
            {logbookStats?.total && logbookStats.total > 0 && (
              <span className="
    font-mono text-xs text-sakura-deep ml-2
    bg-sakura-pale border border-sakura-soft
    px-2 py-1.5 rounded-full whitespace-nowrap
  ">
                {logbookStats.total} learned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: sidebar (desktop) + main content ── */}
      <div className="max-w-5xl mx-auto flex">

        {/* Desktop sidebar */}
        <Sidebar
          subMode={subMode}
          onSubModeChange={handleSubModeChange}
          learnedCount={logbookStats?.total ?? 0}
        />

        {/* Main content — full width mobile, flex-1 desktop */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6">

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
                {/* Card — swipe + tap-to-advance */}
                <div
                  ref={cardRef}
                  {...swipeHandlers}
                  onClick={handleCardTap}
                  style={{ cursor: answered ? 'pointer' : 'default' }}
                >
                  <NotebookCard variant="study" shadowLayers={2}>

                    {question.type === 'reading' && question.passage && (
                      <div className="mb-4 pl-3 border-l-2 border-sakura-soft">
                        <FuriganaText
                          text={question.passage}
                          furiganaMap={question.passageFurigana}
                          className="font-serif text-2xl text-anko block notebook-stem notebook-stem-text"
                          rtClassName="text-sakura"
                        />
                      </div>
                    )}

                    <FuriganaText
                      text={question.stem}
                      furiganaMap={question.furiganaMap}
                      className="font-serif text-2xl text-anko block notebook-stem notebook-stem-text"
                    />

                    <p className="h-9 flex items-center font-sans text-md text-anko-mid">
                      {question.instruction}
                    </p>

                    {/* Stop choice clicks from bubbling to card tap handler */}
                    <div onClick={e => e.stopPropagation()}>
                      <ChoiceList
                        question={question}
                        selectedIndex={selectedIndex}
                        onSelect={handleSelect}
                      />
                    </div>

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
                </div>

                <QuestionActions
                  answered={answered}
                  onNext={handleNext}
                  onSkip={handleSkip}
                  loading={isLoading}
                />

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
                    onNewQuestion={handleNext}
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

      </div>

      <Toast
        toast={toast}
        onRetry={handleRetrySave}
        onDismiss={dismissToast}
        retryDisabled={isRetrying}
      />
    </div>
  )
}