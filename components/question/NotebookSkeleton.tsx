// components/question/NotebookSkeleton.tsx
//
// Loading skeleton with the same notebook anatomy as NotebookCard.
// Shown immediately when a question request is in flight.
// Replaced by the real card on data arrival.
//
// The shimmer effect is defined in globals.css as `animate-shimmer`.

import NotebookCard from './NotebookCard'

interface NotebookSkeletonProps {
    className?: string
}

// A shimmer block — reused for each placeholder content line
function ShimmerBlock({
    className = '',
}: {
    className?: string
}) {
    return (
        <div
            className={`rounded bg-sakura-pale animate-shimmer ${className}`}
        />
    )
}

export default function NotebookSkeleton({ className }: NotebookSkeletonProps) {
    return (
        <NotebookCard variant="skeleton" shadowLayers={1} className={className}>
            {/* Stem placeholder — two lines */}
            <div className="space-y-2 mb-6 pt-2">
                <ShimmerBlock className="h-5 w-4/5" />
                <ShimmerBlock className="h-5 w-3/5" />
            </div>

            {/* Instruction placeholder — one shorter line */}
            <ShimmerBlock className="h-4 w-2/5 mb-8" />

            {/* Choice placeholders — four blocks */}
            <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                    <ShimmerBlock key={i} className="h-10 w-full" />
                ))}
            </div>
        </NotebookCard>
    )
}