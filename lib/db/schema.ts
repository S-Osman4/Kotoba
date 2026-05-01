// lib/db/schema.ts
//
// All table definitions for kotoba.
// No users table — single user, no auth (see design doc §2.1).
//
// Drizzle's SQLite types used here:
//   sqliteTable  — creates a table definition
//   text         — VARCHAR / TEXT column
//   integer      — INTEGER column (also used for booleans and timestamps)
//   real         — REAL / FLOAT column (section scores stored as 0.0–1.0)
//   uniqueIndex  — creates a UNIQUE index (enforced at the database level)

import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ─── learnedWords ─────────────────────────────────────────────────────────────
//
// One row per word/particle/kanji the user has answered correctly.
// Populated by POST /api/progress after a correct answer.
//
// Duplicate handling: the unique index on `word` plus ON CONFLICT DO NOTHING
// means the first encounter is preserved. Later correct answers for the same
// word are silently ignored — the logbook records first encounters, not mastery.

export const learnedWords = sqliteTable(
  "learned_words",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // The Japanese word, particle, or kanji being logged.
    // e.g. '電車', 'を', '山'
    word: text("word").notNull(),

    // Hiragana reading of the word.
    // e.g. 'でんしゃ', 'やま'
    // Grammar particles store the particle itself; reading is an empty string.
    reading: text("reading").notNull(),

    // English meaning shown in the logbook.
    // e.g. 'train, electric train'
    meaning: text("meaning").notNull(),

    // Which sub-mode generated this entry.
    // One of: 'vocabulary' | 'grammar' | 'kanji'
    // Reading comprehension questions never write to this table.
    category: text("category").notNull(),

    // The Japanese sentence the word first appeared in (the question stem).
    // Shown in the logbook detail view as "first seen in".
    // Nullable — reading questions don't write here but we guard for it anyway.
    firstSentence: text("first_sentence"),

    // English translation of the first sentence.
    firstSentenceEn: text("first_sentence_en"),

    // JSON string mapping kanji characters to their readings.
    // e.g. '{"電車":"でんしゃ","中":"なか"}'
    // Parsed at read time by lib/utils/furigana.ts to render <ruby> tags.
    furiganaMap: text("furigana_map"),

    // Unix timestamp (milliseconds) when the word was first answered correctly.
    // Stored as INTEGER — JavaScript's Date.now() returns ms.
    learnedAt: integer("learned_at"),
  },
  // Second argument to sqliteTable: table-level constraints and indexes.
  (table) => [
    // UNIQUE constraint on the word column.
    // This is what makes ON CONFLICT DO NOTHING work correctly in queries.ts.
    // If two sessions answer the same word correctly, only the first row is kept.
    uniqueIndex("word_unique_idx").on(table.word),
  ],
);

// ─── testResults ──────────────────────────────────────────────────────────────
//
// One row per completed JLPT test session.
// Written by POST /api/progress (or a dedicated route in Step 12) after
// the user submits the test. Used by the results screen and post-test review.

export const testResults = sqliteTable("test_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Unix timestamp (ms) when the test was submitted.
  takenAt: integer("taken_at"),

  // How many seconds the test took (timer value at submission).
  durationSeconds: integer("duration_seconds"),

  // Total questions in this test session (always 20 for a full N5 test).
  totalQuestions: integer("total_questions"),

  // Number of correct answers.
  correct: integer("correct"),

  // Per-section scores as a ratio 0.0–1.0.
  // e.g. 0.8 = 80% correct in that section.
  // REAL maps to SQLite's floating-point type.
  vocabScore: real("vocab_score"),
  grammarScore: real("grammar_score"),
  readingScore: real("reading_score"),

  // JSON array of Question objects the user got wrong.
  // e.g. '[{"type":"vocabulary","stem":"...","correctIndex":2,...}]'
  // Used by the post-test review flow (Step 12) to walk through mistakes.
  mistakes: text("mistakes"),
});

// ─── sessionStats ─────────────────────────────────────────────────────────────
//
// One row per calendar day the user studies.
// Used to calculate the streak shown in the logbook stats row.
// A session is counted when the user answers at least one question.

export const sessionStats = sqliteTable("session_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Calendar date in the user's local timezone — YYYY-MM-DD string.
  // e.g. '2025-04-15'
  // Stored as text so we can query by exact date string without timezone math.
  date: text("date").notNull(),

  // Running count of words answered correctly today.
  wordsStudied: integer("words_studied").default(0),

  // Running count of all questions answered today (correct + incorrect).
  questionsAnswered: integer("questions_answered").default(0),

  // The streak value on this day.
  // Calculated at insert time: yesterday's streak + 1, or 1 if no yesterday row.
  streak: integer("streak").default(0),
});

// ─── TypeScript types inferred from the schema ────────────────────────────────
//
// Drizzle generates TypeScript types from the table definitions above.
// We export these so other files (queries.ts, API routes) can use them
// without manually writing duplicate type definitions.
//
// $inferSelect — the shape of a row read FROM the database
// $inferInsert — the shape of data written TO the database (id/defaults optional)

export type LearnedWord = typeof learnedWords.$inferSelect;
export type LearnedWordInsert = typeof learnedWords.$inferInsert;

export type TestResult = typeof testResults.$inferSelect;
export type TestResultInsert = typeof testResults.$inferInsert;

export type SessionStat = typeof sessionStats.$inferSelect;
export type SessionStatInsert = typeof sessionStats.$inferInsert;
