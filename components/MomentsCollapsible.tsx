"use client";

import { useState } from "react";
import type { MatchEvent } from "@/lib/types";
import MomentsStrip from "./MomentsStrip";

interface MomentsCollapsibleProps {
  events: MatchEvent[];
  activeBallId?: string;
  isLive: boolean;
  onSelect: (event: MatchEvent | null) => void;
}

/**
 * Moments live behind a single-tap button. Click to reveal the horizontal
 * scrollable strip; click again to hide.
 *
 * Per Sarthak v0.4 — Moments don't occupy permanent vertical space on the
 * Live tab; they show up only when summoned.
 */
export default function MomentsCollapsible(props: MomentsCollapsibleProps) {
  const [open, setOpen] = useState(false);
  const { events, isLive } = props;
  const countLabel = events.length > 0 ? `${events.length}` : "0";

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-bg-elevated transition"
      >
        <div className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-cyan">
            <path d="M3 5L3 11M8 3L8 13M13 7L13 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
            Moments <span className="text-text-secondary num">· {countLabel}</span>
          </span>
          {!isLive && (
            <span className="text-[10px] text-orange font-bold uppercase tracking-widest">viewing past</span>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`text-text-dim transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-line px-3 pb-3 pt-2">
          <MomentsStrip {...props} />
        </div>
      )}
    </div>
  );
}
