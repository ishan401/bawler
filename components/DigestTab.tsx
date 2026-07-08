"use client";

/**
 * DigestTab — over-by-over digest cards for each innings.
 *
 * Format-adaptive grouping:
 *   T20 / T20I / Hundred → 1 card per over
 *   ODI                  → 1 card per 5 overs
 *   Test                 → 1 card per 30 overs (roughly one session)
 *
 * Cards are ordered newest-first.
 * Tapping the "Key Ball" chip calls onSelectBall which switches to Live tab.
 */

import React, { useMemo } from "react";
import { Match, Ball, MatchFormat, Innings } from "@/lib/types";

// ── helpers ─────────────────────────────────────────────────────────────────

function groupSize(format: MatchFormat): number {
  if (format === "ODI") return 5;
  if (format === "Test") return 30;
  return 1; // T20, T20I, Hundred
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return parts.length >= 2 ? parts[parts.length - 1] : fullName;
}

function isExtras(b: Ball): boolean {
  return b.extraType === "wd" || b.extraType === "nb";
}

function legalCount(balls: Ball[]): number {
  return balls.filter(b => !isExtras(b)).length;
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
  return [...map.entries()].sort((a, b) =>
    b[1].wickets - a[1].wickets || b[1].balls - a[1].balls
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
  const bigThreshold = format === "ODI" ? 30 : format === "Test" ? 40 : 14;
  if (runs === 0 && wickets === 0) return `${lastName(bowler)} maiden — pressure mounts`;
  if (wickets >= 3) return `${wickets} wickets — collapse! ${runs} conceded`;
  if (wickets === 2) return `Two wickets — ${runs} scored, ${lastName(bowler)} dominant`;
  if (runs >= bigThreshold) {
    return sixes >= 2
      ? `Carnage — ${runs} runs, ${sixes} six${sixes !== 1 ? "es" : ""} & ${fours} four${fours !== 1 ? "s" : ""}`
      : `Big over — ${runs} runs in the over`;
  }
  if (wickets === 1 && runs >= 10) return `${runs} scored, ${lastName(bowler)} takes a wicket`;
  if (wickets === 1) return `${lastName(bowler)} strikes — ${runs} conceded`;
  if (sixes >= 2) return `${sixes} sixes — ${lastName(keyBall.batterName)} in full flow`;
  if (fours >= 3) return `${fours} fours — boundary bonanza`;
  if (runs <= 3 && wickets === 0) return `Tight — just ${runs} conceded`;
  return `${runs} scored in the over`;
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
  allBalls: Ball[];   // every delivery incl wides/no-balls (for dot display)
  keyBall: Ball;
  bowlerName: string;
  narrative: string;
}

// ── card builder ─────────────────────────────────────────────────────────────

function buildCards(
  match: Match,
  allBalls: Ball[],
  isLive: boolean
): OverCard[] {
  const gs = groupSize(match.format);
  const result: OverCard[] = [];

  const inningsCount = match.innings.length;

  for (let innIdx = 0; innIdx < inningsCount; innIdx++) {
    const inn: Innings = match.innings[innIdx];
    const innBalls = allBalls.filter(b => b.inningsNumber === inn.number);
    if (innBalls.length === 0) continue;

    // Group balls by over number
    const byOver = new Map<number, Ball[]>();
    for (const b of innBalls) {
      const arr = byOver.get(b.over) ?? [];
      arr.push(b);
      byOver.set(b.over, arr);
    }

    const overNums = [...byOver.keys()].sort((a, b) => a - b);
    if (overNums.length === 0) continue;

    // If this is the last innings and match is live, skip the last incomplete over
    const isLastInn = innIdx === inningsCount - 1;
    const skipLast = isLive && isLastInn;
    const lastOverNum = overNums[overNums.length - 1];
    const lastOverBalls = byOver.get(lastOverNum) ?? [];
    const completedOverNums =
      skipLast && legalCount(lastOverBalls) < 6
        ? overNums.slice(0, -1)
        : overNums;

    if (completedOverNums.length === 0) continue;

    // Innings label
    const ordinals = ["1st", "2nd", "3rd", "4th"];
    const inningsLabel = inningsCount > 1 ? `${ordinals[inn.number - 1]} Inn` : "";
    const teamColor =
      inn.battingTeam === match.teamA.code
        ? match.teamA.primaryColor
        : match.teamB.primaryColor;

    // Group over numbers by gs chunks (based on over index within innings, 0-based)
    // We want groups: [1..gs], [gs+1..2*gs], etc. — using actual over numbers.
    const firstOver = completedOverNums[0];
    const lastOver = completedOverNums[completedOverNums.length - 1];

    // Calculate chunk boundaries aligned to firstOver
    for (let chunkStart = firstOver; chunkStart <= lastOver; chunkStart += gs) {
      const chunkEnd = chunkStart + gs - 1;
      const chunkOvers = completedOverNums.filter(n => n >= chunkStart && n <= chunkEnd);
      if (chunkOvers.length === 0) continue;

      // For ODI/Test grouping, only emit card when the chunk is fully complete
      // (i.e., the last over in the chunk must be completed).
      // For gs=1 this is trivially satisfied.
      if (gs > 1) {
        const expectedLastOver = chunkStart + gs - 1;
        if (lastOver < expectedLastOver) continue; // chunk not yet complete — skip
      }

      const chunkBalls = chunkOvers.flatMap(n => byOver.get(n) ?? []);
      if (chunkBalls.length === 0) continue;

      const runs = chunkBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = chunkBalls.filter(b => b.isWicket).length;
      const fours = chunkBalls.filter(b => b.isBoundary4).length;
      const sixes = chunkBalls.filter(b => b.isBoundary6).length;
      const keyBall = pickKeyBall(chunkBalls);
      const bowlerName = dominantBowler(chunkBalls);

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
        keyBall,
        bowlerName,
        narrative: buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, match.format),
      });
    }
  }

  return result.reverse(); // newest first
}

// ── sub-components ───────────────────────────────────────────────────────────

function BallDot({ ball }: { ball: Ball }) {
  let bg = "bg-white/10";
  let textColor = "text-text-dim";
  let content = "·";

  if (ball.isWicket) {
    bg = "bg-wicket/20";
    textColor = "text-wicket";
    content = "W";
  } else if (ball.isBoundary6) {
    bg = "bg-six/20";
    textColor = "text-six";
    content = "6";
  } else if (ball.isBoundary4) {
    bg = "bg-boundary/20";
    textColor = "text-boundary";
    content = "4";
  } else if (isExtras(ball)) {
    bg = "bg-white/5";
    textColor = "text-text-dim";
    content = ball.extraType === "wd" ? "wd" : "nb";
  } else if (ball.runs > 0) {
    bg = "bg-white/15";
    textColor = "text-text-primary";
    content = String(ball.runs);
  }

  return (
    <div
      className={`min-w-[18px] h-[18px] rounded-full ${bg} flex items-center justify-center px-0.5`}
    >
      <span className={`text-[8px] font-bold leading-none ${textColor}`}>{content}</span>
    </div>
  );
}

function StatPill({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center px-3 first:pl-0">
      <span className={`text-base font-extrabold num leading-tight ${color}`}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim mt-0.5">
        {label}
      </span>
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
  // Key ball label: "7.3 J Bumrah OUT!"
  const kb = card.keyBall;
  const keyLabel = (() => {
    let label = `${kb.over}.${kb.ballInOver + 1} ${lastName(kb.bowlerName)}`;
    if (kb.isWicket) label += " · OUT!";
    else if (kb.isBoundary6) label += " · SIX";
    else if (kb.isBoundary4) label += " · FOUR";
    return label;
  })();

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: card.teamColor }}
          />
          {card.inningsLabel && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
              {card.inningsLabel}
            </span>
          )}
        </div>
        <span className="text-[11px] font-extrabold text-text-primary num">{card.label}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center px-4 py-2.5 gap-0 border-b border-line/50">
        <StatPill
          value={card.runs}
          label="runs"
          color="text-text-primary"
        />
        <div className="w-px h-7 bg-line mx-1" />
        <StatPill
          value={card.wickets}
          label="wkts"
          color={card.wickets > 0 ? "text-wicket" : "text-text-dim"}
        />
        <div className="w-px h-7 bg-line mx-1" />
        <StatPill
          value={card.fours}
          label="4s"
          color={card.fours > 0 ? "text-boundary" : "text-text-dim"}
        />
        <div className="w-px h-7 bg-line mx-1" />
        <StatPill
          value={card.sixes}
          label="6s"
          color={card.sixes > 0 ? "text-six" : "text-text-dim"}
        />
        <div className="flex-1" />
        <span className="text-[10px] text-text-dim font-medium">{lastName(card.bowlerName)}</span>
      </div>

      {/* Ball-by-ball dot row */}
      <div className="px-4 py-2.5 flex items-center gap-1 flex-wrap">
        {card.allBalls.map((ball) => (
          <BallDot key={ball.id} ball={ball} />
        ))}
      </div>

      {/* Narrative */}
      <div className="px-4 pb-2.5">
        <p className="text-xs text-text-secondary leading-snug">{card.narrative}</p>
      </div>

      {/* Key ball chip — tappable → Live tab */}
      <button
        onClick={() => onSelectBall(card.keyBall.id)}
        className="w-full px-4 py-2.5 border-t border-line flex items-center justify-between gap-2 active:bg-line/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim shrink-0">
            Key Ball
          </span>
          <span className="text-[11px] font-extrabold text-text-primary num shrink-0">
            {keyLabel}
          </span>
          {kb.oneLiner && (
            <span className="text-[11px] text-text-dim truncate">{kb.oneLiner}</span>
          )}
        </div>
        <svg
          className="w-3.5 h-3.5 text-cyan shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

// ── main export ──────────────────────────────────────────────────────────────

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
      <div className="flex flex-col items-center justify-center pt-16 gap-3 text-center px-6">
        <span className="text-3xl">📋</span>
        <p className="text-sm font-bold text-text-primary">No digest yet</p>
        <p className="text-xs text-text-dim leading-relaxed">
          Cards appear as each over completes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {cards.map((card) => (
        <DigestCard key={card.id} card={card} onSelectBall={onSelectBall} />
      ))}
    </div>
  );
}
