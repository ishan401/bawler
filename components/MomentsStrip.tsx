"use client";
import { memo } from "react";

import type { MatchEvent, MatchFormat } from "@/lib/types";
import { ballsPerSet } from "@/lib/formatUtils";

interface MomentsStripProps {
  events: MatchEvent[];
  activeBallId?: string;
  onSelect: (event: MatchEvent | null) => void;
  onShare?: (event: MatchEvent) => void;
  isLive: boolean;
  format?: MatchFormat;
}

const KIND_STYLES: Record<MatchEvent["kind"], { color: string; bg: string; border: string; chip: string; chipBg: string }> = {
  wicket:           { color: "text-wicket",          bg: "bg-wicket/10",    border: "border-wicket/40",    chip: "W",  chipBg: "bg-wicket text-white" },
  six:              { color: "text-six",              bg: "bg-six/10",       border: "border-six/40",       chip: "6",  chipBg: "bg-six text-white" },
  four:             { color: "text-cyan",             bg: "bg-cyan/10",      border: "border-cyan/40",      chip: "4",  chipBg: "bg-cyan text-bg" },
  milestone:        { color: "text-boundary",         bg: "bg-boundary/10",  border: "border-boundary/40",  chip: "★",  chipBg: "bg-boundary text-bg" },
  debut:            { color: "text-orange",           bg: "bg-orange/10",    border: "border-orange/40",    chip: "✦",  chipBg: "bg-orange text-bg" },
  "near-runout":    { color: "text-text-secondary",  bg: "bg-bg-surface",   border: "border-line",          chip: "!",  chipBg: "bg-bg-elevated text-orange" },
  overthrow:        { color: "text-orange",           bg: "bg-orange/10",    border: "border-orange/40",    chip: "↗",  chipBg: "bg-orange text-bg" },
  "drs-review":     { color: "text-cyan",            bg: "bg-cyan/10",      border: "border-cyan/40",      chip: "D",  chipBg: "bg-cyan text-bg" },
  "hat-trick-ball": { color: "text-wicket",          bg: "bg-wicket/20",    border: "border-wicket/60",    chip: "🎯", chipBg: "bg-wicket text-white" },
  "five-for":       { color: "text-six",             bg: "bg-six/10",       border: "border-six/40",       chip: "5W", chipBg: "bg-six text-white" },
};

function MomentsStrip({ events, activeBallId, onSelect, onShare, isLive, format }: MomentsStripProps) {
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
            format={format}
            active={!isLive && event.ballId === activeBallId}
            onClick={() => onSelect(event)}
            onShare={onShare && event.ballId ? () => onShare(event) : undefined}
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

function EventChip({ event, format, active, onClick, onShare }: { event: MatchEvent; format?: MatchFormat; active: boolean; onClick: () => void; onShare?: () => void }) {
  const s = KIND_STYLES[event.kind];
  // Reconstruct Cricinfo-style label from overFloat
  // overFloat = (0-indexed over) + (ball / bps), e.g. 19 + 6/6 = 20.0 for last T20 ball
  const bps = ballsPerSet(format ?? "T20");
  const rawOver = Math.floor(event.overFloat);
  const rawBall = Math.round((event.overFloat % 1) * bps);
  // When fraction rounds to 0 (integer overFloat = end of set), it's the last ball of the previous set
  const displayOver = rawBall === 0 ? rawOver - 1 : rawOver;
  const displayBall = rawBall === 0 ? bps : rawBall;
  const overStr = format === "Hundred" ? `Ball ${Math.round(event.overFloat * bps)}` : `${displayOver}.${displayBall}`;

  return (
    <div
      className={`shrink-0 rounded-xl border transition-all ${s.bg} ${s.border} ${
        active ? "ring-2 ring-cyan ring-offset-1 ring-offset-bg scale-[1.02]" : "hover:scale-[0.98]"
      }`}
      style={{ minWidth: 90, maxWidth: 120 }}
    >
      {/* Tappable content area */}
      <button onClick={onClick} className="w-full text-left">
        {/* Top strip — color accent bar */}
        <div className="rounded-t-xl px-2.5 pt-2 pb-1.5 flex items-center gap-1.5">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 ${s.chipBg}`}>
            {s.chip}
          </span>
          <span className="text-[11px] num font-extrabold text-white/90 leading-none">
            {overStr}
          </span>
        </div>

        {/* Content */}
        <div className="px-2.5 pb-1.5">
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

      {/* Share button — only if onShare provided */}
      {onShare && (
        <button
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 border-t border-white/5 text-white/30 hover:text-white/60 transition-colors rounded-b-xl hover:bg-white/5 active:scale-95"
          aria-label="Share this moment"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span className="text-[8px] font-bold uppercase tracking-widest">Share</span>
        </button>
      )}
    </div>
  );
}
export default memo(MomentsStrip);
