// components/question/FuriganaText.tsx
//
// Renders Japanese text with <ruby> furigana annotations.
//
// How it works:
//   Given text = '電車に乗ります' and furiganaMap = { '電車': 'でんしゃ', '乗': 'の' }
//   it produces:
//     <ruby>電車<rt>でんしゃ</rt></ruby>に<ruby>乗<rt>の</rt></ruby>ります
//
// Algorithm:
//   1. Sort furiganaMap keys longest-first to handle overlapping matches correctly.
//      Without this, '電車' might be split into '電' and '車' separately if both
//      are keys — longest match wins.
//   2. Walk through the text string. At each position, try each key in order.
//   3. If a key matches at this position, emit a <ruby> segment and advance
//      the cursor by the key's length.
//   4. If no key matches, emit the character as plain text and advance by 1.
//
// Props:
//   text        — the Japanese string to render
//   furiganaMap — maps kanji/compounds to their hiragana readings
//   className   — optional CSS classes applied to the wrapping <span>
//   rtClassName — optional CSS classes applied to every <rt> element
//                 (used to switch between anko-light and sakura colours per mode)

import type { FuriganaMap } from '@/types/question'

interface FuriganaTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    text: string;
    furiganaMap: FuriganaMap;
    className?: string;
    rtClassName?: string;
}

// A segment is either plain text or a ruby pair
type Segment =
    | { kind: 'text'; value: string }
    | { kind: 'ruby'; base: string; reading: string }

/**
 * Splits a Japanese string into text segments and ruby segments
 * based on the provided furigana map.
 */
function buildSegments(text: string, furiganaMap: FuriganaMap): Segment[] {
    // Sort keys longest-first so compound kanji (電車) are matched before
    // single kanji (電, 車) when both appear in the map.
    const keys = Object.keys(furiganaMap).sort((a, b) => b.length - a.length)

    const segments: Segment[] = []
    let i = 0

    while (i < text.length) {
        let matched = false

        for (const key of keys) {
            if (text.startsWith(key, i)) {
                segments.push({
                    kind: 'ruby',
                    base: key,
                    reading: furiganaMap[key],
                })
                i += key.length
                matched = true
                break
            }
        }

        if (!matched) {
            // No kanji key matched — emit this character as plain text.
            // Merge consecutive plain-text characters into one segment for cleaner output.
            const last = segments[segments.length - 1]
            if (last?.kind === 'text') {
                last.value += text[i]
            } else {
                segments.push({ kind: 'text', value: text[i] })
            }
            i++
        }
    }

    return segments
}

export default function FuriganaText({
    text,
    furiganaMap,
    className,
    rtClassName,
}: FuriganaTextProps) {
    // If the map is empty, render plain text — no ruby markup needed.
    const hasAnnotations = Object.keys(furiganaMap).length > 0

    if (!hasAnnotations) {
        return <span className={className}>{text}</span>
    }

    const segments = buildSegments(text, furiganaMap)

    return (
        <span className={className}>
            {segments.map((seg, index) => {
                if (seg.kind === 'text') {
                    return <span key={index}>{seg.value}</span>
                }

                return (
                    <ruby key={index}>
                        {seg.base}
                        <rt className={rtClassName}>{seg.reading}</rt>
                    </ruby>
                )
            })}
        </span>
    )
}