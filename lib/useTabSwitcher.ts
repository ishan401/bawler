"use client";

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";

// ============================================================================
// Shared tab/segmented-view switching state -- THE ONLY place this logic is
// allowed to live (see ARCHITECTURE.md's "Tab switching: one state, no
// timer" entry). Built in response to a real, reproduced bug: MatchView.tsx
// and components/PageTransition.tsx each independently kept the "which tab
// is highlighted" state and the "which content is actually mounted" state
// as TWO separate pieces of state, with the second one updated inside a
// setTimeout. That gap is exactly what let a match page's tab bar show
// "Live" as active while the Score tab's real DOM (a stat card, the BOWLING
// table, the version footer) was still on screen -- confirmed to only
// resolve once that timer's callback got a free turn on the main thread,
// which can be delayed arbitrarily long under load. Neither of those files,
// nor any of the several other independent tab-switchers found in the same
// audit (PlayerProfileView's format tabs, the Schedule page's team tabs,
// FollowSheet's category rail, DigestTab's day/innings pills), ever reset
// scroll position on a switch either -- confirmed as a second, compounding
// defect: switching from a tab scrolled deep into its own content to a tab
// of very different height lands the user at an arbitrary, usually-wrong
// offset into the new tab, nowhere near its top.
//
// This hook enforces, by construction, that neither defect can recur:
//   1. `activeTab` is the ONLY state. Whatever gates a tab's content --
//      `activeTab === "live" && (...)` etc. -- reads this same value, in
//      the same render, that the tab bar's highlight reads. There is no
//      second "rendered" copy for content to lag behind, and therefore no
//      timer that could delay it.
//   2. `switchTab` resets scroll SYNCHRONOUSLY, in the same call that
//      updates `activeTab` -- not deferred, and not waiting on the new
//      tab's content to mount/lay out first (resetting to 0 is valid
//      regardless of the destination's height, which is exactly what
//      makes doing it immediately safe).
//   3. Calling `switchTab` with the tab that's already active is a no-op:
//      an in-place data refresh (e.g. a live-score poll) that happens to
//      call this with the same tab never resets scroll or replays an
//      animation -- only a GENUINE tab change does either.
//
// If a visual transition is wanted, it must be a CSS animation applied to
// the already-mounted new content (see `direction` below, and
// components/MatchView.tsx's use of the existing book-enter-forward/
// book-enter-backward keyframes in app/globals.css) -- never a second JS
// timer standing between the state change and the content it gates.
// ============================================================================

export interface UseTabSwitcherOptions<T extends string> {
  /**
   * Ordered list of every tab this switcher can show. Only used to derive
   * a forward/backward `direction` for an optional directional entrance
   * animation. Omit if you don't need one -- `direction` will just stay
   * null and callers can ignore it.
   */
  order?: readonly T[];
  /**
   * The scrollable element to reset to its top on every genuine tab
   * change -- pass this when the tabbed view lives inside its own
   * `overflow-y-auto` container (e.g. FollowSheet's options pane,
   * PlayerProfileView's content column). Omit it for any full-page view
   * where the page/body itself scrolls (e.g. MatchView, the Schedule
   * page) -- `switchTab` then resets `window` instead.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

export interface TabSwitcher<T extends string> {
  activeTab: T;
  /**
   * "forward" | "backward" | null -- direction of the most recent switch,
   * populated only when `order` was passed. Intended to be read once per
   * switch to pick a CSS class for the newly-mounted content; a stale
   * value from a previous switch is harmless since callers key their
   * animated wrapper off `activeTab` itself, which forces a fresh mount
   * (and animation replay) on every change regardless.
   */
  direction: "forward" | "backward" | null;
  /**
   * Switch to `next`. No-ops if `next === activeTab`. Updates `activeTab`
   * and resets scroll synchronously -- see the module doc comment above.
   */
  switchTab: (next: T) => void;
  /**
   * Escape hatch for the ONE legitimate case that isn't a user-triggered
   * switch: silently correcting `activeTab` right after mount when
   * restoring a previously-saved tab from sessionStorage (e.g. returning
   * to a match page from a player profile). That restore must render
   * `initial` on both the server and the client's first pass -- reading
   * sessionStorage during render would differ between the two and trigger
   * a hydration mismatch (the same class of bug fixed platform-wide in
   * v1.0.89/v1.0.90) -- so the real value can only be applied in an
   * effect, after mount. `restoreTab` sets `activeTab` directly with NO
   * scroll reset and NO direction/animation, since the user didn't just
   * click or swipe anything; `switchTab` would incorrectly play a
   * transition and yank scroll on first paint. Never call this from a
   * click handler, swipe handler, or any other real interaction --
   * `switchTab` is the only correct entry point for those.
   */
  restoreTab: (tab: T) => void;
}

export function useTabSwitcher<T extends string>(
  initial: T,
  options: UseTabSwitcherOptions<T> = {}
): TabSwitcher<T> {
  const { order, scrollContainerRef } = options;
  const [activeTab, setActiveTab] = useState<T>(initial);
  const [direction, setDirection] = useState<"forward" | "backward" | null>(null);

  // Mirrors `activeTab` into a ref so `switchTab`'s identity can stay
  // stable across renders (safe to pass to a memoized child or list it in
  // a dependency array) without ever closing over a stale value.
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const switchTab = useCallback(
    (next: T) => {
      const current = activeTabRef.current;
      if (next === current) return;

      if (order) {
        const from = order.indexOf(current);
        const to = order.indexOf(next);
        setDirection(from === -1 || to === -1 ? null : to > from ? "forward" : "backward");
      }

      // One state update. `activeTab` and whatever it gates change in the
      // exact same render -- no second, delayed state to fall out of sync
      // with the tab bar.
      setActiveTab(next);

      // Synchronous scroll reset, in this same call -- see module doc
      // comment for why this is safe to do immediately.
      const el = scrollContainerRef?.current;
      if (el) {
        el.scrollTop = 0;
      } else if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
    },
    [order, scrollContainerRef]
  );

  const restoreTab = useCallback((tab: T) => {
    setActiveTab(tab);
  }, []);

  return { activeTab, direction, switchTab, restoreTab };
}

// ============================================================================
// Companion to useTabSwitcher for view-switches that are driven by something
// OTHER than a local click/swipe handler this file can wrap directly --
// today, that's exactly one caller: components/PageTransition.tsx, whose
// "active view" is Next's own router pathname (via usePathname()), not a
// piece of local state this module could own. Route changes already avoid
// defect (1) for free -- usePathname() and the page content it gates are
// necessarily the same render, since Next.js re-renders on navigation with
// no extra state layer in between (there is no separate "was this route
// actually mounted yet" flag to fall out of sync with a nav-highlight).
// What routing does NOT give you for free is defect (2): nothing resets
// scroll on navigation by itself. This hook is that missing piece, reusing
// the exact same reset logic `useTabSwitcher`'s `switchTab` uses, so this
// codebase has exactly one scroll-reset implementation, not two.
// ============================================================================

export function useScrollResetOnChange(
  key: string,
  scrollContainerRef?: RefObject<HTMLElement | null>
) {
  // useLayoutEffect, not useEffect: it flushes synchronously after the DOM
  // update but before the browser paints, so the reset is applied before
  // the user ever sees a frame of the new view at the old scroll offset --
  // the same "before it's visible" guarantee `switchTab` gets for free by
  // running inside the same synchronous click/swipe handler that changes
  // `activeTab`.
  useLayoutEffect(() => {
    const el = scrollContainerRef?.current;
    if (el) {
      el.scrollTop = 0;
    } else if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    // Deliberately depends on `key` alone, not `scrollContainerRef` (a ref
    // object's identity is stable across renders and reading `.current`
    // in a dependency array wouldn't do anything useful anyway) -- this
    // must re-run once per genuine `key` change, and only then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
