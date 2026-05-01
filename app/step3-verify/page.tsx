// app/step3-verify/page.tsx
"use client";
import NotebookCard from '@/components/question/NotebookCard'
import NotebookSkeleton from '@/components/question/NotebookSkeleton'
import NotebookError from '@/components/question/NotebookError'
import FuriganaText from '@/components/question/FuriganaText'

export default function Step3Verify() {
    const sampleMap = {
        '電車': 'でんしゃ',
        '乗': 'の',
        '毎日': 'まいにち',
    }

    return (
        <main className="min-h-screen bg-paper p-6 sm:p-10 space-y-10">

            <h1 className="font-mono text-xs text-anko-light uppercase tracking-widest">
                Step 3 verification — notebook card variants
            </h1>

            {/* ── FuriganaText ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">FuriganaText</h2>
                <FuriganaText
                    text="電車に毎日乗ります。"
                    furiganaMap={sampleMap}
                    className="font-serif text-3xl text-anko notebook-stem]"
                />
                <FuriganaText
                    text="電車に毎日乗ります。"
                    furiganaMap={sampleMap}
                    className="font-serif text-3xl text-anko notebook-stem"
                    rtClassName="text-sakura"
                />
            </section>

            {/* ── Study variant (2 shadow layers) ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">Study — 2 shadows</h2>
                <NotebookCard variant="study" shadowLayers={2}>

                    {/* Stem — notebook-stem gives line-height:2 so furigana has room
        and the text baseline sits on the ruled line */}
                    <FuriganaText
                        text="電車に毎日乗ります。"
                        furiganaMap={sampleMap}
                        className="font-serif text-2xl text-anko block notebook-stem"
                    />

                    {/* Instruction — sits in its own 36px row */}
                    <p className="font-sans text-md text-anko-mid h-9 flex items-center">
                        What does 電車 mean?
                    </p>

                    {/* Choices — no gap between them.
        Each choice is exactly h-9 (36px) = one ruled line cell.
        flex items-center vertically centres the label within the cell.
        The bottom border of each choice lands on a ruled line. */}
                    <div>
                        {['train', 'bicycle', 'airplane', 'bus'].map((c) => (
                            <div
                                key={c}
                                className="
            h-9 flex items-center px-4 rounded
            border border-paper-3 bg-anko-light
            font-sans text-md text-anko first:border-t
            
          "
                            >
                                {c}
                            </div>
                        ))}
                    </div>

                </NotebookCard>
            </section>

            {/* ── Study variant (0 shadows — last question) ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">Study — 0 shadows (last question)</h2>
                <NotebookCard variant="study" shadowLayers={0}>
                    <p className="font-serif text-2xl text-anko ">Last question in set</p>
                </NotebookCard>
            </section>

            {/* ── Drill variant ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">Drill — amber palette</h2>
                <NotebookCard variant="drill" shadowLayers={2}>
                    <FuriganaText
                        text="毎日電車に乗ります。"
                        furiganaMap={sampleMap}
                        className="font-serif text-2xl text-anko block notebook-stem mb-11.25"
                    />
                    <p className="font-sans text-md text-anko-mid ">Quick drill question</p>
                </NotebookCard>
            </section>

            {/* ── Test variant ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">Test — dark slate</h2>
                <div className="bg-slate p-6 rounded">
                    <NotebookCard variant="test" shadowLayers={1}>
                        <FuriganaText
                            text="電車に乗ります。"
                            furiganaMap={sampleMap}
                            className="font-serif text-2xl block notebook-stem mb-11.25 text-[#D8D4CE]"
                        />
                        <p className="font-sans text-md text-[#D8D4CE]">
                            Test mode — no furigana in real use
                        </p>
                    </NotebookCard>
                </div>
            </section>

            {/* ── Skeleton ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">Skeleton — loading state</h2>
                <NotebookSkeleton />
            </section>

            {/* ── Error — one failure ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">Error — one failure (retry shown)</h2>
                <NotebookError
                    consecutiveFails={1}
                    onRetry={() => alert('retry tapped')}
                />
            </section>

            {/* ── Error — two failures ── */}
            <section className="space-y-2">
                <h2 className="font-mono text-xs text-anko-light">Error — two failures (no retry)</h2>
                <NotebookError consecutiveFails={2} />
            </section>

        </main>
    )
}