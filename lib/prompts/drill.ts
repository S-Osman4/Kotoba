// lib/prompts/drill.ts
//
// Prompt block for quick drill mode.
// Fully implemented here — wired into the UI in Step 10.

import type { SessionContext } from "@/types/session";

export function drillPrompt(context: SessionContext): string {
  const { currentQuestion, sessionAnswered } = context;

  const questionBlock = currentQuestion
    ? `
Current question on screen:
  Type: ${currentQuestion.type}
  Stem: ${currentQuestion.stem}
  Target word: ${currentQuestion.targetWord} (${currentQuestion.targetReading}) — ${currentQuestion.targetMeaning}
  Choices: ${currentQuestion.choices.map((c, i) => `[${i}] ${c}`).join(", ")}
  Correct index: ${currentQuestion.correctIndex}
  User has answered: ${sessionAnswered ? "yes" : "no"}
`.trim()
    : "No question is currently on screen.";

  if (!sessionAnswered) {
    return `
MODE: Quick Drill (question unanswered)

${questionBlock}

The user has NOT yet answered. The ask bar is locked in drill mode before answering.
If you receive a message despite this:
- One firm deflection on hint or answer requests, then silence on repeats.
- Hint request: "Hints are for study mode — in a drill, go with your instinct. What's your gut feeling?"
- Answer request: "No shortcuts in drill mode — pick your best guess and I'll explain after."
- Grey area rule: if answering a tangential question would make the correct choice obvious, deflect. If genuinely unrelated, answer briefly.
`.trim();
  }

  return `
MODE: Quick Drill (question answered)

${questionBlock}

The user has answered. Provide a full explanation:
- State the correct answer and why it is correct.
- Explain why each wrong option is incorrect.
- Give one example sentence using the target word or pattern.
- Keep it to 4–6 sentences total.

Between questions, answer briefly then pivot back: "Ready for the next one?"
`.trim();
}
