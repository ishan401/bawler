"use client";

import { useEffect, useState } from "react";

// v1.0.194 -- shared client-only "now" source for every render-time
// countdown/elapsed/today-tomorrow display in the app.
//
// The bug this fixes: several components computed Date.now()/new Date()
// directly inside their render body. A render body runs (at least) twice
// for the same page load -- once on the server, producing the initial
// HTML, and once again on the client during hydration, a little later in
// real wall-clock time. Even a sub-second gap is enough to flip a rounded
// minute/hour boundary in "in 3h 42m"-style text. mockData.ts's LIVE/PRE
// fixtures compound this: their startTimeIso/timestampIso fields are
// themselves computed via Date.now() at module-load time (not per
// render), and the server's module instance can be warm from an earlier
// request while the client's is always freshly evaluated at this exact
// page load -- so the underlying VALUE can differ too, not just whatever
// math a component does on top of it. React's hydration diffs the
// server's HTML against the client's first render byte-for-byte, so any
// of the above produces a real "text content does not match
// server-rendered HTML" error (minified React #425, and its close
// relatives #418/#423 for the same underlying cause in a slightly
// different tree shape).
//
// The fix, uniformly: never call Date.now()/new Date() from inside a
// component's synchronous render body for anything that ends up as
// visible text. Render a stable, deterministic placeholder (or omit the
// time-relative text entirely) during the server render and the client's
// first hydration pass -- both are then byte-identical, since neither one
// is doing any time-math -- then swap in the real value from inside a
// useEffect, which by definition only ever runs on the client, after that
// first pass is already committed and matched. `suppressHydrationWarning`
// is deliberately not used anywhere in this fix: it would silence the
// symptom without touching the actual server/client inconsistency.
//
// Returns `null` until mounted (every consumer renders its placeholder
// for that case), then the current timestamp, refreshed every
// `intervalMs` (default 60s -- fine-grained enough that no visible
// countdown/elapsed text goes stale for more than a minute, without
// re-rendering every consumer once a second). Every countdown/elapsed/
// today-tomorrow FORMATTING FUNCTION in the app was left exactly as it
// was computationally -- each was only changed to accept `now` as an
// explicit parameter instead of reading Date.now() itself, so the actual
// math, thresholds, and text are byte-for-byte unchanged; only WHEN/WHERE
// "now" is read changed.
export function useClientNow(intervalMs = 60000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
