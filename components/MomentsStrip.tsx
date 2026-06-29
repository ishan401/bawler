"use client";

import type { MatchEvent } from "@/lib/types";

interface MomentsStripProps {
  events: MatchEvent[];
  activeBallId?: string;
  onSelect: (event: MatchEvent | null) => void; // null = go back to live
  isLive: boolean;
}

const KIND_STYLES: Record<MatchEvent["kind"], { color: string; bg: string; chip: string }> = {
  wicket:             { color: "text-wicket",   bg: "bg-wicket/10 border-wicket/40",   chip: "W" },
  six:                { color: "text-six",      bg: "bg-six/10 border-six/40",         chip: "6" },
  four:               { color: "text-cyan",     bg: "bg-cyan/10 border-cyan/40",       chip: "4" },
  milestone:          { color: "text-boundary", bg: "bg-boundary/10 border-boundary/40", chip: "★" },
  "phase-shift":      { color: "text-orange",   bg: "bg-orange/10 border-orange/40",   chip: "→" },
  "big-over":         { color: "text-boundary", bg: "bg-boundary/10 border-boundary/40", chip: "▲" },
  "quiet-over":       { color: "text-text-dim", bg: "bg-line border-line",             chip: "▽" },
  "momentum-swing":   { color: "text-orange",   bg: "bg-orange/10 border-orange/40",   chip: "~" },
  "key-bowling-change": { color: "text-text-secondary", bg: "bg-line border-line",     chip: "↻" },
};

/**
 * Horizontal strip of major moments. Replaces the demo-control "scrub through every ball"
 * UI. Users either watch live OR jump to one of these meaningful moments.
 */
export default function MomentsStrip({ events, activeBallId, onSelect, isLive }: MomentsStripProps) {
  const sorted = [...events].sort((a, b) => b.overFloat - a.overFloat); // newest first

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
      <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4 pb-1">
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
      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
        active ? "bg-wicket/15 border-wicket/50 text-wicket" : "bg-bg-surface border-line text-text-secondary hover:text-text-primary"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-wicket live-dot" : "bg-text-dim"}`} />
      <span className="text-[11px] font-bold uppercase tracking-widest">Live</span>
    </button>
  );
}

function EventChip({ event, active, onClick }: { event: MatchEvent; active: boolean; onClick: () => void }) {
  const s = KIND_STYLES[event.kind];
  return (
    <button
      onClick={onClick}
      className={`shrink-0 max-w-[200px] text-left px-3 py-2 rounded-xl border transition-colors ${
        active ? "ring-2 ring-cyan ring-offset-2 ring-offset-bg " + s.bg : s.bg + " hover:scale-[0.99]"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold ${s.color} bg-bg/50`}>
          {s.chip}
        </span>
        <span className="text-[10px] num font-bold text-text-dim">
          {Math.floor(event.overFloat)}.{Math.round((event.overFloat % 1) * 6) || 6}
        </span>
      </div>
      <div className={`text-xs font-bold truncate ${s.color}`}>{event.label}</div>
      <div className="text-[10px] text-text-dim truncate">{event.context}</div>
    </button>
  );
}
