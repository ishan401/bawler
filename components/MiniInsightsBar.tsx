"use client";
import { memo } from "react";

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
function MiniInsightsBar({ match, insights }: MiniInsightsBarProps) {
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
  const live = match.innings[match.innings.length - 1];
  if (!live) return chips;

  // Chips 1 & 2: derive current batters from ball data (not battingCard.out flag —
  // that includes players who haven't batted yet and would give wrong names)
  const strikerName = live.balls[live.balls.length - 1]?.batterName;
  // Non-striker = most recent ball faced by a different batter
  const nonStrikerName = [...live.balls].reverse().find(b => b.batterName && b.batterName !== strikerName)?.batterName;

  const strikerCard = strikerName ? live.battingCard.find(r => r.playerName === strikerName) : null;
  const nonStrikerCard = nonStrikerName ? live.battingCard.find(r => r.playerName === nonStrikerName) : null;

  if (strikerCard) {
    chips.push({
      value: `${strikerCard.runs}(${strikerCard.ballsFaced})`,
      valueColor: strikerCard.runs >= 50 ? "text-boundary" : "text-text-primary",
      label: (strikerCard.playerName.split(" ").pop() ?? strikerCard.playerName) + "*",
    });
  }
  if (nonStrikerCard) {
    chips.push({
      value: `${nonStrikerCard.runs}(${nonStrikerCard.ballsFaced})`,
      valueColor: nonStrikerCard.runs >= 50 ? "text-boundary" : "text-text-primary",
      label: nonStrikerCard.playerName.split(" ").pop() ?? nonStrikerCard.playerName,
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

  return chips;
}
export default memo(MiniInsightsBar);
