"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useRef } from "react";
import { useScrollResetOnChange } from "@/lib/useTabSwitcher";

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
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Direction for the entrance animation, derived the same way the old
  // code derived it -- compared against a ref of the previous render's
  // path/index rather than a second state, so this doesn't need its own
  // effect (and can't itself fall a render behind `pathname`). Mutating a
  // ref during render to remember "the previous value" is a standard,
  // React-sanctioned pattern (see the docs' "adjusting state when a prop
  // changes" example) -- this doesn't call setState, so it can't trigger
  // an extra render or a loop.
  const prevPathRef = useRef(pathname);
  const prevIndexRef = useRef(getPageIndex(pathname));
  // No animation on the very first render -- the original code's initial
  // `animClass` was "" until the first real navigation, and a fresh page
  // load flying in from off-screen would look like a bug, not a feature.
  const isFirstRenderRef = useRef(true);
  let animClass = "";
  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
  } else if (prevPathRef.current !== pathname) {
    const from = prevIndexRef.current;
    const to = getPageIndex(pathname);
    animClass = to >= from ? "book-enter-forward" : "book-enter-backward";
    prevPathRef.current = pathname;
    prevIndexRef.current = to;
  }

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
