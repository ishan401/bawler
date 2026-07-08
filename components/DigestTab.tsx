"use client";

/**
 * DigestTab — over-by-over digest cards for each innings.
 *
 * Format-adaptive grouping:
 *   T20 / T20I / Hundred → 1 card per over  (6 legal-ball dot row shown)
 *   ODI                  → 1 card per 5 overs (no dot row — too many)
 *   Test                 → 1 card per 30 overs / session (no dot row)
 *
 * Cards are ordered newest-first.
 * Tapping the Key Ball chip switches to the Live tab and loads that ball's GIF.
 */

import React, { useMemo } from "react";
import { Match, Ball, MatchFormat, Innings } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function groupSize(format: MatchFormat): number {
  if (format === "ODI") return 5;
  if (format === "Test") return 30;
  return 1;
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return parts.length >= 2 ? parts[parts.length - 1] : fullName;
}

function isExtras(b: Ball): boolean {
  return b.extraType === "wd" || b.extraType === "nb";
}

function legalBalls(balls: Ball[]): Ball[] {
  return balls.filter(b => !isExtras(b));
}

function pickKeyBall(balls: Ball[]): Ball {
  const wicket = balls.find(b => b.isWicket);
  if (wicket) return wicket;
  const six = balls.find(b => b.isBoundary6);
  if (six) return six;
  const four = balls.find(b => b.isBoundary4);
  if (four) return four;
  return balls.reduce((best, b) => (b.runs > best.runs ? b : best), balls[0]);
}

function dominantBowler(balls: Ball[]): string {
  const map = new Map<string, { balls: number; wickets: number }>();
  for (const b of balls) {
    const e = map.get(b.bowlerName) ?? { balls: 0, wickets: 0 };
    e.balls++;
    if (b.isWicket) e.wickets++;
    map.set(b.bowlerName, e);
  }
  return [...map.entries()].sort(
    (a, b) => b[1].wickets - a[1].wickets || b[1].balls - a[1].balls
  )[0][0];
}

function buildNarrative(
  runs: number,
  wickets: number,
  fours: number,
  sixes: number,
  bowler: string,
  keyBall: Ball,
  format: MatchFormat
): string {
  const span =
    format === "ODI" ? "block" : format === "Test" ? "session" : "over";
  const big = format === "ODI" ? 30 : format === "Test" ? 40 : 14;

  if (runs === 0 && wickets === 0) return `${lastName(bowler)} maiden`;
  if (wickets >= 3) return `${wickets} wickets — collapse!`;
  if (wickets === 2) return `Two wickets, ${runs} conceded`;
  if (runs >= big)
    return sixes >= 2
      ? `${sixes} sixes, ${fours} fours — carnage`
      : `Big ${span} — ${runs} runs`;
  if (wickets === 1 && runs >= 10) return `${runs} & a wicket — ${lastName(bowler)}`;
  if (wickets === 1) return `${lastName(bowler)} strikes`;
  if (sixes >= 2) return `${sixes} sixes — ${lastName(keyBall.batterName)} in flow`;
  if (fours >= 3) return `${fours} fours — boundaries flowing`;
  if (runs <= 3 && wickets === 0) return `Tight ${span} — ${runs} conceded`;
  return `${runs} scored`;
}

// ── data model ───────────────────────────────────────────────────────────────

interface OverCard {
  id: string;
  label: string;
  inningsLabel: string;
  teamColor: string;
  runs: number;
  wickets: number;
  fours: number;
  sixes: number;
  allBalls: Ball[];
  legalDeliveries: Ball[];
  keyBall: Ball;
  bowlerName: string;
  narrative: string;
  gs: number; // group size — 1 for T20, 5 for ODI, 30 for Test
}

// ── card builder ─────────────────────────────────────────────────────────────

function buildCards(match: Match, allBalls: Ball[], isLive: boolean): OverCard[] {
  const gs = groupSize(match.format);
  const result: OverCard[] = [];
  const inningsCount = match.innings.length;

  for (let innIdx = 0; innIdx < inningsCount; innIdx++) {
    const inn: Innings = match.innings[innIdx];
    const innBalls = allBalls.filter(b => b.inningsNumber === inn.number);
    if (innBalls.length === 0) continue;

    const byOver = new Map<number, Ball[]>();
    for (const b of innBalls) {
      const arr = byOver.get(b.over) ?? [];
      arr.push(b);
      byOver.set(b.over, arr);
    }

    const overNums = [...byOver.keys()].sort((a, b) => a - b);
    if (overNums.length === 0) continue;

    const isLastInn = innIdx === inningsCount - 1;
    const lastOverNum = overNums[overNums.length - 1];
    const lastOverBalls = byOver.get(lastOverNum) ?? [];
    const completedOverNums =
      isLive && isLastInn && legalBalls(lastOverBalls).length < 6
        ? overNums.slice(0, -1)
        : overNums;

    if (completedOverNums.length === 0) continue;

    const ordinals = ["1st", "2nd", "3rd", "4th"];
    const inningsLabel = inningsCount > 1 ? `${ordinals[inn.number - 1]} Inn` : "";
    const teamColor =
      inn.battingTeam === match.teamA.code
        ? match.teamA.primaryColor
        : match.teamB.primaryColor;

    const firstOver = completedOverNums[0];
    const lastOver = completedOverNums[completedOverNums.length - 1];

    for (let chunkStart = firstOver; chunkStart <= lastOver; chunkStart += gs) {
      const chunkEnd = chunkStart + gs - 1;
      const chunkOvers = completedOverNums.filter(n => n >= chunkStart && n <= chunkEnd);
      if (chunkOvers.length === 0) continue;
      if (gs > 1 && lastOver < chunkStart + gs - 1) continue; // chunk incomplete

      const chunkBalls = chunkOvers.flatMap(n => byOver.get(n) ?? []);
      if (chunkBalls.length === 0) continue;

      const runs = chunkBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = chunkBalls.filter(b => b.isWicket).length;
      const fours = chunkBalls.filter(b => b.isBoundary4).length;
      const sixes = chunkBalls.filter(b => b.isBoundary6).length;
      const keyBall = pickKeyBall(chunkBalls);
      const bowlerName = dominantBowler(chunkBalls);
      const legal = legalBalls(chunkBalls);

      const label =
        gs === 1
          ? `Over ${chunkStart}`
          : `Overs ${chunkStart}–${Math.min(chunkEnd, lastOver)}`;

      result.push({
        id: `inn${inn.number}-over${chunkStart}`,
        label,
        inningsLabel,
        teamColor,
        runs,
        wickets,
        fours,
        sixes,
        allBalls: chunkBalls,
        legalDeliveries: legal,
        keyBall,
        bowlerName,
        narrative: buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, match.format),
        gs,
      });
    }
  }

  return result.reverse();
}

// ── sub-components ───────────────────────────────────────────────────────────

function BallDot({ ball }: { ball: Ball }) {
  let bg = "bg-white/10";
  let textColor = "text-text-dim";
  let content = "·";

  if (ball.isWicket) {
    bg = "bg-wicket/25";
    textColor = "text-wicket";
    content = "W";
  } else if (ball.isBoundary6) {
    bg = "bg-six/25";
    textColor = "text-six";
    content = "6";
  } else if (ball.isBoundary4) {
    bg = "bg-boundary/25";
    textColor = "text-boundary";
    content = "4";
  } else if (ball.runs > 0) {
    bg = "bg-white/12";
    textColor = "text-text-secondary";
    content = String(ball.runs);
  }

  return (
    <div className={`w-[17px] h-[17px] rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <span className={`text-[8px] font-bold leading-none ${textColor}`}>{content}</span>
    </div>
  );
}

function DigestCard({
  card,
  onSelectBall,
}: {
  card: OverCard;
  onSelectBall: (id: string) => void;
}) {
  const kb = card.keyBall;
  const keyLabel = (() => {
    const base = `${kb.over}.${kb.ballInOver + 1}`;
    if (kb.isWicket) return `${base} · OUT`;
    if (kb.isBoundary6) return `${base} · SIX`;
    if (kb.isBoundary4) return `${base} · FOUR`;
    return base;
  })();

  const showDots = card.gs === 1; // only for single-over cards

  return (
    <div className="card overflow-hidden">
      {/* ── Row 1: label + inline stats ── */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: card.teamColor }}
        />
        {card.inningsLabel && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
            {card.inningsLabel}
          </span>
        )}
        <span className="text-[10px] font-extrabold text-text-primary">{card.label}</span>

        <div className="flex-1" />

        {/* Stat badges — always show runs, show others only if non-zero */}
        <span className="text-[10px] font-extrabold num text-text-primary">
          {card.runs}r
        </span>
        {card.wickets > 0 && (
          <span className="text-[10px] font-extrabold num text-wicket ml-1">
            {card.wickets}w
          </span>
        )}
        {card.fours > 0 && (
          <span className="text-[10px] font-bold num text-boundary ml-1">
            {card.fours}×4
          </span>
        )}
        {card.sixes > 0 && (
          <span className="text-[10px] font-bold num text-six ml-1">
            {card.sixes}×6
          </span>
        )}
      </div>

      {/* ── Row 2: dots (T20 only) + narrative ── */}
      <div className="flex items-center gap-2 px-3 pb-2">
        {showDots && (
          <div className="flex items-center gap-0.5 shrink-0">
            {card.legalDeliveries.map(b => (
              <BallDot key={b.id} ball={b} />
            ))}
          </div>
        )}
        <p className="text-[10px] text-text-dim leading-snug truncate flex-1 min-w-0">
          {card.narrative}
        </p>
      </div>

      {/* ── Row 3: key ball chip ── */}
      <button
        onClick={() => onSelectBall(card.keyBall.id)}
        className="w-full px-3 py-1.5 border-t border-line/50 flex items-center gap-1.5 active:bg-line/40 transition-colors"
      >
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim shrink-0">
          Key
        </span>
        <span className="text-[10px] font-extrabold text-cyan num shrink-0">{keyLabel}</span>
        {kb.oneLiner && (
          <span className="text-[10px] text-text-dim truncate flex-1 min-w-0">
            {kb.oneLiner}
          </span>
        )}
        <svg
          className="w-3 h-3 text-cyan shrink-0 ml-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

interface Props {
  match: Match;
  allBalls: Ball[];
  onSelectBall: (ballId: string) => void;
}

export default function DigestTab({ match, allBalls, onSelectBall }: Props) {
  const isLive = match.status === "live";

  const cards = useMemo(
    () => buildCards(match, allBalls, isLive),
    [match, allBalls, isLive]
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-16 gap-2 text-center px-6">
        <p className="text-sm font-bold text-text-primary">No digest yet</p>
        <p className="text-xs text-text-dim">Cards appear as each over completes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-4">
      {cards.map(card => (
        <DigestCard key={card.id} card={card} onSelectBall={onSelectBall} />
      ))}
    </div>
  );
}
