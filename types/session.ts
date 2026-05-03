// types/session.ts
//
// Types shared between the chat API route and prompt composers.
//
// SessionContext is attached to every AI request so the tutor
// knows exactly what mode the user is in and what is on screen.
// The AI never receives a naked message — context always travels with it.

import type { Question } from "./question";

// ─── Mode ────────────────────────────────────────────────────────────────────

export type AppMode = "study" | "drill" | "test" | "review" | "logbook";
export type SubMode = "vocabulary" | "grammar" | "kanji" | "reading";

// ─── Session context ──────────────────────────────────────────────────────────
//
// Sent alongside every message to /api/chat.
// The prompt composer reads this to select and populate the right prompt block.

export interface SessionContext {
  /** Which mode the user is currently in */
  mode: AppMode;

  /** Active sub-mode — study mode only */
  subMode?: SubMode;

  /** The question currently displayed on screen */
  currentQuestion?: Question;

  /** Whether the user has already answered the current question */
  sessionAnswered?: boolean;

  /** Post-test review only — the full test result being reviewed */
  testResults?: TestResult;

  /** Logbook mode only — the words already in the user's log */
  learnedWords?: string[];
}

// ─── Test result ──────────────────────────────────────────────────────────────
//
// Written to the database after a test is submitted (Step 12).
// Also passed as context to the post-test review AI prompt.

export interface TestResult {
  totalQuestions: number;
  correct: number;
  vocabScore: number; // 0.0 – 1.0
  grammarScore: number; // 0.0 – 1.0
  readingScore: number; // 0.0 – 1.0
  durationSeconds: number;
  mistakes: Question[];
}

// ─── Drill result ─────────────────────────────────────────────────────────────
//
// Held in client state after a drill session completes (Step 10).
// Not persisted — only used for the inline results display.

export interface DrillResult {
  totalQuestions: number; // always 5
  correct: number;
  mistakes: Question[];
}
