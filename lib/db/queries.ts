// lib/db/queries.ts
//
// Typed query helpers. API routes import from here — never write raw
// Drizzle queries inside route handlers.
//
// Implemented now (needed for Step 7+):
//   saveLearnedWord  — inserts a word with ON CONFLICT DO NOTHING
//   getLogbook       — returns all learned words newest-first
//   getLogbookStats  — aggregated counts for the stats row
//
// Stubbed (implemented in their respective steps):
//   saveTestResult   — Step 12
//   updateSessionStats — Step 7

import { desc, eq, sql } from "drizzle-orm";
import { db } from "./client";
import {
  learnedWords,
  testResults,
  sessionStats,
  type LearnedWordInsert,
  type TestResultInsert,
  type LearnedWord,
} from "./schema";

// ─── learnedWords ─────────────────────────────────────────────────────────────

/**
 * Saves a learned word to the database.
 *
 * Uses ON CONFLICT DO NOTHING so that if the user answers the same word
 * correctly a second time, the original first-encounter row is preserved
 * and no error is thrown.
 *
 * Returns true if the row was inserted, false if it already existed.
 */
export async function saveLearnedWord(
  entry: LearnedWordInsert,
): Promise<boolean> {
  const result = await db
    .insert(learnedWords)
    .values(entry)
    .onConflictDoNothing();

  // Drizzle's onConflictDoNothing returns the inserted row count in `rowsAffected`.
  // 1 = inserted, 0 = conflict (already existed).
  return (result.rowsAffected ?? 0) > 0;
}

/**
 * Returns all learned words, newest first.
 * Used by the logbook list view.
 */
export async function getLogbook(): Promise<LearnedWord[]> {
  return db.select().from(learnedWords).orderBy(desc(learnedWords.learnedAt));
}

/**
 * Returns aggregated stats for the logbook stats row:
 *   total  — total words learned
 *   today  — words learned today (calendar day in user's local timezone)
 *   streak — current streak from the most recent session_stats row
 *   topCategory — the category with the most words
 */
export async function getLogbookStats(todayDate: string): Promise<{
  total: number;
  today: number;
  streak: number;
  topCategory: string | null;
}> {
  // Total words
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(learnedWords);

  const total = totalResult[0]?.count ?? 0;

  // Words learned today
  const todayResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(learnedWords)
    .where(
      // learnedAt is stored as unix ms — compare against start of today
      sql`date(${learnedWords.learnedAt} / 1000, 'unixepoch') = ${todayDate}`,
    );

  const today = todayResult[0]?.count ?? 0;

  // Current streak — from the most recent session_stats row
  const streakResult = await db
    .select({ streak: sessionStats.streak })
    .from(sessionStats)
    .orderBy(desc(sessionStats.date))
    .limit(1);

  const streak = streakResult[0]?.streak ?? 0;

  // Top category — which type has the most entries
  const categoryResult = await db
    .select({
      category: learnedWords.category,
      count: sql<number>`count(*) as count`,
    })
    .from(learnedWords)
    .groupBy(learnedWords.category)
    .orderBy(desc(sql`count`))
    .limit(1);

  const topCategory = categoryResult[0]?.category ?? null;

  return { total, today, streak, topCategory };
}

// ─── sessionStats ─────────────────────────────────────────────────────────────

/**
 * Upserts today's session stats row and recalculates the streak.
 * Called by POST /api/progress after a correct answer.
 *
 * Logic:
 *   - If today's row exists: increment questionsAnswered and wordsStudied
 *   - If no row yet today: check yesterday. If yesterday exists, streak = yesterday + 1.
 *     Otherwise streak = 1. Insert new row.
 */
export async function updateSessionStats(options: {
  wordStudied: boolean; // true = correct answer, false = incorrect
}): Promise<void> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .split("T")[0];

  const todayRow = await db
    .select()
    .from(sessionStats)
    .where(eq(sessionStats.date, today))
    .limit(1);

  if (todayRow.length > 0) {
    // Already have a row for today — just increment counters
    await db
      .update(sessionStats)
      .set({
        questionsAnswered: sql`${sessionStats.questionsAnswered} + 1`,
        wordsStudied: options.wordStudied
          ? sql`${sessionStats.wordsStudied} + 1`
          : sessionStats.wordsStudied,
      })
      .where(eq(sessionStats.date, today));
    return;
  }

  // First activity of the day — check yesterday for streak continuity
  const yesterdayRow = await db
    .select({ streak: sessionStats.streak })
    .from(sessionStats)
    .where(eq(sessionStats.date, yesterday))
    .limit(1);

  const newStreak =
    yesterdayRow.length > 0 ? (yesterdayRow[0].streak ?? 0) + 1 : 1;

  await db.insert(sessionStats).values({
    date: today,
    questionsAnswered: 1,
    wordsStudied: options.wordStudied ? 1 : 0,
    streak: newStreak,
  });
}

// ─── testResults ──────────────────────────────────────────────────────────────

/**
 * Saves a completed test result.
 * Implemented in Step 12 — stub present so imports don't break.
 */
export async function saveTestResult(entry: TestResultInsert): Promise<void> {
  await db.insert(testResults).values(entry);
}

/**
 * Returns the most recent test result.
 * Used by the post-test results screen.
 * Implemented in Step 12.
 */
export async function getLatestTestResult() {
  const rows = await db
    .select()
    .from(testResults)
    .orderBy(desc(testResults.takenAt))
    .limit(1);

  return rows[0] ?? null;
}

export async function getAllTestResults() {
  return db.select().from(testResults).orderBy(desc(testResults.takenAt));
}
