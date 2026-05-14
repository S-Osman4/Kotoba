// app/drill/loading.tsx
//
// Shown by Next.js while the drill page is loading.
// Matches the other route loading bars.

export default function DrillLoading() {
    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div
                className="h-0.5 bg-sakura animate-progress-bar"
                style={{ width: '0%' }}
            />
        </div>
    )
}