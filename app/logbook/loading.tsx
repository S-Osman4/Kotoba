// app/logbook/loading.tsx
//
// Shown by Next.js while the logbook page is loading.
// Matches the study loading bar — consistent across all routes.

export default function LogbookLoading() {
    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div
                className="h-0.5 bg-sakura animate-progress-bar"
                style={{ width: '0%' }}
            />
        </div>
    )
}