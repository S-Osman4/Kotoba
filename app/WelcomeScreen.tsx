// app/WelcomeScreen.tsx
//
// Welcome screen — notebook cover design.
// ...
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HankoStamp from '@/components/question/HankoStamp'



// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'kotoba_session'
const SESSION_VALUE = 'active'
const PERMANENT_KEY = 'kotoba_welcome_seen'

const MODES = [
    { jp: '語彙', en: 'vocabulary' },
    { jp: '文法', en: 'grammar' },
    { jp: '漢字', en: 'kanji' },
    { jp: '読解', en: 'reading' },
] as const

// Cloth texture — now uses the paper RGB helper directly
const CLOTH_TEXTURE: React.CSSProperties = {
    backgroundImage: `repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 19px,
    rgba(var(--color-paper-rgb) / 0.03) 19px,
    rgba(var(--color-paper-rgb) / 0.03) 20px
  )`,
}

type ScreenState = 'checking' | 'show' | 'redirecting'

// ─── Component ────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
    const router = useRouter()
    const [screenState, setScreenState] = useState<ScreenState>('checking')
    const [mounted, setMounted] = useState(false)

    // ── Session check ───────────────────────────────────────────────────────────
    useEffect(() => {
        let hasSession = false
        let hasSeenPermanent = false
        try {
            hasSession = sessionStorage.getItem(SESSION_KEY) === SESSION_VALUE
            hasSeenPermanent = localStorage.getItem(PERMANENT_KEY) === 'true'
        } catch { }

        if (hasSession || hasSeenPermanent) {
            setScreenState('redirecting')
            router.replace('/study')
        } else {
            setScreenState('show')
            const frameId = requestAnimationFrame(() => setMounted(true))
            return () => cancelAnimationFrame(frameId)
        }
    }, [router])

    const handleStart = () => {
        try {
            sessionStorage.setItem(SESSION_KEY, SESSION_VALUE)
            localStorage.setItem(PERMANENT_KEY, 'true')
        } catch { }
        router.push('/study')
    }

    // ── Blank while checking / redirecting ──────────────────────────────────────
    if (screenState !== 'show') {
        return (
            <div
                className="min-h-screen"
                style={{ backgroundColor: 'var(--color-anko)' }}
                aria-hidden="true"
            />
        )
    }

    // ── Animation helpers ───────────────────────────────────────────────────────
    const base = 'transition-all duration-700 ease-out'
    const show = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <main
            className="min-h-screen flex flex-col relative overflow-hidden"
            style={{
                backgroundColor: 'var(--color-anko)',
                ...CLOTH_TEXTURE,
            }}
            aria-label="kotoba — welcome"
        >
            {/* ── Spine strip ──────────────────────────────────────────────────────── */}
            <div
                aria-hidden="true"
                className="absolute top-0 left-0 bottom-0 flex flex-col items-center justify-around py-8"
                style={{
                    width: 32,
                    backgroundColor: 'var(--color-sakura-deep)',
                }}
            >
                {/* Fine vertical rule at the spine / face boundary */}
                <div
                    className="absolute top-0 bottom-0 right-0"
                    style={{
                        width: '0.5px',
                        backgroundColor: 'var(--color-sakura)',
                        opacity: 0.5,
                    }}
                />
                {/* 5 ring indicators */}
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: 13,
                            height: 13,
                            borderRadius: '50%',
                            border: '1.5px solid rgba(var(--color-sakura-rgb) / 0.55)',
                            backgroundColor: 'var(--color-anko)',
                            flexShrink: 0,
                        }}
                    />
                ))}
            </div>

            {/* ── Fore-edge shadow ─────────────────────────────────────────────────── */}
            <div
                aria-hidden="true"
                className="absolute top-0 right-0 bottom-0 pointer-events-none"
                style={{ width: 20, backgroundColor: 'rgba(0,0,0,0.12)' }}
            />

            {/* ── Index tab ────────────────────────────────────────────────────────── */}
            <div
                aria-hidden="true"
                className="absolute top-0 right-5 pointer-events-none"
                style={{
                    width: 18,
                    height: 52,
                    backgroundColor: 'var(--color-sakura)',
                    borderRadius: '0 0 3px 3px',
                    opacity: 0.88,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 18,
                        left: 3,
                        right: 3,
                        height: '0.5px',
                        backgroundColor: 'rgba(var(--color-sakura-pale-rgb) / 0.45)',
                    }}
                />
            </div>



            {/* ── Main content ─────────────────────────────────────────────────────── */}
            <div
                className="relative z-10 flex flex-col items-center justify-center flex-1"
                style={{
                    paddingLeft: 52,
                    paddingRight: 28,

                }}
            >
                <div
                    className="flex flex-col items-center gap-7"
                    style={{ width: '100%', maxWidth: 296 }}
                >
                    {/* 1 — 語 hanko stamp ──────────────────────────────────────────────── */}
                    <div
                        className={`${base} ${show}`}
                        style={{ transitionDelay: '80ms' }}
                        aria-label="語 — kotoba"
                    >
                        <div
                            style={{
                                width: 100,
                                height: 100,
                                border: '2px solid var(--color-sakura)',
                                borderRadius: 5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'rotate(-6deg)',
                                boxShadow: '2px 2px 0 var(--color-sakura-deep)',
                                position: 'relative',
                            }}
                        >
                            <div
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 5,
                                    border: '0.5px solid rgba(var(--color-sakura-rgb) / 0.30)',
                                    borderRadius: 2,
                                }}
                            />
                            <span
                                className="font-serif font-semibold select-none"
                                style={{
                                    fontSize: 56,
                                    color: 'var(--color-sakura)',
                                    lineHeight: 1,
                                    display: 'block',
                                    transform: 'rotate(6deg)',
                                }}
                            >
                                語
                            </span>
                        </div>
                    </div>

                    {/* 2 — kotoba + はじめましょう ───────────────────────────────────── */}
                    <div
                        className={`flex flex-col items-center gap-2 ${base} ${show}`}
                        style={{ transitionDelay: '240ms' }}
                    >
                        <div className="flex flex-col items-center gap-1">
                            <span
                                className="font-mono select-none"
                                style={{
                                    fontSize: 11,
                                    letterSpacing: '0.22em',
                                    color: 'var(--color-anko-light)',
                                }}
                            >
                                kotoba
                            </span>
                            <svg
                                width="52"
                                height="8"
                                viewBox="0 0 52 8"
                                fill="none"
                                aria-hidden="true"
                                style={{ display: 'block' }}
                            >
                                <path
                                    d="M2 4 Q8 1 14 4 T26 4 T38 4 T50 4"
                                    stroke="var(--color-sakura-mid)"
                                    strokeWidth="1.2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>

                        <p
                            className="font-serif text-center select-none"
                            style={{
                                fontSize: 26,
                                fontWeight: 400,
                                color: 'var(--color-sakura-pale)',
                                letterSpacing: '0.04em',
                                margin: 0,
                            }}
                        >
                            はじめましょう
                        </p>

                        <div
                            aria-hidden="true"
                            style={{
                                width: 36,
                                height: '0.5px',
                                backgroundColor: 'var(--color-sakura-mid)',
                                opacity: 0.5,
                                margin: '2px 0',
                            }}
                        />

                        <p
                            className="font-sans text-center"
                            style={{
                                fontSize: 12,
                                color: 'var(--color-anko-light)',
                                letterSpacing: '0.04em',
                                margin: 0,
                            }}
                        >
                            jlpt n5 study
                        </p>
                    </div>

                    {/* 3 — Sub-mode list ──────────────────────────────────────────────── */}
                    <div
                        className={`flex flex-col gap-2 ${base} ${show}`}
                        style={{ transitionDelay: '380ms', width: 196 }}
                    >
                        {MODES.map(({ jp, en }) => (
                            <div key={en} className="flex items-center gap-3">
                                <div
                                    aria-hidden="true"
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--color-sakura-mid)',
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    className="font-serif"
                                    style={{ fontSize: 13, color: 'var(--color-anko-light)' }}
                                >
                                    {jp}
                                </span>
                                <span
                                    className="font-mono"
                                    style={{
                                        fontSize: 10,
                                        color: 'var(--color-anko-light)',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    {en}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* 4 — Start button ────────────────────────────────────────────────── */}
                    <div
                        className={`${base} ${show}`}
                        style={{ transitionDelay: '520ms' }}
                    >
                        <button
                            onClick={handleStart}
                            className="
                font-sans font-medium
                hover:opacity-90 active:scale-95
                transition-all duration-150
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-offset-2
              "
                            style={{
                                backgroundColor: 'var(--color-sakura)',
                                color: '#FDFAF8',
                                paddingInline: 40,
                                paddingBlock: 12,
                                borderRadius: 3,
                                fontSize: 13,
                                letterSpacing: '0.04em',
                                // @ts-expect-error CSS custom property
                                '--tw-ring-offset-color': 'var(--color-anko)',
                                '--tw-ring-color': 'var(--color-sakura)',
                            }}
                        >
                            start studying →
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Colophon — bottom-right ─────────────────────────────────────────── */}
            <div
                className={`absolute bottom-5 right-5 flex flex-col items-end gap-1 z-10 ${base} ${show}`}
                style={{ transitionDelay: '660ms' }}
                aria-label="Made by Shamso Osman"
            >
                <div
                    aria-hidden="true"
                    style={{
                        width: 28,
                        height: '0.5px',
                        backgroundColor: 'var(--color-anko-mid)',
                        opacity: 0.4,
                        marginBottom: 2,
                    }}
                />
                <span
                    className="font-mono select-none"
                    style={{
                        fontSize: 11,
                        color: 'var(--color-anko-light)',
                        letterSpacing: '0.08em',
                    }}
                >
                    Shamso · Osman
                </span>
                <span
                    className="font-mono select-none"
                    style={{
                        fontSize: 10,
                        color: 'var(--color-anko-light)',
                    }}
                >
                    2025
                </span>
            </div>

            {/* ── Publisher stamp — bottom-left (now using HankoStamp component) ─── */}
            <div
                aria-hidden="true"
                className="absolute top-4 pointer-events-none"
                style={{ left: 44 }}
            >
                <HankoStamp
                    character="印"
                    size={28}
                    rotation={9}
                />
            </div>
        </main>
    )
}