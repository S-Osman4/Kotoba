// components/test/LeaveTestModal.tsx
//
// Confirmation modal shown when the user tries to navigate away during
// an active test (via the browser Back button or popstate).
//
// Per design doc §1.7:
//   "on navigate away: intercept with confirmation modal —
//    'leave test? your progress will be lost'"
//
// The modal is rendered as a fixed overlay. The confirm button calls
// onConfirm (which tears down the leave guard and navigates away).
// The cancel button calls onCancel (which closes the modal and resumes).

interface LeaveTestModalProps {
    onConfirm: () => void
    onCancel: () => void
}

export default function LeaveTestModal({ onConfirm, onCancel }: LeaveTestModalProps) {
    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate/80"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-test-title"
        >
            <div className="
        mx-4 w-full max-w-sm
        bg-slate-2 border border-slate-3 rounded-lg
        p-6 flex flex-col gap-4
      ">
                {/* Title */}
                <h2
                    id="leave-test-title"
                    className="font-serif text-xl text-slate-5"
                    style={{ color: '#D8D4CE' }}
                >
                    leave test?
                </h2>

                {/* Body */}
                <p className="font-sans text-md" style={{ color: '#6B7285' }}>
                    your progress will be lost. this cannot be undone.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                    {/* Confirm — destructive */}
                    <button
                        onClick={onConfirm}
                        className="
              w-full py-2.5 px-4 rounded
              font-sans text-md font-medium
              text-white
              transition-opacity duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            "
                        style={{ backgroundColor: '#E24B4A' }}
                    >
                        leave test
                    </button>

                    {/* Cancel — secondary */}
                    <button
                        onClick={onCancel}
                        className="
              w-full py-2.5 px-4 rounded
              font-sans text-md font-medium
              border border-slate-3
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-mid focus-visible:ring-offset-2
            "
                        style={{ color: '#D8D4CE' }}
                    >
                        continue test
                    </button>
                </div>
            </div>
        </div>
    )
}