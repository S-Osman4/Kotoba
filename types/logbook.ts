// types/logbook.ts
//
// Types for the logbook feature.
//
// LearnedWord mirrors the learnedWords database row exactly.
// LogEntry is the display-ready shape used by logbook components —
// furiganaMap is parsed from JSON string to object here so components
// never have to handle the raw string or a parse failure.
// LogbookStats is the aggregated summary shown in the stats row.

import type { FuriganaMap } from "./question";

// ─── Raw database row ─────────────────────────────────────────────────────────
// Matches LearnedWord from lib/db/schema.ts $inferSelect.
// furiganaMap is a JSON string as stored — parse before use.

export interface LearnedWordRaw {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  category: string;
  firstSentence: string | null;
  firstSentenceEn: string | null;
  furiganaMap: string | null; // JSON string — parse to FuriganaMap
  learnedAt: number | null; // unix ms
}

// ─── Display-ready entry ──────────────────────────────────────────────────────
// furiganaMap is parsed and defaulted. learnedAt is always a number.

export interface LogEntry {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  category: string; // 'vocabulary' | 'grammar' | 'kanji'
  firstSentence: string; // '' if null
  firstSentenceEn: string; // '' if null
  furiganaMap: FuriganaMap; // {} if null or malformed JSON
  learnedAt: number; // unix ms — guaranteed number
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface LogbookStats {
  total: number;
  today: number;
  streak: number;
  topCategory: string | null;
}

// ─── API response shape ───────────────────────────────────────────────────────

export interface LogbookResponse {
  entries: LearnedWordRaw[];
  stats: LogbookStats;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parses a furiganaMap JSON string.
 * Returns {} on null, empty string, or malformed JSON.
 * Never throws.
 */
export function parseFuriganaMap(raw: string | null | undefined): FuriganaMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as FuriganaMap;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Converts a LearnedWordRaw database row to a display-ready LogEntry.
 * Safe to call on any row — all nullable fields are defaulted.
 */
export function toLogEntry(raw: LearnedWordRaw): LogEntry {
  return {
    id: raw.id,
    word: raw.word,
    reading: raw.reading,
    meaning: raw.meaning,
    category: raw.category,
    firstSentence: raw.firstSentence ?? "",
    firstSentenceEn: raw.firstSentenceEn ?? "",
    furiganaMap: parseFuriganaMap(raw.furiganaMap),
    learnedAt: raw.learnedAt ?? Date.now(),
  };
}

/**
 * Groups LogEntry array by local calendar date string (YYYY-MM-DD).
 * Uses the user's local timezone — not UTC — so words learned near midnight
 * appear under the correct date for the user's location.
 * Returns entries in descending order (newest group first, newest entry first).
 */
export function groupByDate(
  entries: LogEntry[],
): { date: string; items: LogEntry[] }[] {
  const map = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.learnedAt).toLocaleDateString("en-CA"); // YYYY-MM-DD in local TZ
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(entry);
  }

  // Sort groups newest-first, entries within each group newest-first
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      items: [...items].sort((a, b) => b.learnedAt - a.learnedAt),
    }));
}

/**
 * Formats a date string (YYYY-MM-DD) into a human-readable label.
 * Returns 'Today', 'Yesterday', or a formatted date like 'Mon 12 May'.
 */
export function formatDateLabel(dateStr: string): string {
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString(
    "en-CA",
  );

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";

  // Parse as local date — avoid UTC shift by splitting manually
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}
