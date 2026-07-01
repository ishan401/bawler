"use client";
import { memo } from "react";

import type { MatchEvent } from "@/lib/types";

interface MomentsStripProps {
  events: MatchEvent[];
  activeBallId?: string;
  onSelect: (event: MatchEvent | null) => void;
  isLive: boolean;
}

const KIND_STYLES: Record<MatchEvent["kind"], { color: string; bg: string; border: string; chip: string; chipBg: string }> = {
  wicket:               { color: "text-wicket",   bg: "bg-wicket/10",   border: "border-wicket/40",   chip: "W", chipBg: "bg-wicket text-white" },
  six:                  { color: "text-six",       bg: "bg-six/10",      border: "border-six/40",      chip: "6", chipBg: "bg-six text-white" },
  four:                 { color: "text-cyan",      bg: "bg-cyan/10",     border: "border-cyan/40",     chip: "4", chipBg: "bg-cyan text-bg" },
  milestone:            { color: "text-boundary",  bg: "bg-boundary/10", border: "border-boundary/40", chip: "★", chipBg: "bg-boundary text-bg" },
  "phase-shift":        { color: "text-orange",    bg: "bg-orange/10",   border: "border-orange/40",   chip: "→", chipBg: "bg-orange text-bg" },
  "big-over":           { color: "text-boundary",  bg: "bg-boundary/10", border: "border-boundary/40", chip: "▲", chipBg: "bg-boundary text-bg" },
  "quiet-over":         { color: "text-text-dim",  bg: "bg-bg-surface",  border: "border-line",        chip: "▽", chipBg: "bg-bg-elevated text-text-dim" },
  "momentum-swing":     { color: "text-orange",    bg: "bg-orange/10",   border: "border-orange/40",   chip: "~", chipBg: "bg-orange text-bg" },
  "key-bowling-change": { color: "text-text-secondary", bg: "bg-bg-surface", border: "border-line",   chip: "↻", chipBg: "bg-bg-elevated text-text-secondary" },
};

function MomentsStrip({ events, activeBallId, onSelect, isLive }: MomentsStripProps) {
  const sorted = [...events].sort((a, b) => b.overFloat - a.overFloat);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Moments</span>
        {!isLive && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] font-bold uppercase tracking-widest text-cyan flex items-center gap-1"
          >
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-wicket" />
            Back to live
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4 pb-1.5">
        <LiveChip active={isLive} onClick={() => onSelect(null)} />
        {sorted.map(event => (
          <EventChip
            key={event.id}
            event={event}
            active={!isLive && event.ballId === activeBallId}
            onClick={() => onSelect(event)}
          />
        ))}
      </div>
    </div>
  );
}

function LiveChip({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center justify-center gap-1 px-3.5 py-2.5 rounded-xl border transition-colors min-w-[56px] ${
        active
          ? "bg-wicket/15 border-wicket/50 text-wicket"
          : "bg-bg-surface border-line text-text-secondary hover:text-text-primary"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${active ? "bg-wicket live-dot" : "bg-text-dim"}`} />
      <span className="text-[10px] font-extrabold uppercase tracking-widest leading-none">Live</span>
    </button>
  );
}

function EventChip({ event, active, onClick }: { event: MatchEvent; active: boolean; onClick: () => void }) {
  const s = KIND_STYLES[event.kind];
  // Format over number: 13.4 → "13.4"
  const over = Math.floor(event.overFloat);
  const ball = Math.round((event.overFloat % 1) * 6) || 6;
  const overStr = `${over}.${ball}`;

  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-left rounded-xl border transition-all ${s.bg} ${s.border} ${
        active ? "ring-2 ring-cyan ring-offset-1 ring-offset-bg scale-[1.02]" : "hover:scale-[0.98]"
      }`}
      style={{ minWidth: 90, maxWidth: 120 }}
    >
      {/* Top strip — color accent bar */}      <div
        className="rounded-t-xl px-2.5 pt-2 pb-1.5 flex items-center gap-1.5"
      >
        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 ${s.chipBg}`}>
          {s.chip}
        </span>
        <span className="text-[11px] num font-extrabold text-white/90 leading-none">
          {overStr}
        </span>
      </div>

      {/* Content */}
      <div className="px-2.5 pb-2.5">
        <div className={`text-[11px] font-bold leading-tight truncate ${s.color}`}>
          {event.label}
        </div>
        {event.context && (
          <div className="text-[9.5px] text-text-dim leading-snug mt-0.5" style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {event.context}
          </div>
        )}
      </div>
    </button>
  );
}
export default memo(MomentsStrip);
