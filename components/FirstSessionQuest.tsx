"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  getFirstSessionQuest,
  onFirstSessionQuestChanged,
  dismissFirstSessionQuest,
  markCompletionAnimated,
  isQuestComplete,
  shouldShowFirstSessionQuest,
  isItemAnimated,
  markItemAnimated,
  type FirstSessionQuestState,
  type FirstSessionQuestItem,
} from "@/lib/firstSessionQuest";

const ITEMS: { key: keyof Pick<FirstSessionQuestState, "followTeam" | "openLiveMatch" | "readPitchReport">; label: string }[] = [
  { key: "followTeam", label: "Follow your first team" },
  { key: "openLiveMatch", label: "Open a live match" },
  { key: "readPitchReport", label: "Read a pitch report" },
];

const CELEBRATION_DISMISS_MS = 1400;

// v1.0.171 (onboarding visual polish): "just completed" checkmark draw-in +
// ring pulse. CHECK_DRAW_MS/RING_PULSE_MS drive the two CSS animations
// (draw via a stroke-dashoffset transition, ring via the .ring-pulse
// keyframe in app/globals.css); CLEANUP_MS is just long enough after the
// longer of the two that the ring has fully finished before its DOM node
// is removed, with a small buffer -- never used to delay/gate anything
// else (checking off items and the checklist's own dismiss button work
// exactly as before, immediately, regardless of this animation's state).
const CHECK_DRAW_MS = 350;
const CLEANUP_MS = 600;
// v1.0.173: when the checklist mounts and finds items that finished on a
// DIFFERENT page while it wasn't mounted at all (see the "catch-up" effect
// below), and more than one is pending at once, their catch-up animations
// start this many ms apart -- in the checklist's own display order --
// instead of all firing simultaneously. Doesn't apply to a genuine live
// transition witnessed while already mounted, which still starts
// immediately exactly as before.
const CATCHUP_STAGGER_MS = 250;
// Path length of the shared checkmark glyph (viewBox 0 0 16 16, path
// "M3 8.5L6.2 12L13 4" -- the same path/viewBox used by FollowSheet's
// CheckIndicator and the onboarding/player-profile follow buttons, see
// v1.0.169/170) is ~15.24 -- 16 gives a safe rounding buffer for the
// dasharray/dashoffset pair.
const CHECK_PATH_LENGTH = 16;

/** The checkmark glyph itself, split out so its "draw in" transition can
 * use a plain per-instance useEffect (start undrawn -> flip to drawn one
 * frame later) instead of an inline ref callback re-running every render. */
function CheckGlyph({ animate }: { animate: boolean }) {
  const [drawn, setDrawn] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setDrawn(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5L6.2 12L13 4"
        stroke="#0A0E1A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: CHECK_PATH_LENGTH,
          strokeDashoffset: drawn ? 0 : CHECK_PATH_LENGTH,
          transition: animate ? `stroke-dashoffset ${CHECK_DRAW_MS}ms ease-out` : "none",
        }}
      />
    </svg>
  );
}

/** Starts (after `delayMs`) then automatically ends (after CLEANUP_MS more)
 * one item's completion animation: adds it to the visible `justCompleted`
 * set, persists its per-item animated flag immediately so it can never be
 * scheduled again on any future mount, then removes it from the set once
 * the visual animation has had time to finish. Shared by both the live-
 * transition path and the on-mount catch-up path below so an item is
 * marked animated -- and therefore never replayed -- no matter which path
 * catches it.
 *
 * Every timeout id gets pushed onto `pendingTimeoutIdsRef` (a ref that
 * lives for the component's whole mounted lifetime, cleared only on
 * unmount -- see the dedicated effect for that below). This is
 * deliberate: `markItemAnimated()` persists to localStorage, which
 * dispatches the shared change event, which flows back into this
 * component's own `state` via its subscribe effect. That's a *new*
 * `state` object reference on every call, which would re-run any effect
 * keyed on `[state]` -- including the ones that scheduled this very
 * animation. If those effects returned a cleanup that cleared a
 * per-invocation id list, that cleanup would fire on that unrelated
 * re-render and cancel a still-pending, not-yet-fired stagger delay
 * (e.g. the 250ms-later second item in a two-item catch-up) before it
 * ever got to run. Routing every id through one ref that's only ever
 * swept on true unmount avoids that class of bug entirely. */
function scheduleItemAnimation(
  item: FirstSessionQuestItem,
  delayMs: number,
  setJustCompleted: Dispatch<SetStateAction<Set<FirstSessionQuestItem>>>,
  pendingTimeoutIdsRef: { current: number[] }
): void {
  const startId = window.setTimeout(() => {
    setJustCompleted(current => {
      const next = new Set(current);
      next.add(item);
      return next;
    });
    markItemAnimated(item);
    const cleanupId = window.setTimeout(() => {
      setJustCompleted(current => {
        if (!current.has(item)) return current;
        const next = new Set(current);
        next.delete(item);
        return next;
      });
    }, CLEANUP_MS);
    pendingTimeoutIdsRef.current.push(cleanupId);
  }, delayMs);
  pendingTimeoutIdsRef.current.push(startId);
}

/**
 * Small floating checklist on the home screen only (never mounted in
 * layout.tsx -- see app/page.tsx's own render, which is the ONE place
 * this mounts). Non-modal by construction: `fixed` positioning, no
 * backdrop, no pointer-events capture on anything behind it.
 */
export default function FirstSessionQuest() {
  const [state, setState] = useState<FirstSessionQuestState | null>(null);
  // Items that JUST transitioned unchecked -> checked during this mounted
  // session, currently mid-animation. Never populated for items that were
  // already true the first time `state` loads (see the effect below,
  // which only starts comparing from the second state it observes).
  const [justCompleted, setJustCompleted] = useState<Set<FirstSessionQuestItem>>(new Set());
  const prevStateRef = useRef<FirstSessionQuestState | null>(null);
  // v1.0.173: guards the catch-up effect below to run its scan exactly
  // once per mount, the first time `state` becomes available -- not on
  // every subsequent state change (that's the live-transition effect's
  // job, unchanged).
  const hasCaughtUpRef = useRef(false);
  // v1.0.173: every timeout id scheduleItemAnimation() creates, for the
  // whole lifetime of this mounted instance. Only ever swept on unmount
  // (see the dedicated effect right below) -- see scheduleItemAnimation's
  // own comment for why per-effect cleanup would be actively wrong here.
  const pendingTimeoutIdsRef = useRef<number[]>([]);

  useEffect(() => {
    setState(getFirstSessionQuest());
    return onFirstSessionQuestChanged(() => setState(getFirstSessionQuest()));
  }, []);

  // Unmount-only sweep of every timeout scheduleItemAnimation() has ever
  // created for this instance -- avoids leaking timers / calling setState
  // after this component has actually gone away (e.g. user navigates home
  // then immediately away again inside CLEANUP_MS). Deliberately NOT tied
  // to `state` or any other changing dependency; see scheduleItemAnimation.
  useEffect(() => {
    return () => {
      pendingTimeoutIdsRef.current.forEach(id => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    if (isQuestComplete(state) && !state.completionAnimated) {
      const id = window.setTimeout(() => markCompletionAnimated(), CELEBRATION_DISMISS_MS);
      return () => window.clearTimeout(id);
    }
  }, [state]);

  // Detect genuine unchecked -> checked transitions, once per item, only
  // while this component stays mounted -- e.g. a future action taken
  // directly on the home screen itself. `prevStateRef.current` starts as
  // `null`, so the very first state read (page load, possibly with items
  // already checked from a prior visit or a prior page) never counts as a
  // transition here -- it only seeds the baseline; the separate catch-up
  // effect below is what handles anything already done at that first
  // read. Every state change after that first read is compared against
  // the immediately-preceding one, exactly as before this version.
  useEffect(() => {
    if (!state) return;
    const prev = prevStateRef.current;
    if (prev) {
      const newlyDone = ITEMS.map(i => i.key).filter(key => !prev[key] && state[key]);
      newlyDone.forEach(key => scheduleItemAnimation(key, 0, setJustCompleted, pendingTimeoutIdsRef));
    }
    prevStateRef.current = state;
  }, [state]);

  // v1.0.173: catch-up for items that finished on a DIFFERENT page while
  // this component wasn't mounted at all -- "Open a live match" and "Read
  // a pitch report" can only ever be marked from MatchView.tsx/InfoTab.tsx,
  // neither of which renders this checklist, so the live-transition effect
  // above never gets a chance to witness their unchecked -> checked moment.
  // Runs exactly once, on the first `state` this mounted instance ever
  // sees: anything already `true` there but not yet `*Animated` (per
  // lib/firstSessionQuest.ts) is a genuine unseen completion, not
  // something already celebrated in an earlier mount/session -- play its
  // catch-up animation now, staggered CATCHUP_STAGGER_MS apart in the
  // checklist's own display order (ITEMS) so simultaneous catch-ups don't
  // all fire at once. Purely additive: never touches `prevStateRef`, so it
  // can't interfere with the live-transition effect's own bookkeeping.
  useEffect(() => {
    if (!state || hasCaughtUpRef.current) return;
    hasCaughtUpRef.current = true;
    const pending = ITEMS.map(i => i.key).filter(key => state[key] && !isItemAnimated(state, key));
    pending.forEach((key, index) => scheduleItemAnimation(key, index * CATCHUP_STAGGER_MS, setJustCompleted, pendingTimeoutIdsRef));
  }, [state]);

  if (!state || !shouldShowFirstSessionQuest(state)) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 w-56 card p-3 flex flex-col gap-2 shadow-lg animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Get started</div>
        <button
          onClick={() => dismissFirstSessionQuest()}
          aria-label="Dismiss checklist"
          className="text-text-dim text-xs leading-none px-1"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {ITEMS.map(item => {
          const done = state[item.key];
          const animating = justCompleted.has(item.key);
          return (
            <div key={item.key} className="flex items-center gap-2">
              <span
                className="relative w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-transform"
                style={{
                  background: done ? "#00E5FF" : "rgba(255,255,255,0.08)",
                  transform: done ? "scale(1)" : "scale(0.9)",
                }}
              >
                {done && <CheckGlyph animate={animating} />}
                {animating && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full ring-pulse pointer-events-none"
                    style={{ border: "1.5px solid #00E5FF" }}
                  />
                )}
              </span>
              <span className={`text-[11px] ${done ? "text-text-dim line-through" : "text-text-primary"}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
