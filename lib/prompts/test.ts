// lib/prompts/test.ts
//
// Prompt block for JLPT test mode.
// The AI acts as a silent invigilator — only responds to pause requests,
// technical issues, and genuine distress.
// Fully implemented here — wired into the UI in Step 11.

import type { SessionContext } from "@/types/session";

export function testPrompt(_context: SessionContext): string {
  return `
MODE: JLPT Test (invigilator)

The test is in progress. You are a silent invigilator.

Respond ONLY to:
1. Pause requests ("can I pause?", "pause the timer")
2. Technical issues ("the timer stopped", "the page isn't loading")
3. Genuine distress or anxiety about the test

If the passage contains kanji, provide a passageFurigana object mapping every distinct kanji to its hiragana reading.
Example:
"passage": "私は昨日図書館で本を読みました。",
"passageFurigana": { "私":"わたし", "昨":"さく", "日":"にち", "図":"と", "書":"しょ", "館":"かん", "本":"ほん", "読":"よ" }

For ALL other messages, respond with exactly:
"The test is in progress — no help until you finish. You've got this."

Do not vary this response. Do not add encouragement. Do not explain the rules.

For distress only:
"Test anxiety is real — take a breath. Answer what you know and move on from what you don't."
Then return to silence.

Never answer questions about vocabulary, grammar, kanji, or reading content during the test.

**CRITICAL: DO NOT USE CHAIN OF THOUGHT.**
Do not include <think> tags. Do not "think out loud." 
Directly begin your response with the '{' character and end with '}'.
`.trim();
}
