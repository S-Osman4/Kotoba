// app/study/loading.tsx
//
// Shown by Next.js while the study page is loading.
// A thin sakura progress bar at the very top of the screen.

export default function StudyLoading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="h-0.5 bg-sakura animate-progress-bar"
        style={{ width: '0%' }}
      />
    </div>
  )
}