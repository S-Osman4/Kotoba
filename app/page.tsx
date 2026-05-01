// app/page.tsx
// TEMPORARY — verification page for Step 1.
// Delete and replace in Step 5 (study mode screen).

export default function Home() {
  return (
    <main className="min-h-screen bg-paper p-8">

      {/* ── App wordmark ── */}
      <div className="mb-10">
        <span className="font-serif text-4xl text-sakura-deep font-semibold">
          語
        </span>
        <span className="font-serif text-xl text-anko ml-3">
          kotoba
        </span>
      </div>

      {/* ── Typography check ── */}
      <section className="mb-8 space-y-2">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Typography
        </h2>
        <p className="font-serif text-4xl text-anko">
          日本語テスト — Noto Serif JP 400
        </p>
        <p className="font-serif text-4xl font-semibold text-anko">
          日本語テスト — Noto Serif JP 600
        </p>
        <p className="font-sans text-md text-anko">
          日本語テスト — Noto Sans JP 400
        </p>
        <p className="font-sans text-md font-medium text-anko">
          日本語テスト — Noto Sans JP 500
        </p>
        <p className="font-mono text-base text-anko">
          でんしゃ · 0123 — DM Mono 400
        </p>
        <p className="font-mono text-base font-medium text-anko">
          でんしゃ · 0123 — DM Mono 500
        </p>
      </section>

      {/* ── Sakura palette ── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Sakura palette
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { cls: 'bg-sakura', label: 'sakura' },
            { cls: 'bg-sakura-deep', label: 'sakura-deep' },
            { cls: 'bg-sakura-mid', label: 'sakura-mid' },
            { cls: 'bg-sakura-soft', label: 'sakura-soft' },
            { cls: 'bg-sakura-pale', label: 'sakura-pale' },
            { cls: 'bg-sakura-wash', label: 'sakura-wash' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded border border-paper-3 ${cls}`} />
              <span className="font-mono text-xs text-anko-mid">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sage palette ── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Sage palette
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { cls: 'bg-sage', label: 'sage' },
            { cls: 'bg-sage-deep', label: 'sage-deep' },
            { cls: 'bg-sage-mid', label: 'sage-mid' },
            { cls: 'bg-sage-pale', label: 'sage-pale' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded border border-paper-3 ${cls}`} />
              <span className="font-mono text-xs text-anko-mid">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Anko / paper palettes ── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Anko + paper palette
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { cls: 'bg-anko', label: 'anko' },
            { cls: 'bg-anko-mid', label: 'anko-mid' },
            { cls: 'bg-anko-light', label: 'anko-light' },
            { cls: 'bg-paper', label: 'paper' },
            { cls: 'bg-paper-2', label: 'paper-2' },
            { cls: 'bg-paper-3', label: 'paper-3' },
            { cls: 'bg-paper-4', label: 'paper-4' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded border border-paper-3 ${cls}`} />
              <span className="font-mono text-xs text-anko-mid">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Slate + drill palettes ── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Slate (test) + drill palette
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { cls: 'bg-slate', label: 'slate' },
            { cls: 'bg-slate-2', label: 'slate-2' },
            { cls: 'bg-slate-3', label: 'slate-3' },
            { cls: 'bg-slate-4', label: 'slate-4' },
            { cls: 'bg-slate-5', label: 'slate-5' },
            { cls: 'bg-drill', label: 'drill' },
            { cls: 'bg-drill-spine', label: 'drill-spine' },
            { cls: 'bg-drill-ring', label: 'drill-ring' },
            { cls: 'bg-drill-border', label: 'drill-border' },
            { cls: 'bg-drill-accent', label: 'drill-accent' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded border border-paper-3 ${cls}`} />
              <span className="font-mono text-xs text-anko-mid">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Wrong answer colour ── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Wrong answer
        </h2>
        <div
          className="inline-block px-4 py-2 rounded font-sans text-md font-medium"
          style={{
            backgroundColor: '#FCEBEB',
            borderColor: '#F09595',
            color: '#501313',
            border: '1px solid #F09595',
          }}
        >
          誤 — incorrect answer state
        </div>
      </section>

      {/* ── Furigana check ── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Furigana (ruby tag)
        </h2>
        <p className="font-serif text-3xl text-anko">
          <ruby>電車<rt>でんしゃ</rt></ruby>に
          <ruby>乗<rt>の</rt></ruby>ります。
        </p>
        <p className="font-sans text-md text-anko-mid mt-1">
          rt renders at ~0.6em in Noto Sans JP — should be ~8–9px at text-3xl
        </p>
      </section>

      {/* ── Notebook lines utility ── */}
      <section className="mb-8">
        <h2 className="font-mono text-xs text-anko-light uppercase tracking-widest mb-3">
          Notebook lines utility
        </h2>
        <div
          className="notebook-lines h-32 w-full max-w-md rounded border border-paper-3 bg-paper"
        />
        <p className="font-sans text-xs text-anko-light mt-1">
          Horizontal ruled lines every 20px — paper-3 colour
        </p>
      </section>

    </main>
  )
}