"use client";

import { useEffect } from "react";

// v1.0.185 -- shared implementation of the "stop applying a transform-
// animation class once its own declared CSS duration has elapsed" fix.
//
// ROOT CAUSE THIS EXISTS TO GUARD AGAINST (full investigation in
// DECISIONS-LOG.md under v1.0.184 and v1.0.185): an element carrying an
// active CSS `animation` shorthand that targets `transform` (this
// codebase's `book-enter-forward`/`book-enter-backward` page-turn,
// `winprob-pulse`, `chip-in`, etc.) gets promoted by Chromium to its own
// GPU compositing layer, and that layer stays pinned to a degraded,
// washed-out/blurry paint quality for as long as the class stays
// *declared* on the element -- independent of the transform's resolved
// value, and independent of whether the animation has visually finished.
// State-level checks (opacity, class list, computed style) all report
// "correct" the entire time this is happening, because none of those
// values are actually wrong -- only the compositor's cached raster of the
// layer is stale. `animationend`/`animationstart`/`animationcancel` were
// proven, via a live capture-phase-listener test against a real repro,
// to never fire at all for these classes in this app -- so any cleanup
// relying on those events is unusable, not just fragile. The only
// mechanism proven to reliably work is a deterministic `setTimeout`
// scheduled for the CSS's own declared `animation-duration`, clearing a
// piece of REACT STATE (never the DOM directly) so the class is naturally
// absent on the next render and can't be silently reapplied by some
// unrelated future re-render.
//
// v1.0.184 first proved this fix in two places independently:
// `lib/useTabSwitcher.ts`'s `ENTRANCE_ANIMATION_MS` effect (clears the
// in-page tab-switch entrance class) and `components/MatchView.tsx`'s
// win-prob modal (`hasEnteredProbModal`). Both of those call sites are
// confirmed working and are deliberately left as their own untouched,
// already-verified inline implementations -- NOT migrated to call this
// utility -- so as not to risk regressing a fix that's already proven
// correct in production. This file exists so the THIRD call site
// (`components/PageTransition.tsx`, v1.0.185, the whole-app route-level
// wrapper) and any future ones don't have to reimplement the same handful
// of lines a third and fourth time.
//
// USAGE CONTRACT: this hook only implements the "clear it later" half of
// the fix. The caller remains responsible for applying the entrance class
// SYNCHRONOUSLY, in the same render/commit that shows the new content --
// via whatever mechanism best fits that caller's own shape (a `switchTab`
// action's setState call, a boolean prop like a modal's `open` flag, a
// layout effect reacting to a changed route). Call `setValue(<the entrance
// class>)` at that moment, then call this hook with the resulting value --
// it will schedule `setValue(clearedValue)` after `durationMs`, matched to
// the CSS's own declared `animation-duration` for that class (do not guess
// a new number -- read it from app/globals.css for whichever keyframe the
// caller uses).
export function useClearValueAfterDuration<T>(
  value: T,
  clearedValue: T,
  durationMs: number,
  setValue: (next: T) => void
): void {
  useEffect(() => {
    if (Object.is(value, clearedValue)) return;
    const id = setTimeout(() => setValue(clearedValue), durationMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, clearedValue, durationMs]);
}
