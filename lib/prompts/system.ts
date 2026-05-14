// lib/prompts/system.ts
//
// Composes the full system prompt sent to the AI tutor on every chat request.
//
// Architecture:
//   base prompt (always present)
//   + mode-specific block (selected from context.mode)
//   = final system prompt string
//
// The base establishes the tutor's identity and hard constraints.
// Each mode block adds the rules specific to that context.

import type { SessionContext } from "@/types/session";
import { studyPrompt } from "./study";
import { drillPrompt } from "./drill";
import { testPrompt } from "./test";
import { reviewPrompt } from "./review";
import { logbookPrompt } from "./logbook";

// ─── Base prompt ──────────────────────────────────────────────────────────────
//
// Injected before every mode block.
// These constraints are non-negotiable across all modes.

const BASE_PROMPT = `
You are 先生, the AI tutor for kotoba — a JLPT N5 study app.

Hard rules that apply in every mode:
- Only discuss JLPT N5 content. Never engage with topics above N5 level.
- Always respond in English unless the user writes to you in Japanese.
- Naturalness: Sentences must sound like something a native speaker would say, not "textbook Japanese."
- Consistency: The 'targetReading' and 'furiganaMap' must match perfectly.
- Keep responses concise — 3 to 5 sentences maximum unless in post-test review mode.
- Never mention which AI model or provider powers this app.
- Never refer to yourself as Claude, GPT, Gemini, or any other AI product name.
- You are 先生. That is your only identity in this context.

**FIELD GUIDANCE:**
- 'targetReading': For Vocabulary/Grammar, this is the reading of the target word. For Kanji, provide "On-yomi ・ Kun-yomi".
- 'explanation': Start by translating the stem, then explain the grammar/vocab point.
`.trim();

// ─── Mode block selector ──────────────────────────────────────────────────────

function selectModeBlock(context: SessionContext): string {
  switch (context.mode) {
    case "study":
      return studyPrompt(context);
    case "drill":
      return drillPrompt(context);
    case "test":
      return testPrompt(context);
    case "review":
      return reviewPrompt(context);
    case "logbook":
      return logbookPrompt(context);
    default:
      return studyPrompt(context);
  }
}

// ─── Public interface ─────────────────────────────────────────────────────────

/**
 * Assembles the complete system prompt for a chat request.
 *
 * @param context - The session context attached to the request.
 *   Must include at minimum { mode }.
 *   Other fields are optional and enrich the prompt when present.
 * @returns A single string suitable for the `system` field of an AI request.
 */
export function composeSystemPrompt(context: SessionContext): string {
  const base = BASE_PROMPT;
  const modeBlock = selectModeBlock(context);

  return [base, modeBlock].join("\n\n");
}
