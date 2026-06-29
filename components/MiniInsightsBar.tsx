"use client";

import type { Match, InsightV2 } from "@/lib/types";

interface MiniInsightsBarProps {
  match: Match;
  insights: InsightV2[];
}

/**
 * Top-of-screen mini-insights — 4 concise chips that sit immediately
 * below the chase-context line in the ScoreBar.
 *
 * Each chip is at-a-glance: a short label + a punchy number.
 */
export default function MiniInsightsBar({ match, insights }: MiniInsightsBarProps) {
  const chips = deriveMiniInsights(match, insights);
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
  return (
    <div className="shrink-0 flex items-baseline gap-1 px-2 py-1 rounded-md border border-line bg-bg-surface">
      <span className={`text-[10px] font-extrabold num ${chip.valueColor}`}>{chip.value}</span>
      <span className="text-[9px] text-text-secondary truncate max-w-[120px]">{chip.label}</span>
    </div>
  );
}

interface MiniChip {
  value: string;
  valueColor: string;
  label: string;
}

function deriveMiniInsights(match: Match, _insights: InsightV2[]): MiniChip[] {
  const chips: MiniChip[] = [];
  const i1 = match.innings[0];
  const i2 = match.innings[1];
  const live = i2 ?? i1;
  if (!live) return chips;

  const target = i1 && i2 ? i1.runs + 1 : null;
  const cumulativeRuns = live.balls.reduce((s, b) => s + b.runs + b.extras, 0);
  const ballsBowled = live.balls.length;
  const cumulativeWickets = live.balls.filter(b => b.isWicket).length;
  const ballsLeft = 120 - ballsBowled;
  const crr = ballsBowled > 0 ? (cumulativeRuns / ballsBowled) * 6 : 0;

  // Chip 1: RRR or CRR
  if (target && ballsLeft > 0) {
    const need = target - cumulativeRuns;
    const rrr = (need / ballsLeft) * 6;
    chips.push({
      value: rrr.toFixed(1),
      valueColor: rrr > 12 ? "text-wicket" : rrr > 9 ? "text-orange" : "text-boundary",
      label: "RRR",
    });
  } else {
    chips.push({
      value: crr.toFixed(1),
      valueColor: "text-text-primary",
      label: "CRR",
    });
  }

  // Chip 2: last 12 balls runs
  const last12 = live.balls.slice(-12);
  if (last12.length >= 6) {
    const last12Runs = last12.reduce((s, b) => s + b.runs + b.extras, 0);
    const last12Wkts = last12.filter(b => b.isWicket).length;
    chips.push({
      value: `${last12Runs}${last12Wkts ? `/${last12Wkts}w` : ""}`,
      valueColor: last12Wkts > 0 ? "text-wicket" : last12Runs >= 15 ? "text-boundary" : "text-text-primary",
      label: "last 12 balls",
    });
  }

  // Chip 3: current bowler stats
  const currentBowler = live.balls[live.balls.length - 1]?.bowlerName;
  if (currentBowler) {
    const bowlerStats = live.bowlingCard.find(b => b.playerName.includes(currentBowler) || currentBowler.includes(b.playerName));
    if (bowlerStats) {
      chips.push({
        value: `${bowlerStats.wickets}/${bowlerStats.runsConceded}`,
        valueColor: bowlerStats.wickets >= 2 ? "text-cyan" : "text-text-primary",
        label: currentBowler.split(" ").pop() ?? currentBowler,
      });
    }
  }

  // Chip 4: top scorer
  const topScorer = [...live.battingCard].sort((a, b) => b.runs - a.runs)[0];
  if (topScorer && topScorer.runs > 0) {
    chips.push({
      value: `${topScorer.runs}(${topScorer.ballsFaced})`,
      valueColor: topScorer.runs >= 50 ? "text-boundary" : "text-text-primary",
      label: topScorer.playerName.split(" ").pop() ?? topScorer.playerName,
    });
  }

  return chips.slice(0, 4);
}
