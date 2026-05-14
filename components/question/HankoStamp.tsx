// components/question/HankoStamp.tsx
//
// The hanko (判子) ink stamp shown after answering.
//
// Characters by context:
//   正 — correct answer (study / drill)
//   誤 — incorrect answer (study / drill)
//   合 — pass (drill results: 4–5 correct, test: ≥80%)
//   可 — borderline (drill results: 3 correct, test: ≥60%)
//   再 — retry (drill results: 0–2 correct, test: <60%)
//   完 — perfect (test: 20/20 only)
//
// The stamp is rotated –7deg in feedback contexts (per design doc §1.6).
// Size and rotation are configurable via props.

export type HankoCharacter = '正' | '誤' | '合' | '可' | '再' | '完' | '勉' | '語' | '印'

interface HankoStampProps {
  character: HankoCharacter
  /** Size of the stamp in px — default 48 */
  size?: number
  /** Rotation in degrees — default -7 */
  rotation?: number
  className?: string
}

// Per-character colour config
const CHARACTER_STYLES: Record<HankoCharacter, {
  border: string
  text: string
  bg: string
}> = {
  '正': {
    border: 'var(--color-sage)',
    text: 'var(--color-sage-deep)',
    bg: 'transparent',
  },
  '誤': {
    border: 'var(--color-wrong-accent)',  
    text: 'var(--color-wrong-text)',
    bg: 'transparent',
  },
  '合': {
    border: 'var(--color-sage)',
    text: 'var(--color-sage-deep)',
    bg: 'transparent',
  },
  '可': {
    border: 'var(--color-drill-ring)',
    text: 'var(--color-drill-accent)',
    bg: 'transparent',
  },
  '再': {
    border: 'var(--color-wrong-accent)',
    text: 'var(--color-wrong-text)',
    bg: 'transparent',
  },
  '完': {
    border: 'var(--color-sakura)',
    text: 'var(--color-sakura-deep)',
    bg: 'transparent',
  },
  '勉': {
    border: 'var(--color-sage)',
    text: 'var(--color-sage-deep)',
    bg: 'transparent',
  },
  '語': {
    border: 'var(--color-sage)',
    text: 'var(--color-sage-deep)',
    bg: 'transparent',
  },
  '印': {
    border: 'var(--color-sage)',
    text: 'var(--color-sage-deep)',
    bg: 'transparent',
  },
}

export default function HankoStamp({
  character,
  size = 48,
  rotation = -7,
  className = '',
}: HankoStampProps) {
  const styles = CHARACTER_STYLES[character]

  return (
    <div
      className={`inline-flex items-center justify-center flex-none ${className}`}
      style={{
        width: size,
        height: size,
        border: `2px solid ${styles.border}`,
        borderRadius: 4, // slight rounding — hanko stamps are square with soft corners
        color: styles.text,
        background: styles.bg,
        transform: `rotate(${rotation}deg)`,
        // Slight opacity reduction mimics ink that has partially dried
        opacity: 0.92,
      }}
      aria-label={`stamp: ${character}`}
      role="img"
    >
      <span
        className="font-serif font-semibold select-none"
        style={{ fontSize: size * 0.55 }}
      >
        {character}
      </span>
    </div>
  )
}