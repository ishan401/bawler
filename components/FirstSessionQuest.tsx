"use client";
import { useEffect, useRef, useState } from "react";
import {
  getFirstSessionQuest,
  onFirstSessionQuestChanged,
  dismissFirstSessionQuest,
  markCompletionAnimated,
  isQuestComplete,
  shouldShowFirstSessionQuest,
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

  useEffect(() => {
    setState(getFirstSessionQuest());
    return onFirstSessionQuestChanged(() => setState(getFirstSessionQuest()));
  }, []);

  useEffect(() => {
    if (!state) return;
    if (isQuestComplete(state) && !state.completionAnimated) {
      const id = window.setTimeout(() => markCompletionAnimated(), CELEBRATION_DISMISS_MS);
      return () => window.clearTimeout(id);
    }
  }, [state]);

  // Detect genuine unchecked -> checked transitions, once per item, only
  // while this component stays mounted. `prevStateRef.current` starts as
  // `null`, so the very first state read (page load, possibly with items
  // already checked from a prior visit) never counts as a transition --
  // it only seeds the baseline. Every state change after that is compared
  // against the immediately-preceding one.
  useEffect(() => {
    if (!state) return;
    const prev = prevStateRef.current;
    if (prev) {
      const newlyDone = ITEMS.map(i => i.key).filter(key => !prev[key] && state[key]);
      if (newlyDone.length > 0) {
        setJustCompleted(current => {
          const next = new Set(current);
          newlyDone.forEach(key => next.add(key));
          return next;
        });
        newlyDone.forEach(key => {
          window.setTimeout(() => {
            setJustCompleted(current => {
              if (!current.has(key)) return current;
              const next = new Set(current);
              next.delete(key);
              return next;
            });
          }, CLEANUP_MS);
        });
      }
    }
    prevStateRef.current = state;
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
