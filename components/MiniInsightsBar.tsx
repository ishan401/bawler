"use client";
import { memo } from "react";

import type { Match, InsightV2, WinProbPoint } from "@/lib/types";

interface MiniInsightsBarProps {
  match: Match;
  insights: InsightV2[];
  winProbPoints: WinProbPoint[];
  onExpandWinProb: () => void;
}

/**
 * Top-of-screen mini-insights — concise chips that sit immediately
 * below the chase-context line in the ScoreBar.
 *
 * Each chip is at-a-glance: a short label + a punchy number. Every chip
 * (batters, bowler, win-prob) shares the same fixed max-width + ellipsis
 * truncation so a long player name or deep-innings score string can
 * never overflow or wrap the row.
 */
function MiniInsightsBar({ match, insights, winProbPoints, onExpandWinProb }: MiniInsightsBarProps) {
  const chips = deriveMiniInsights(match, insights, winProbPoints, onExpandWinProb);
  if (chips.length === 0) return null;
  return (
    <div className="px-4 py-2 bg-bg/85 backdrop-blur border-b border-line flex items-center gap-2 overflow-x-auto scrollbar-thin">
      {chips.map((c, i) => (
        <Chip key={i} chip={c} />
      ))}
    </div>
  );
}

function Chip({ chip }: { chip: MiniChip }) {
  const Tag = chip.onClick ? "button" : "div";
  const content = chip.reverse
    ? (
      <>
        <span className="text-[10px] font-extrabold text-text-primary shrink-0 truncate max-w-[42px]">{chip.label}</span>
        <span className={`text-[10px] font-extrabold num truncate ${chip.valueColor}`}>{chip.value}</span>
      </>
    )
    : (
      <>
        <span className={`text-[10px] font-extrabold num shrink-0 truncate max-w-[52px] ${chip.valueColor}`}>{chip.value}</span>
        <span className="text-[9px] text-text-secondary truncate min-w-0">{chip.label}</span>
      </>
    );

  return (
    <Tag
      onClick={chip.onClick}
      aria-label={chip.onClick ? `${chip.label} ${chip.value} — open win probability chart` : undefined}
      className={`shrink-0 flex items-baseline gap-1 px-2 py-1 rounded-md border border-line bg-bg-surface max-w-[118px] overflow-hidden ${
        chip.onClick ? "active:scale-95 transition-transform" : ""
      }`}
    >
      {content}
      {chip.onClick && (
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-dim ml-0.5">
          <path d="M3 5L8 11L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </Tag>
  );
}

interface MiniChip {
  value: string;
  valueColor: string;
  label: string;
  onClick?: () => void;
  /** When true, renders label before value (e.g. "IND 89%") instead of the default value-first order. */
  reverse?: boolean;
}

function deriveMiniInsights(
  match: Match,
  _insights: InsightV2[],
  winProbPoints: WinProbPoint[],
  onExpandWinProb: () => void
): MiniChip[] {
  const chips: MiniChip[] = [];
  const live = match.innings[match.innings.length - 1];

  if (live) {
    // Chips 1 & 2: derive current batters from ball data (ground truth for who's at crease)
    const strikerName = live.balls[live.balls.length - 1]?.batterName;
    const nonStrikerName = [...live.balls].reverse().find(b => b.batterName && b.batterName !== strikerName)?.batterName;

    // Helper: get runs/balls from battingCard; fallback to computing from ball data
    // (guards against battingCard being incomplete in real-data scenarios)
    const batterStats = (name: string) => {
      const card = live.battingCard.find(r => r.playerName === name);
      if (card) return { runs: card.runs, balls: card.ballsFaced };
      const faced = live.balls.filter(b => b.batterName === name);
      return { runs: faced.reduce((s, b) => s + (b.runs ?? 0), 0), balls: faced.length };
    };

    if (strikerName) {
      const s = batterStats(strikerName);
      chips.push({
        value: `${s.runs}(${s.balls})`,
        valueColor: s.runs >= 50 ? "text-boundary" : "text-text-primary",
        label: (strikerName.split(" ").pop() ?? strikerName) + "*",
      });
    }
    if (nonStrikerName) {
      const s = batterStats(nonStrikerName);
      chips.push({
        value: `${s.runs}(${s.balls})`,
        valueColor: s.runs >= 50 ? "text-boundary" : "text-text-primary",
        label: nonStrikerName.split(" ").pop() ?? nonStrikerName,
      });
    }

    // Chip 3: current bowler match figures
    const currentBowlerName = live.balls[live.balls.length - 1]?.bowlerName;
    if (currentBowlerName) {
      const bowlerStats = live.bowlingCard.find(
        b => b.playerName.includes(currentBowlerName) || currentBowlerName.includes(b.playerName)
      );
      if (bowlerStats) {
        chips.push({
          value: `${bowlerStats.wickets}/${bowlerStats.runsConceded}`,
          valueColor: bowlerStats.wickets >= 2 ? "text-cyan" : "text-text-primary",
          label: currentBowlerName.split(" ").pop() ?? currentBowlerName,
        });
      }
    }
  }

  // Chip 4: leading team's win probability — tap to open the full-screen chart
  if (winProbPoints.length > 0) {
    const last = winProbPoints[winProbPoints.length - 1];
    const pctA = Math.round(last.winProbTeamA * 100);
    const leaderIsA = pctA >= 50;
    chips.push({
      value: `${leaderIsA ? pctA : 100 - pctA}%`,
      valueColor: "text-cyan",
      label: leaderIsA ? match.teamA.shortName : match.teamB.shortName,
      onClick: onExpandWinProb,
      reverse: true,
    });
  }

  return chips;
}
export default memo(MiniInsightsBar);
