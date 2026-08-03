import Link from "next/link";

/* Route-scoped 404 for app/match/[id] — rendered by Next.js whenever
   MatchPage calls notFound() for a match id that doesn't exist in the
   mock dataset (e.g. a fabricated/synthetic id). Without this file,
   Next falls back to its own generic, unbranded default 404 page.

   Deliberately does NOT rely on the persistent BottomNav being visible
   or noticed — the primary CTA below is the obvious, prominent way
   back regardless. */
export default function MatchNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <svg width="40" height="40" viewBox="0 0 32 32" fill="none" className="shrink-0 mb-5">
        <circle cx="16" cy="16" r="14" stroke="#00E5FF" strokeWidth="2" opacity="0.5" />
        <path d="M11 11L21 21M21 11L11 21" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <h1 className="text-lg font-extrabold tracking-tight text-text-primary">
        This match doesn&apos;t exist
      </h1>
      <p className="mt-2 text-sm text-text-secondary max-w-[280px]">
        We couldn&apos;t find a match with that link. It may have been removed,
        or the link might be off.
      </p>

      <Link
        href="/"
        className="tap-scale mt-7 inline-flex items-center justify-center rounded-full bg-cyan text-bg text-sm font-extrabold uppercase tracking-widest px-8 py-3.5"
      >
        Back to matches
      </Link>
    </main>
  );
}
