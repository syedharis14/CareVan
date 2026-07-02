'use client';

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cv-card p-6">
      {/* Not red — red is reserved for SOS/overspeed per the design tokens. */}
      <h2 className="text-lg font-bold">Something went wrong</h2>
      <p className="cv-text-soft mt-2 text-sm">{error.message}</p>
      <button className="cv-btn-ghost mt-4" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
