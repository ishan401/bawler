"use client";

import React from "react";

import type { Ball } from "@/lib/types";
import MiniBallGIF from "./MiniBallGIF";
import { OUTCOME, outcomeKindOf, cardBackgroundFor } from "@/lib/outcomeColors";

interface DeliveryCardProps {
  ball: Ball;
  extraNarrative?: string;
  onShare?: (ball: Ball) => void;
}

/**
 * Variable-height ball card — Sarthak v0.9 #3:
 *   - "Impactful" balls (wicket / 4 / 6) render the FULL card with mini-gif,
 *     extra narrative, type chip.
 *   - All other balls (dot / 1 / 2 / 3 / extras) render a COMPACT one-row
 *     ribbon — no mini-gif, no narrative, just the essential info.
 *   - Card bg gradient uses the unified outcome palette.
 */
export default function DeliveryCard({ ball, extraNarrative, onShare }: DeliveryCardProps) {
  const kind = outcomeKindOf(ball);
  const palette = OUTCOME[kind];
  const bgStyle = cardBackgroundFor(kind);
  const isFull = ball.isWicket || ball.isBoundary4 || ball.isBoundary6;

  if (!isFull) {
    return <CompactRow ball={ball} bgStyle={bgStyle} badgeBg={palette.primary} badgeFg={palette.badgeFg} badgeText={palette.badgeText} onShare={onShare} />;
  }
  return <FullCard ball={ball} extraNarrative={extraNarrative} bgStyle={bgStyle} palette={palette} onShare={onShare} />;
}

// ============================================================================
// Compact row — dots, singles, twos, threes, extras. ~36 px tall.
// ============================================================================

function CompactRow({
  ball, bgStyle, badgeBg, badgeFg, badgeText, onShare,
}: {
  ball: Ball;
  bgStyle: React.CSSProperties;
  badgeBg: string;
  badgeFg: string;
  badgeText: string;
  onShare?: (ball: Ball) => void;
}) {
  return (
    <article
      className="rounded-lg border flex items-center gap-2 px-2 py-1.5"
      style={bgStyle}
    >
      <span
        className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-extrabold text-sm leading-none"
        style={{ background: badgeBg, color: badgeFg, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
      >
        {badgeText}
      </span>
      <span className="num font-bold text-text-primary text-xs shrink-0">
        {ball.over}.{ball.ballInOver + 1}
      </span>
      <SpeedDot ball={ball} />
      <span className="text-[11px] text-text-secondary truncate flex-1 min-w-0">
        {compactLineFor(ball)}
      </span>
      {onShare && (
        <button
          onClick={(e) => { e.stopPropagation(); onShare(ball); }}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-40 hover:opacity-100 transition-opacity"
          aria-label="Share this delivery"
        >
          <MiniShareIcon />
        </button>
      )}
    </article>
  );
}

function compactLineFor(ball: Ball): string {
  // Short one-liner — no "balls" abbreviation needed here, just the essentials
  if (ball.extras > 0 && ball.extraType) {
    return `${ball.bowlerName} ${ball.extraType.toUpperCase()} to ${ball.batterName}`;
  }
  return ball.oneLiner ?? `${ball.bowlerName} to ${ball.batterName}, ${ball.runs} ${ball.runs === 1 ? "run" : "runs"}`;
}

// ============================================================================
// Full card — wickets, fours, sixes. ~110-140 px tall depending on narrative.
// ============================================================================

function FullCard({
  ball, extraNarrative, bgStyle, palette, onShare,
}: {
  ball: Ball;
  extraNarrative?: string;
  bgStyle: React.CSSProperties;
  palette: { primary: string; badgeFg: string; badgeText: string };
  onShare?: (ball: Ball) => void;
}) {
  return (
    <article className="rounded-xl overflow-hidden border" style={bgStyle}>
      {/* radial highlight */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.04), transparent 60%)" }} />

      <div className="relative flex items-start">
        {/* LEFT — text block */}
        <div className="flex-1 min-w-0 px-2.5 py-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-extrabold text-sm"
              style={{ background: palette.primary, color: palette.badgeFg, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
            >
              {palette.badgeText}
            </span>
            <div className="flex items-baseline gap-1.5 text-[10px] text-text-secondary min-w-0">
              <span className="num font-bold text-text-primary shrink-0">{ball.over}.{ball.ballInOver + 1}</span>
              <span className="text-text-dim">·</span>
              <span className="truncate">{ball.bowlerName} → {ball.batterName}</span>
            </div>
          </div>

          {/* One-liner */}
          <p className="text-[12.5px] text-text-primary leading-snug">
            {ball.oneLiner ?? `${ball.bowlerName} to ${ball.batterName}, ${ball.runs}.`}
          </p>

          {/* Extra narrative paragraph */}
          {extraNarrative && (
            <p className="text-[11px] text-text-secondary leading-snug mt-1 pl-2 border-l-2 border-line">
              {extraNarrative}
            </p>
          )}

          {/* Speed + type — visual indicators + share */}
          <div className="flex items-center gap-3 mt-1.5">
            <SpeedDot ball={ball} large />
            <TypePill ball={ball} />
            {onShare && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare(ball); }}
                className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity border border-white/10"
                aria-label="Share this delivery"
              >
                <MiniShareIcon /><span>Share</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — mini-gif at fixed size so the card doesn't bloat */}
        <div
          className="shrink-0 border-l border-white/8 my-1 mr-1"
          style={{ width: 78, height: 96 }}
        >
          <MiniBallGIF ball={ball} />
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// Tiny indicators
// ============================================================================

function SpeedDot({ ball, large }: { ball: Ball; large?: boolean }) {
  const speed = ball.ballSpeedKmh ?? 0;
  const color =
    speed >= 145 ? "text-cyan"
    : speed >= 135 ? "text-text-primary"
    : speed >= 115 ? "text-orange"
    : "text-six";
  return (
    <span className={`flex items-baseline gap-0.5 num ${large ? "text-[13px]" : "text-[11px]"} font-bold ${color} shrink-0`}>
      {speed}
      <span className="text-[8px] text-text-dim font-bold uppercase tracking-widest">kmh</span>
    </span>
  );
}

function TypePill({ ball }: { ball: Ball }) {
  const variation = formatVariation(ball);
  const { color, dot } = typeStyle(ball);
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
      <span className={`text-[11px] font-bold ${color}`}>{variation}</span>
    </span>
  );
}

function typeStyle(ball: Ball): { color: string; dot: string } {
  if (ball.spinDirection && ball.spinDirection !== "none") return { color: "text-six", dot: "#A855F7" };
  if (ball.swingDirection && ball.swingDirection !== "none") return { color: "text-cyan", dot: "#06B6D4" };
  if (ball.pace === "fast") return { color: "text-text-primary", dot: "#FF6B35" };
  if (ball.pace === "slow") return { color: "text-six", dot: "#A855F7" };
  return { color: "text-text-primary", dot: "#94A3B8" };
}

function formatVariation(ball: Ball): string {
  if (ball.ballVariation && ball.ballVariation !== "stock") return capitalize(ball.ballVariation.replace("-", " "));
  if (ball.swingDirection === "in") return "Inswinger";
  if (ball.swingDirection === "out") return "Outswinger";
  if (ball.spinDirection === "off") return "Off-spin";
  if (ball.spinDirection === "leg") return "Leg-spin";
  if (ball.pace === "fast") return "Fast";
  if (ball.pace === "slow") return "Slow";
  return "Stock";
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function MiniShareIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
