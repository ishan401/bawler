"use client";
import { useEffect, useState } from "react";
import {
  getFirstSessionQuest,
  onFirstSessionQuestChanged,
  dismissFirstSessionQuest,
  markCompletionAnimated,
  isQuestComplete,
  shouldShowFirstSessionQuest,
  type FirstSessionQuestState,
} from "@/lib/firstSessionQuest";

const ITEMS: { key: keyof Pick<FirstSessionQuestState, "followTeam" | "openLiveMatch" | "readPitchReport">; label: string }[] = [
  { key: "followTeam", label: "Follow your first team" },
  { key: "openLiveMatch", label: "Open a live match" },
  { key: "readPitchReport", label: "Read a pitch report" },
];

const CELEBRATION_DISMISS_MS = 1400;

/**
 * Small floating checklist on the home screen only (never mounted in
 * layout.tsx -- see app/page.tsx's own render, which is the ONE place
 * this mounts). Non-modal by construction: `fixed` positioning, no
 * backdrop, no pointer-events capture on anything behind it.
 */
export default function FirstSessionQuest() {
  const [state, setState] = useState<FirstSessionQuestState | null>(null);

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
          return (
            <div key={item.key} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-transform"
                style={{
                  background: done ? "#00E5FF" : "rgba(255,255,255,0.08)",
                  color: done ? "#000" : "transparent",
                  transform: done ? "scale(1)" : "scale(0.9)",
                }}
              >
                ✓
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
