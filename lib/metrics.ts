import type { Match, AIMetric } from "./types";
import { calculateWinProbForMatch, calculateProjectedScore, totalBallsForFormat } from "./winProb";

/**
 * Compute the 5 front-page AI metrics shown above the GIF.
 *
 * Per Sarthak's spec:
 *   - 1: Win % (clickable — opens the full chart)
 *   - 2: Projected total
 *   - 3: Momentum (vague, AI-driven: net win-prob movement last 12 balls)
 *   - 4: Required acceleration (RRR vs current rate, framed as "+X.X RPO needed")
 *   - 5: Key player impact (named "If next wicket falls" — small simulation)
 *
 * Pressure is removed per spec.
 */
export function computeAIMetrics(match: Match): AIMetric[] {
  const wp = calculateWinProbForMatch(match);
  const last = wp[wp.length - 1];
  const teamA = match.teamA;
  const teamB = match.teamB;
  const projected = calculateProjectedScore(match);
  const i1 = match.innings[0];
  const i2 = match.innings[1];
  const live = i2 ?? i1;
  const target = i1 && i2 ? i1.runs + 1 : null;

  const metrics: AIMetric[] = [];

  // ---- 1) Win % ----
  if (last) {
    const wpA = last.winProbTeamA;
    const leader = wpA >= 0.5 ? teamA : teamB;
    const leaderPct = wpA >= 0.5 ? wpA : 1 - wpA;
    const momentumLeader = momentum(wp);
    const trend: AIMetric["trend"] =
      momentumLeader.deltaA > 0.02 ? (wpA >= 0.5 ? "up" : "down")
      : momentumLeader.deltaA < -0.02 ? (wpA >= 0.5 ? "down" : "up")
      : "flat";
    const trendDelta = Math.abs(momentumLeader.deltaA) >= 0.01
      ? `${wpA >= 0.5 ? (momentumLeader.deltaA >= 0 ? "+" : "") : (momentumLeader.deltaA <= 0 ? "+" : "-")}${Math.round(Math.abs(momentumLeader.deltaA) * 100)}% / 12 balls`
      : "steady";
    metrics.push({
      kind: "win-prob",
      label: "Win %",
      primaryValue: `${Math.round(leaderPct * 100)}%`,
      secondaryValue: leader.shortName,
      trend,
      trendDelta,
      tint: "cyan",
      expandable: true,
    });
  }

  // ---- 2) Projected total ----
  if (projected) {
    const gap = target ? target - projected.runs : null;
    metrics.push({
      kind: "projected",
      label: target ? "Projected" : "Projected total",
      primaryValue: `${projected.runs}`,
      secondaryValue: target
        ? gap! > 0
          ? `${gap} short of ${target}`
          : gap! < 0
          ? `${-gap!} past target`
          : `levels target`
        : `${projected.perOver}/over pace`,
      tint: target && gap! > 0 ? "wicket" : target && gap! < 0 ? "boundary" : "orange",
    });
  }

  // ---- 3) Momentum (12-ball net win-prob shift, framed by team) ----
  {
    const m = momentum(wp);
    const movingTeam = m.deltaA > 0 ? teamA : teamB;
    const magnitude = Math.abs(m.deltaA);
    metrics.push({
      kind: "momentum",
      label: "Momentum",
      primaryValue: movingTeam.shortName,
      secondaryValue: magnitude > 0.15 ? "strongly" : magnitude > 0.07 ? "shifting" : "steady",
      trend: m.deltaA > 0 ? "up" : m.deltaA < 0 ? "down" : "flat",
      trendDelta: `${m.deltaA > 0 ? "+" : ""}${Math.round(m.deltaA * 100)}% / 12 balls`,
      tint: magnitude > 0.1 ? "orange" : "neutral",
    });
  }

  // ---- 4) Required acceleration (only in 2nd innings during chase) ----
  if (i2 && target) {
    const cumulativeRuns = i2.balls.reduce((s, b) => s + b.runs + b.extras, 0);
    const ballsBowled = i2.balls.length;
    const ballsLeft = totalBallsForFormat(match) - ballsBowled;
    const need = target - cumulativeRuns;
    if (ballsLeft > 0 && need > 0) {
      const rrr = (need / ballsLeft) * 6;
      const crr = ballsBowled > 0 ? (cumulativeRuns / ballsBowled) * 6 : 0;
      const delta = rrr - crr;
      metrics.push({
        kind: "acceleration",
        label: "Acceleration",
        primaryValue: delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
        secondaryValue: "RPO needed",
        trend: delta > 1.5 ? "up" : delta < -0.5 ? "down" : "flat",
        trendDelta: `RRR ${rrr.toFixed(1)} vs CRR ${crr.toFixed(1)}`,
        tint: delta > 2 ? "wicket" : delta > 0.5 ? "orange" : "boundary",
      });
    }
  } else {
    // 1st innings: forecast of late-overs acceleration
    const i1Balls = i1?.balls ?? [];
    const ballsBowled = i1Balls.length;
    const cumulativeRuns = i1Balls.reduce((s, b) => s + b.runs + b.extras, 0);
    const crr = ballsBowled > 0 ? (cumulativeRuns / ballsBowled) * 6 : 0;
    const expectedDeathRPO = 11.5;
    const delta = expectedDeathRPO - crr;
    metrics.push({
      kind: "acceleration",
      label: "Pace forecast",
      primaryValue: delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
      secondaryValue: "RPO expected",
      trend: delta > 1.5 ? "up" : "flat",
      tint: "neutral",
    });
  }

  // ---- 5) "If next wicket" — simulated win-prob impact of next wicket ----
  if (live && last) {
    const wicketsLeft = 10 - live.wickets;
    if (wicketsLeft > 0) {
      // crude approximation: each wicket worth ~6% drop for batting side
      const dropPct = Math.min(20, 4 + (10 - wicketsLeft) * 1.5);
      const battingSide = live.battingTeam === match.teamA.code ? match.teamA : match.teamB;
      metrics.push({
        kind: "key-player",
        label: "Next wicket",
        primaryValue: `–${Math.round(dropPct)}%`,
        secondaryValue: `${battingSide.shortName} win %`,
        tint: "wicket",
      });
    }
  }

  return metrics;
}

function momentum(wp: ReturnType<typeof calculateWinProbForMatch>): { deltaA: number } {
  if (wp.length < 2) return { deltaA: 0 };
  const last = wp[wp.length - 1];
  const baseIdx = Math.max(0, wp.length - 13); // last 12 balls
  return { deltaA: last.winProbTeamA - wp[baseIdx].winProbTeamA };
}
