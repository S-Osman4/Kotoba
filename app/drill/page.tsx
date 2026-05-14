// app/drill/page.tsx
//
// Quick drill mode screen.
//
// Session flow:
//   1. Fetch 5 questions sequentially (one at a time, mixed types)
//   2. User answers each question
//   3. Hanko feedback shown, AI ask bar unlocks
//   4. User taps "next →" (or swipes left) to advance
//   5. On question 5 answered: "next →" becomes "see results →"
//   6. Results screen replaces the question flow inline
//
// Key differences from study mode:
//   - Fixed 5-question session (TOTAL_QUESTIONS constant)
//   - Amber/ochre palette (variant="drill" on NotebookCard)
//   - AI ask bar locked until question is answered
//   - Mixed question types (randomly selected client-side per question)
//   - Results screen shown inline (no route change)
//   - "Drill again" resets via sessionKey increment (clean remount)
//   - Wrong answers stored with user's choice index for mistake list

'use client'

import { useState, useCallback, useEffect, useRef, } from 'react'
import TopBar from '@/components/layout/TopBar'
import DrillBar from '@/components/drill/DrillBar'
import DrillResults from '@/components/drill/DrillResults'
import NotebookCard from '@/components/question/NotebookCard'
import NotebookSkeleton from '@/components/question/NotebookSkeleton'
import NotebookError from '@/components/question/NotebookError'
import FuriganaText from '@/components/question/FuriganaText'
import ChoiceList from '@/components/question/ChoiceList'
import HankoStamp from '@/components/question/HankoStamp'
import AskBar from '@/components/chat/AskBar'
import ChipRow, { STUDY_CHIPS } from '@/components/chat/ChipRow'
import StreamingResponse from '@/components/chat/StreamingResponse'
import Toast from '@/components/ui/Toast'
import { useStream } from '@/hooks/useStream'
import { useToast } from '@/hooks/useToast'
import { useSwipe } from '@/hooks/useSwipe'
import { apiFetch, ApiError } from '@/lib/api'
import type { Question, QuestionType } from '@/types/question'
import type { SessionContext } from '@/types/session'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS = 5

// All four question types — one is picked randomly for each drill question
const QUESTION_TYPES: QuestionType[] = ['vocabulary', 'grammar', 'kanji', 'reading']

function randomType(): QuestionType {
    return QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState =
    | { status: 'loading' }
    | { status: 'error'; consecutiveFails: number }
    | { status: 'success'; question: Question }

interface MistakeRecord {
    question: Question
    userChoiceIndex: number
}

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

// ─── Inner drill session ──────────────────────────────────────────────────────
// Extracted so sessionKey remount gives a fully clean slate.

function DrillSession({ onDrillAgain }: { onDrillAgain: () => void }) {
    // ── Session state ───────────────────────────────────────────────────────────

    const [currentIndex, setCurrentIndex] = useState(0)
    const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' })
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [showResults, setShowResults] = useState(false)

    // Per-question result tracking (true=correct, false=wrong, undefined=unanswered)
    const [results, setResults] = useState<(boolean | undefined)[]>(Array(TOTAL_QUESTIONS).fill(undefined))
    const [mistakes, setMistakes] = useState<MistakeRecord[]>([])

    const [pendingPayload, setPendingPayload] = useState<ProgressPayload | null>(null)
    const [isRetrying, setIsRetrying] = useState(false)
    const [lastMessage, setLastMessage] = useState<string | null>(null)

    const cardRef = useRef<HTMLDivElement>(null)

    const { streamText, isStreaming, error: streamError, startStream, reset: resetStream } = useStream()
    const { toast, showError, showSuccess, dismiss: dismissToast } = useToast()

    const answered = selectedIndex !== null
    const isLastQ = currentIndex === TOTAL_QUESTIONS - 1
    const correctCount = results.filter(r => r === true).length

    // ── Fetch current question ──────────────────────────────────────────────────

    const fetchQuestion = useCallback(async () => {
        setFetchState({ status: 'loading' })
        setSelectedIndex(null)
        resetStream()
        setLastMessage(null)
        setPendingPayload(null)

        const type = randomType()

        try {
            const question = await apiFetch<Question>('/api/questions', {
                method: 'POST',
                body: JSON.stringify({ type, subMode: type }),
            })
            setFetchState({ status: 'success', question })
        } catch (err) {
            const prevFails = fetchState.status === 'error' ? fetchState.consecutiveFails : 0
            setFetchState({ status: 'error', consecutiveFails: prevFails + 1 })
            if (err instanceof ApiError) {
                console.error(`[drill] fetch failed: ${err.status} ${err.message}`)
            }
        }
        // fetchState in deps would cause infinite loop — read it via ref instead
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetStream])

    useEffect(() => {
        fetchQuestion()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Scroll to card on new question
    useEffect(() => {
        if (fetchState.status === 'success' && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [fetchState, currentIndex])

    // ── Save to logbook ─────────────────────────────────────────────────────────

    const saveProgress = useCallback(async (payload: ProgressPayload) => {
        try {
            await apiFetch('/api/progress', {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            setPendingPayload(null)
            dismissToast()
        } catch (err) {
            console.error('[drill] saveProgress failed:', err)
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

        const { question } = fetchState
        const isCorrect = index === question.correctIndex

        setSelectedIndex(index)

        // Record result
        setResults(prev => {
            const next = [...prev]
            next[currentIndex] = isCorrect
            return next
        })

        // Record mistake (store user's choice index alongside question)
        if (!isCorrect) {
            setMistakes(prev => [...prev, { question, userChoiceIndex: index }])
        }

        // Save correct answers (not reading type) to logbook
        if (isCorrect && question.type !== 'reading') {
            saveProgress(buildProgressPayload(question))
        }
    }, [answered, fetchState, currentIndex, saveProgress])

    // ── Advance to next question or results ─────────────────────────────────────

    const handleNext = useCallback(() => {
        if (!answered) return

        if (isLastQ) {
            setShowResults(true)
            return
        }

        setCurrentIndex(prev => prev + 1)
        fetchQuestion()
    }, [answered, isLastQ, fetchQuestion])

    // Tap anywhere on answered card advances (mobile)
    const handleCardTap = useCallback(() => {
        if (answered) handleNext()
    }, [answered, handleNext])

    const swipeHandlers = useSwipe({
        enabled: answered,
        onSwipeLeft: handleNext,
        // No swipe-right in drill — no history navigation
    })

    // ── Chat ────────────────────────────────────────────────────────────────────

    const sendMessage = useCallback((message: string) => {
        if (fetchState.status !== 'success') return
        setLastMessage(message)

        const context: SessionContext = {
            mode: 'drill',
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
    }, [fetchState, answered, startStream])

    const handleRetryStream = useCallback(() => {
        if (lastMessage) sendMessage(lastMessage)
    }, [lastMessage, sendMessage])

    // ─── Render ──────────────────────────────────────────────────────────────────

    // Results screen
    if (showResults) {
        return (
            <>
                <DrillBar currentIndex={TOTAL_QUESTIONS - 1} results={results} />
                <DrillResults
                    correct={correctCount}
                    mistakes={mistakes}
                    onDrillAgain={onDrillAgain}
                />
                <Toast
                    toast={toast}
                    onRetry={handleRetrySave}
                    onDismiss={dismissToast}
                    retryDisabled={isRetrying}
                />
            </>
        )
    }

    const isLoading = fetchState.status === 'loading'

    return (
        <>

            <DrillBar currentIndex={currentIndex} results={results} />

            <main className="max-w-2xl mx-auto px-4 py-6">

                {fetchState.status === 'loading' && (
                    <NotebookSkeleton />
                )}

                {fetchState.status === 'error' && (
                    <NotebookError
                        consecutiveFails={fetchState.consecutiveFails}
                        onRetry={fetchQuestion}
                    />
                )}

                {fetchState.status === 'success' && (() => {
                    const { question } = fetchState

                    return (
                        <>
                            {/* Card */}
                            <div
                                ref={cardRef}
                                {...swipeHandlers}
                                onClick={handleCardTap}
                                style={{ cursor: answered ? 'pointer' : 'default' }}
                            >
                                <NotebookCard variant="drill" shadowLayers={2}>

                                    {question.type === 'reading' && question.passage && (
                                        <div className="mb-4 pl-3 border-l-2 border-drill-ring">
                                            <FuriganaText
                                                text={question.passage}
                                                furiganaMap={question.passageFurigana}
                                                className="font-serif text-2xl text-anko block notebook-stem notebook-stem-text"
                                                rtClassName="text-drill-accent"
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

                            {/* Next / See results button */}
                            <div className="flex items-center justify-end gap-3 mt-4">
                                {!answered && (
                                    <button
                                        onClick={fetchQuestion}
                                        disabled={isLoading}
                                        className="font-sans text-md text-anko-light hover:text-anko-mid disabled:opacity-40 transition-colors duration-150"
                                    >
                                        skip →
                                    </button>
                                )}
                                {answered && (
                                    <button
                                        onClick={handleNext}
                                        disabled={isLoading}
                                        className="
                      px-5 py-2 rounded
                      font-sans text-md font-medium
                      text-white bg-drill-accent hover:opacity-90
                      disabled:opacity-40
                      transition-opacity duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-drill-ring focus-visible:ring-offset-2
                    "
                                    >
                                        {isLastQ ? 'see results →' : 'next →'}
                                    </button>
                                )}
                            </div>

                            {/* Chat section — locked until answered */}
                            <div className="mt-6">
                                <StreamingResponse
                                    text={streamText}
                                    isStreaming={isStreaming}
                                    error={streamError}
                                    onRetry={handleRetryStream}
                                />
                                {answered && (
                                    <ChipRow
                                        chips={STUDY_CHIPS}
                                        onChipSelect={sendMessage}
                                        disabled={isStreaming}
                                    />
                                )}
                                <AskBar
                                    mode="drill"
                                    answered={answered}
                                    isStreaming={isStreaming}
                                    onSubmit={sendMessage}
                                />
                            </div>
                        </>
                    )
                })()}
            </main>

            <Toast
                toast={toast}
                onRetry={handleRetrySave}
                onDismiss={dismissToast}
                retryDisabled={isRetrying}
            />
        </>
    )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
// sessionKey increment causes DrillSession to fully remount on "drill again",
// giving a completely clean slate without any manual state reset.

export default function DrillPage() {
    const [sessionKey, setSessionKey] = useState(0)

    const handleDrillAgain = useCallback(() => {
        setSessionKey(prev => prev + 1)
    }, [])

    return (
        <div className="min-h-screen bg-drill">
            <TopBar right={<span className="font-mono text-xs text-anko-light">練</span>} />

            <DrillSession key={sessionKey} onDrillAgain={handleDrillAgain} />
        </div>
    )
}