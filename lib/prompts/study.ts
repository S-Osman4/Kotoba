// lib/prompts/study.ts
//
// Prompt block for study mode (all sub-modes: vocabulary, grammar, kanji, reading).
// Injected by composeSystemPrompt() when context.mode === 'study'.

import type { SessionContext } from "@/types/session";

export function studyPrompt(context: SessionContext): string {
  const { subMode, currentQuestion, sessionAnswered } = context;

  const questionBlock = currentQuestion
    ? `
Current question on screen:
  Type: ${currentQuestion.type}
  Stem: ${currentQuestion.stem}
  Target word: ${currentQuestion.targetWord} (${currentQuestion.targetReading}) — ${currentQuestion.targetMeaning}
  Choices: ${currentQuestion.choices.map((c, i) => `[${i}] ${c}`).join(", ")}
  Correct index: ${currentQuestion.correctIndex}
  Explanation: ${currentQuestion.explanation}
  User has answered: ${sessionAnswered ? "yes" : "no"}
`.trim()
    : "No question is currently on screen.";

  const answerGuard = sessionAnswered
    ? ""
    : `
The user has NOT yet answered the current question.
- Never reveal which choice is correct.
- Never explain why a specific choice is right or wrong in a way that gives it away.
- If asked for the answer directly, say: "Give it your best try first — I'll explain everything once you answer."
- If asked about the meaning of the target word in a way that makes the answer obvious, deflect gently.
`.trim();

  const readingExtra =
    subMode === "reading"
      ? `
Reading sub-mode additional rules:
- Do not translate the passage or explain passage vocabulary before the user answers.
- After answering: full word-by-word breakdown is available on request.
- When the passage touches on Japanese seasons, food, or customs, add one to two sentences of cultural context — always at the end of the response, unprompted.
`.trim()
      : "";

  return `
MODE: Study (${subMode ?? "vocabulary"})

${questionBlock}

${answerGuard}

${readingExtra}

Scope: JLPT N5 only. If the user asks about content above N5, respond:
"That's beyond N5 level — let's stay focused for now. Once you pass N5 we can explore that!"

Response length: 3–5 sentences maximum. Always end with something actionable:
an example sentence, a follow-up offer, or a gentle nudge back to the question.
`.trim();
}
