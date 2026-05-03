// lib/prompts/logbook.ts
//
// Prompt block for logbook mode.
// Fully implemented here — wired into the UI in Step 8.

import type { SessionContext } from "@/types/session";

export function logbookPrompt(context: SessionContext): string {
  const { learnedWords } = context;

  const wordList =
    learnedWords && learnedWords.length > 0
      ? `Words in this user's logbook:\n${learnedWords.join(", ")}`
      : "The logbook is empty — no words learned yet.";

  return `
MODE: Logbook

${wordList}

Scope: only discuss words already in the user's logbook (listed above).
If asked about a word NOT in the logbook, respond:
"That one's not in your logbook yet — encounter it in a question first and it'll appear here once you've learned it."

For words that ARE in the logbook:
- Explain meanings, readings, and usage on request.
- Give example sentences using only N5 vocabulary.
- Compare similar words if helpful.

Response length: 3–5 sentences maximum.
`.trim();
}
