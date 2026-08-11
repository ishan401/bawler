"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useRef, useState } from "react";
import { useScrollResetOnChange, ENTRANCE_ANIMATION_MS } from "@/lib/useTabSwitcher";
import { useClearValueAfterDuration } from "@/lib/animationCleanup";

const PAGE_ORDER = [
  (p: string) => p === "/",
  (p: string) => p.startsWith("/schedule"),
  (p: string) => p.startsWith("/table"),
  (p: string) => p.startsWith("/match"),
  (p: string) => p.startsWith("/player"),
];

function getPageIndex(path: string) {
  const idx = PAGE_ORDER.findIndex(fn => fn(path));
  return idx === -1 ? 99 : idx;
}

// Bug fix (platform-wide tab/view-switch audit, post-v1.0.167): this used to
// keep TWO pieces of state for "what's on screen" -- `pathname` (from
// usePathname(), read directly and immediately by BottomNav.tsx for its own
// active-tab highlight) and a separate `displayed` state, only updated
// inside a book-exit/book-enter setTimeout(220/320ms) pair. That gap meant
// BottomNav could highlight the destination tab (e.g. "Schedule") while
// this wrapper was still showing the PREVIOUS page's content underneath --
// the exact same defect class independently found and fixed in
// components/MatchView.tsx's in-page tabs, just at the whole-app routing
// level, and arguably more central since every navigation in the app goes
// through this one component. It also never reset scroll position on a
// route change at all.
//
// Fixed by removing the second, delayed state entirely: `children` renders
// directly, gated by nothing -- it changes in the exact same render
// `pathname` does, because Next.js re-renders this component on navigation
// with no extra layer in between. `key={pathname}` forces a fresh mount
// (replaying the CSS entrance animation below) on every genuine route
// change; `useScrollResetOnChange` (lib/useTabSwitcher.ts -- the same
// reset logic MatchView's tab switcher uses) resets scroll synchronously,
// before the new page is ever painted at the old scroll offset.
//
// v1.0.185 -- SECOND fix, independent of the one above: `animClass` used
// to be a plain per-render local (computed fresh every render, never
// stored), which correctly applied `book-enter-forward`/`-backward` on the
// very same render as the route change, but never removed it afterward --
// the class stayed declared on the page wrapper forever, for the entire
// time the user stayed on that page. This is the exact same GPU-
// compositing defect found and fixed in `lib/useTabSwitcher.ts`'s in-page
// tab switcher (v1.0.184, see DECISIONS-LOG.md): an element carrying an
// active `animation` targeting `transform` (book-enter-fwd/bwd's
// perspective()+rotateY() page-turn) gets pinned to a degraded, washed-out
// GPU compositing layer for as long as the class stays declared --
// regardless of whether the animation has visually finished -- and this
// wrapper sits around EVERY page's entire content, so a whole destination
// page (e.g. a freshly-opened match) could render permanently washed-out
// after every single navigation, not just briefly during the transition.
// `animClass` is now real `useState` (not a local) specifically so it can
// survive being cleared by an effect later without losing the value set on
// the render that detected the path change -- see the inline comment below
// for why a plain local can't do this safely once a `setState` call is
// involved. `useClearValueAfterDuration` (lib/animationCleanup.ts) clears
// it back to "" exactly `ENTRANCE_ANIMATION_MS` (300ms -- app/globals.css's
// own declared duration for book-enter-fwd/bwd; the same constant
// lib/useTabSwitcher.ts already uses for the identical fix, not a new
// guessed value) after every genuine navigation, via a deterministic
// setTimeout rather than an `animationend` listener (proven, in the
// v1.0.184 investigation, to never fire at all for these classes in real
// usage in this app).
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Direction for the entrance animation, derived the same way the old
  // code derived it -- compared against a ref of the previous render's
  // path/index rather than a second state, so this doesn't need its own
  // effect (and can't itself fall a render behind `pathname`). Mutating a
  // ref during render to remember "the previous value" is a standard,
  // React-sanctioned pattern (see the docs' "adjusting state when a prop
  // changes" example).
  const prevPathRef = useRef(pathname);
  const prevIndexRef = useRef(getPageIndex(pathname));
  // No animation on the very first render -- the original code's initial
  // `animClass` was "" until the first real navigation, and a fresh page
  // load flying in from off-screen would look like a bug, not a feature.
  const isFirstRenderRef = useRef(true);

  // v1.0.185 -- real state, not a local `let`. This matters specifically
  // because the branch below now ALSO calls `setAnimClass` (a real
  // setState call made during render, to apply the class synchronously on
  // the very same commit as the route change -- the same "adjust state
  // when a prop changes" pattern the refs above already use). Calling
  // setState during render makes React immediately discard this render
  // and retry the component function from the top with the new state
  // applied -- but `prevPathRef`/`prevIndexRef` are ALREADY mutated from
  // the first pass by the time the retry runs, so the retry's own
  // `prevPathRef.current !== pathname` check would read false and skip
  // recomputing the class -- if `animClass` were a plain local, the retry
  // would silently lose the value and render with no entrance class at
  // all. Because it's `useState`, the retry correctly reads back the
  // value already set by `setAnimClass` in the first pass (state updates,
  // unlike plain locals, are preserved across this kind of same-render
  // retry -- this is the documented, intended behavior of the pattern),
  // so the entrance class is still applied correctly on the render that
  // actually commits.
  const [animClass, setAnimClass] = useState("");

  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
  } else if (prevPathRef.current !== pathname) {
    const from = prevIndexRef.current;
    const to = getPageIndex(pathname);
    prevPathRef.current = pathname;
    prevIndexRef.current = to;
    setAnimClass(to >= from ? "book-enter-forward" : "book-enter-backward");
  }

  // v1.0.185 -- the actual bug fix: stop applying whichever entrance class
  // was just set, once its own declared animation duration has elapsed.
  // See the file-level comment above and lib/animationCleanup.ts for the
  // full mechanism. Deliberately NOT `animationend` -- proven unusable for
  // this exact class family in v1.0.184's investigation.
  useClearValueAfterDuration(animClass, "", ENTRANCE_ANIMATION_MS, setAnimClass);

  useScrollResetOnChange(pathname);

  return (
    <div
      key={pathname}
      className={animClass}
      style={{ minHeight: "100%", transformOrigin: "center center" }}
    >
      {children}
    </div>
  );
}
