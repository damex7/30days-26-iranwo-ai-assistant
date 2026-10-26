"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card" role="alert">
      <h1 className="text-2xl font-bold">Something broke.</h1>
      <p className="mt-2 text-[var(--muted)]">{error.message || "Please try again."}</p>
      <button className="btn mt-4" onClick={reset}>Try again</button>
    </div>
  );
}
