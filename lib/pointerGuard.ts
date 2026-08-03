"use client";

// ============================================================================
// Pointer guard — defers a periodic, non-user-initiated state update while a
// tap/click gesture is in progress anywhere on the page.
// ============================================================================
// Root cause this exists to fix (see DECISIONS-LOG.md, "click swallowed by
// the live-simulation ticker"): components/MatchView.tsx runs a demo-only
// setInterval (gated by shouldRunMockSimulationTicker) that advances
// liveBallIdx every BALL_DWELL_MS while viewing a mock-simulated live
// match. That state update flows through truncatedMatch's useMemo and
// re-derives battingCard/bowlingCard fresh, which mutates the DOM of
// whichever rows/controls are currently live (a not-out batter's stat
// line + strike-rotation marker + sparkline, the current bowler's
// figures, BallGIF's conditionally-rendered share button, etc.). A tap
// landing in the same instant as that re-render/reflow can be dropped by
// the browser before it ever reaches any click handler -- confirmed via
// direct capture-phase instrumentation showing zero DOM events fired for
// the dropped click, i.e. this is a browser-level event-delivery race
// against a real DOM mutation, not an application preventDefault/
// stopPropagation or a malformed href.
//
// Two independent fixes address this (see DECISIONS-LOG.md for the full
// writeup): (1) reduce unnecessary DOM churn on interactive elements
// themselves -- e.g. components/Scorecard.tsx's PlayerNameLink is wrapped
// in React.memo so a batter's name/link never re-renders from a tick that
// only changed their ticking stats. (2) this module -- a safety net that
// holds even where (1) can't fully apply (e.g. BallGIF's share button,
// which must legitimately mount/unmount based on whether the CURRENT ball
// is a "big moment," so no amount of memoization can make its presence
// stable): defer the ticker's state update itself until any in-flight
// pointer gesture finishes, so the state update -- and therefore the DOM
// mutation it causes -- can never land mid-tap.
//
// Deliberately NOT scoped to MatchView or to any one component: any
// future setInterval-driven, non-user-initiated state update anywhere in
// the app should route through runGuarded() rather than calling its
// setState directly, for the same reason.

let pointerDown = false;
let listenersAttached = false;
const queuedCallbacks = new Set<() => void>();

function flushQueue() {
  pointerDown = false;
  if (queuedCallbacks.size === 0) return;
  const toRun = Array.from(queuedCallbacks);
  queuedCallbacks.clear();
  for (const fn of toRun) fn();
}

function ensureListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;
  const down = () => { pointerDown = true; };
  const up = () => flushQueue();
  // pointerdown/pointerup cover mouse + touch + pen uniformly in modern
  // browsers; touchstart/touchend/touchcancel kept alongside as a
  // fallback for any environment where a given input type doesn't fire
  // Pointer Events. All listeners are passive (state tracking only, never
  // preventDefault/stopPropagation) so this can never itself interfere
  // with a gesture's normal delivery.
  window.addEventListener("pointerdown", down, { passive: true });
  window.addEventListener("pointerup", up, { passive: true });
  window.addEventListener("pointercancel", up, { passive: true });
  window.addEventListener("touchstart", down, { passive: true });
  window.addEventListener("touchend", up, { passive: true });
  window.addEventListener("touchcancel", up, { passive: true });
}

/**
 * Run `fn` immediately, UNLESS a pointer is currently down anywhere on the
 * page -- in that case, queue it to run once the current gesture ends
 * (pointerup/pointercancel/touchend/touchcancel), rather than dropping it
 * or delaying it indefinitely. Safe to call on every tick of a
 * setInterval: if the same callback reference is still queued from an
 * earlier tick (a pointer held down across multiple tick periods -- e.g.
 * a long-press), later ticks coalesce into that single pending run rather
 * than piling up duplicate calls.
 */
export function runGuarded(fn: () => void): void {
  ensureListeners();
  if (!pointerDown) {
    fn();
    return;
  }
  queuedCallbacks.add(fn);
}
