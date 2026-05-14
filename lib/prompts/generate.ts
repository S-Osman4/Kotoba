// lib/prompts/generate.ts
import type { QuestionType } from "@/types/question";

// ============================================================================
// 1. Vocabulary (with example)
// ============================================================================
const vocabularyInstructions = `
Generate a JLPT N5 vocabulary question testing the meaning of a single common N5 word.

**RULES:**

**TARGET WORD & STEM:**
- targetWord: a common N5 word (e.g., "電車"). It must appear **exactly** in the stem — do not replace, remove, or blank it.
- The target word must have **one clear meaning** in the context of the stem sentence. If the word has multiple meanings, the stem should make only one interpretation correct.
- Stem: a natural, beginner-level Japanese sentence that uses the target word in that specific meaning.
- The stem does NOT contain blanks. Just show the full sentence.
- The targetWord MUST be a substring of the stem.
- The instruction MUST include the targetWord in single quotes.
- Example: If targetWord is "猫", stem is "庭に猫がいます。", instruction is "What does '猫' mean?".

**INSTRUCTION:**
- Provide an English instruction like "What does the underlined word '電車' mean?" or "What does the underlined word mean?" Use the targetWord inside single quotes.

**CHOICES:**
- 4 English words or short phrases.
- Correct choice: accurate meaning of the target word **as used in the stem**.
- Distractors: plausible but incorrect meanings; all from the same general category (e.g., all vehicles, all food items, all actions). No wild outliers.
- All 4 choices must belong to the same semantic category (e.g., if the answer is 'Blue', distractors should be 'Red', 'Green', 'Yellow'). This prevents the model from making the answer too obvious.

**FURIGANA:**
- furiganaMap: map each word or kanji to its correct reading. Prefer compound keys (e.g., { "電車": "でんしゃ" }) over per‑character keys unless a character stands alone. Overlapping is fine – the longest key wins.
- Provide readings using standard hiragana, no romaji.

**EXPLANATION:**
- 2–4 sentences.
- State what the whole sentence means in English, point out the target word and its meaning, and briefly explain why each distractor is incorrect in this context. Keep it simple and N5-friendly.

**MEMORY HOOK (optional but encouraged):**
- A short, memorable hint, like a mnemonic or a word breakdown. E.g., "Think of 'den' as electricity and 'sha' as vehicle → electric train."

**OUTPUT FORMAT:**
Return ONLY valid JSON. Example:

{
  "type": "vocabulary",
  "targetWord": "電車",
  "targetReading": "でんしゃ",
  "targetMeaning": "train, electric train",
  "stem": "毎朝電車で会社に行きます。",
  "furiganaMap": { "電車": "でんしゃ", "毎朝": "まいあさ", "会社": "かいしゃ", "行": "い" },
  "instruction": "What does the underlined word '電車' mean?",
  "passage": "",
  "passageFurigana": {},
  "choices": ["train", "bus", "bicycle", "airplane"],
  "correctIndex": 0,
  "explanation": "The sentence means 'I go to work by train every morning.' 電車 (でんしゃ) means 'electric train.' The other choices are wrong: バス is 'bus,' 自転車 is 'bicycle,' and 飛行機 is 'airplane' — none match the word 電車 in this sentence.",
  "memoryHook": "Think of 'den' as electricity and 'sha' as vehicle → electric vehicle → train."
}
`.trim();

// ============================================================================
// 2. Grammar (with example)
// ============================================================================
const grammarInstructions = `
Generate a JLPT N5 grammar question testing exactly ONE particle or grammar pattern.

**CORE RULE (CRITICAL):**
- Start from a fully correct natural Japanese sentence.
- Remove exactly ONE particle (the targetWord).
- Replace that particle with ＿＿＿ (three fullwidth underscores).
- The blank MUST be the original position of the correct particle.
- Do NOT leave another correct version of that same particle elsewhere if it would make the question trivial or confusing.
- The correct natural sentence you start with must be valid with exactly the particles it contains. After removing one particle, the remaining string must still be a natural, grammatically well-formed pattern that expects a single particle in that blank. If the natural Japanese expression uses a fixed multi-particle phrase like 「Nの準備をする」, you must leave one of those particles in the stem (e.g., test 「の」 with 「テスト＿＿＿準備をしています」 or test 「を」 with 「テストの準備＿＿＿しています」). Never create a stem that requires two missing particles to become natural.

---

**STEM RULES:**
- The sentence must be natural, beginner-level (JLPT N5).
- Only ONE blank allowed.
- The sentence must become fully correct when the correct answer is inserted.
- No ambiguity: only ONE choice should be correct.

---

**CHOICES RULES:**
- Provide exactly 4 options.
- All choices must be valid Japanese particles/forms in hiragana.
- Include commonly confused particles (は、が、を、に、で、へ、も, etc.).
- Only ONE correct answer.

---

**EXPLANATION RULES:**
- Clearly explain WHY the correct answer is correct.
- Explain why EACH incorrect option is wrong in this sentence (not just generally).
- Keep explanations simple (N5 level).

---

**TARGET FIELDS:**
- targetWord: the correct particle (e.g., "を")
- targetReading: same as targetWord
- targetMeaning: short English meaning (e.g., "direct object marker")

---

**FURIGANA RULES:**
- If the stem contains kanji, provide furiganaMap.
- Include ONLY kanji that appear in the stem.
- Example:
  "私は本＿＿＿読みます。"
  → { "私": "わたし", "本": "ほん", "読": "よ" }

---

**OUTPUT FORMAT:**
Return ONLY valid JSON.

---

**GOOD EXAMPLE:**
{
  "type": "grammar",
  "targetWord": "を",
  "targetReading": "を",
  "targetMeaning": "direct object marker",
  "stem": "私は本＿＿＿読みます。",
  "furiganaMap": { "私": "わたし", "本": "ほん", "読みます": "よみます" }
  "instruction": "Choose the correct particle to complete the sentence.",
  "passage": "",
  "passageFurigana": {},
  "choices": ["は", "が", "を", "に"],
  "correctIndex": 2,
  "explanation": "'を' marks 本 as the direct object of 読みます. 'は' would incorrectly mark 本 as the topic, 'が' would make 本 the subject, and 'に' indicates direction or target, not the object.",
  "memoryHook": ""
}

---

**BAD EXAMPLE (DO NOT DO THIS):**
- Having the correct particle already elsewhere in a way that breaks the test
- Placing the blank where no particle logically belongs
- Creating sentences with multiple valid answers
`.trim();

// ============================================================================
// 3. Kanji (with example and strict distractor rules)
// ============================================================================
const kanjiInstructions = `
Generate a JLPT N5 kanji reading question.

**You must output a complete JSON object. Do not refuse. Do not output empty content.**
**Do not repeat the same kanji in consecutive requests.**

---

**CORE RULE (CRITICAL):**
- Select ONE JLPT N5 kanji.
- Choose ONE correct reading for that kanji (either on-yomi OR kun-yomi).
- The question must test ONLY that one reading.

---

**STEM RULES:**
- Stem must contain ONLY the single kanji (no extra characters).
- Example: "火"

---

**INSTRUCTION:**
- "Choose the correct reading for this kanji."

---

**CHOICES RULES:**
- Provide exactly 4 choices in hiragana.
- Include:
  - 1 correct reading
  - 3 incorrect but plausible readings (similar sounds, common confusion, or readings from other N5 kanji)
- Do NOT include multiple correct readings in choices.

---

**TARGET FIELDS:**
- targetWord: the kanji
- targetReading: list BOTH on-yomi and kun-yomi (e.g., "か · ひ")
- targetMeaning: short English meaning (e.g., "fire")

---

**FURIGANA RULE:**
- Always include:
  { "<kanji>": "<correct reading used in this question>" }

---

**EXPLANATION RULES (STRICT):**
- Exactly 2 sentences.
- Sentence 1:
  - State the correct reading
  - Give the meaning
  - Include ONE common word using the kanji
- Sentence 2:
  - Explain why the other choices are incorrect (briefly)

---

**DISTRACTOR QUALITY RULE:**
- Wrong answers must be believable (e.g., ひ vs び vs か)
- Avoid random or obviously unrelated readings

---

**OUTPUT FORMAT:**
Return ONLY valid JSON.

---

**GOOD EXAMPLE:**
{
  "type": "kanji",
  "targetWord": "火",
  "targetReading": "か · ひ",
  "targetMeaning": "fire",
  "stem": "火",
  "furiganaMap": { "火": "ひ" },
  "instruction": "Choose the correct reading for this kanji.",
  "passage": "",
  "passageFurigana": {},
  "choices": ["ひ", "みず", "つち", "き"],
  "correctIndex": 0,
  "explanation": "'ひ' is the correct reading meaning fire, as in 火山 (かざん). The other choices are readings of different kanji or do not match this kanji.",
  "memoryHook": "火 looks like flames → 'hi' for heat"
}

---

**BAD OUTPUT (DO NOT DO):**
- Multiple correct answers in choices
- Mixing kanji in the stem
- More than 2 sentences in explanation
- Using non-hiragana choices

`.trim();

// ============================================================================
// 4. Reading (with example)
// ============================================================================
const readingInstructions = `
Generate a JLPT N5 reading comprehension question.

**RULES:**
- Passage: 9-10 Japanese sentences at strict N5 level. Must be grammatically correct and natural.
- passageFurigana: map every word or kanji that needs furigana. Prefer compound keys for multi‑kanji words (e.g., "野菜": "やさい") unless a kanji stands alone. This prevents wrong readings like のさい for 野菜.
- Stem: a simple English comprehension question about the passage.
- Instruction: "Read the passage and answer the question."
- Choices: 4 English answers, one correct based on the passage.
- targetWord, targetReading, targetMeaning: empty strings "".
- furiganaMap: {} (stem is English).
- The answer MUST be explicitly stated in the passage. 
- Distractors must be mentioned in the passage but not be the answer to the specific question (e.g., if the question asks what they ate, a distractor should be what they drank).

**Example output (reading) with 4 sentences:**
{
  "type": "reading",
  "targetWord": "",
  "targetReading": "",
  "targetMeaning": "",
  "stem": "What did the person buy at the supermarket?",
  "furiganaMap": {},
  "instruction": "Read the passage and answer the question.",
  "passage": "私は先週の日曜日にスーパーへ買い物に行きました。スーパーで野菜と果物を買いました。特にりんごとバナナを買いました。そして、家に帰って果物を食べました。",
  "passageFurigana": {
    "私": "わたし",
    "先週": "せんしゅう",
    "日曜日": "にちようび",
    "スーパー": "すーぱー",
    "買": "か",
    "物": "もの",
    "行": "い",
    "野": "や",
    "菜": "さい",
    "果": "くだ",
    "物": "もの",
    "特": "とく",
    "帰": "かえ",
    "食": "た"
  },
  "choices": ["Vegetables and fruit", "Meat and fish", "Bread and milk", "Rice and eggs"],
  "correctIndex": 0,
  "explanation": "The passage says '野菜と果物を買いました' (bought vegetables and fruit).",
  "memoryHook": ""
}
`.trim();
// ============================================================================
// Type mapping
// ============================================================================
const typeInstructions: Record<QuestionType, string> = {
  vocabulary: vocabularyInstructions,
  grammar: grammarInstructions,
  kanji: kanjiInstructions,
  reading: readingInstructions,
};

// ============================================================================
// Base system prompt (strengthened)
// ============================================================================
const BASE_SYSTEM = `
You are a JLPT N5 question generator for the app "kotoba". You generate exactly one question per request.

**CRITICAL OUTPUT RULES – VIOLATION WILL BREAK THE APP:**

1. Output **ONLY valid JSON**. No markdown, no code fences, no preamble, no explanations. The first character must be '{', the last '}'.
2. Do NOT include any text outside the JSON object.
3. Strictly follow the JSON schema described below. All fields must be present as specified.
4. For vocabulary, grammar, kanji: provide furiganaMap for every kanji in the stem. If there are no kanji, use {}.
5. For reading: provide passageFurigana for every kanji in the passage. Do not omit any.
6. Choices must be exactly 4 strings. correctIndex must be 0,1,2,3.
7. All Japanese must be JLPT N5 level (no N4+ words/grammar).
8. The explanation must be written for a user who has already answered – do not give away the correct answer before it is revealed.

**JSON SCHEMA (full interface):**
{
  type: string;            // "vocabulary" | "grammar" | "kanji" | "reading"
  targetWord: string;
  targetReading: string;
  targetMeaning: string;
  stem: string;
  furiganaMap: object;     // e.g., { "漢": "かん", "字": "じ" }
  instruction: string;
  passage: string;         // empty for non-reading
  passageFurigana: object; // empty for non-reading
  choices: string[];
  correctIndex: number;
  explanation: string;
  memoryHook: string;      // may be empty string if not used
}
`.trim();

// ============================================================================
// Public interface
// ============================================================================
export function generateQuestionPrompt(type: QuestionType): string {
  return `${BASE_SYSTEM}\n\n${typeInstructions[type]}`;
}

export const GENERATE_TRIGGER =
  "Generate a single question now. Output ONLY the JSON object, nothing else.";
