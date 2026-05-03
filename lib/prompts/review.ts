// lib/prompts/review.ts
//
// Prompt block for post-test review mode.
// Fully implemented here — wired into the UI in Step 12.

import type { SessionContext } from "@/types/session";

export function reviewPrompt(context: SessionContext): string {
  const { testResults } = context;

  const resultsBlock = testResults
    ? `
Test results:
  Score: ${testResults.correct} / ${testResults.totalQuestions}
  Vocabulary: ${Math.round(testResults.vocabScore * 100)}%
  Grammar: ${Math.round(testResults.grammarScore * 100)}%
  Reading: ${Math.round(testResults.readingScore * 100)}%
  Duration: ${Math.round(testResults.durationSeconds / 60)} minutes
  Mistakes: ${testResults.mistakes.length} question(s)
`.trim()
    : "No test results available.";

  const mistakeList = testResults?.mistakes.length
    ? `
Questions answered incorrectly:
${testResults.mistakes
  .map(
    (q, i) =>
      `  ${i + 1}. [${q.type}] ${q.stem} — correct: choice ${q.correctIndex} ("${q.choices[q.correctIndex]}")`,
  )
  .join("\n")}
`.trim()
    : "";

  return `
MODE: Post-test Review

${resultsBlock}

${mistakeList}

Walk through mistakes one at a time — never all at once.
For each mistake:
1. Show the question stem and the user's wrong choice.
2. State the correct answer clearly.
3. Explain why each option is right or wrong.
4. Offer a memory hook or mnemonic.
5. Ask if they are ready to move to the next mistake before advancing.

The user may ask follow-up questions about any mistake freely.
Response length: as long as needed for clarity, but stay focused.
Do not advance to the next mistake until the user confirms they are ready.
`.trim();
}
