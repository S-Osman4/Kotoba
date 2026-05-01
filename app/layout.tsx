// app/layout.tsx
import type { Metadata } from 'next'
import { Noto_Serif_JP, Noto_Sans_JP, DM_Mono } from 'next/font/google'
import './globals.css'

// ─── Font loading ────────────────────────────────────────────────────────────
//
// next/font/google handles:
//   - downloading the font files at build time (no runtime requests to Google)
//   - injecting @font-face rules into the page
//   - exposing a CSS variable on whichever element receives the .variable class
//
// The `variable` name here MUST match what globals.css references in @theme:
//   --font-noto-serif-jp  →  var(--font-noto-serif-jp) in --font-serif
//   --font-noto-sans-jp   →  var(--font-noto-sans-jp)  in --font-sans
//   --font-dm-mono        →  var(--font-dm-mono)        in --font-mono

const notoSerif = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-noto-serif-jp',
})

const notoSans = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
})

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'kotoba — JLPT N5 study',
  description: 'A quiet JLPT N5 study app. Vocabulary, grammar, kanji, and reading.',
}

// ─── Root layout ─────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ja"
      // Attach all three font CSS variables to <html>.
      // Every element in the document tree inherits them.
      className={`${notoSerif.variable} ${notoSans.variable} ${dmMono.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  )
}