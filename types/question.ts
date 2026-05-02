// types/question.ts

export type QuestionType = "vocabulary" | "grammar" | "reading" | "kanji";
export type SubMode = "vocabulary" | "grammar" | "kanji" | "reading";

export interface FuriganaMap {
  [kanji: string]: string;
}

export interface Question {
  type: QuestionType;
  targetWord: string;
  targetReading: string;
  targetMeaning: string;
  stem: string;
  furiganaMap: FuriganaMap;
  instruction: string;
  passage: string;
  passageFurigana: FuriganaMap;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  memoryHook: string;
}

export function isValidQuestion(q: unknown): q is Question {
  if (!q || typeof q !== "object") return false;

  const candidate = q as Record<string, unknown>;

  const requiredStrings: (keyof Question)[] = [
    "targetWord",
    "targetMeaning",
    "stem",
    "instruction",
    "explanation",
    "passage",
    "memoryHook",
  ];
  for (const field of requiredStrings) {
    if (typeof candidate[field] !== "string") return false;
  }

  if (typeof candidate.targetReading !== "string") return false;

  const validTypes: QuestionType[] = ["vocabulary", "grammar", "reading", "kanji"];
  if (!validTypes.includes(candidate.type as QuestionType)) return false;

  if (!candidate.furiganaMap || typeof candidate.furiganaMap !== "object" || Array.isArray(candidate.furiganaMap))
    return false;

  if (!candidate.passageFurigana || typeof candidate.passageFurigana !== "object" || Array.isArray(candidate.passageFurigana))
    return false;

  if (!Array.isArray(candidate.choices)) return false;
  if (candidate.choices.length !== 4) return false;
  if (!candidate.choices.every((c) => typeof c === "string")) return false;

  const ci = candidate.correctIndex;
  if (typeof ci !== "number") return false;
  if (ci < 0 || ci > 3) return false;

  return true;
}