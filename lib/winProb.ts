// ============================================================================
// Win probability — simple formula approximating bookmaker behavior
// ============================================================================
// In v1 production, win prob comes from scraped odds-market averages.
// This formula is a SANE-LOOKING approximation purely for the mocked match,
// so the chart looks realistic. Real impl will replace this with odds-derived
// implied probability.
//
// Formula logic:
//   - 1st innings: compare current run rate vs venue par-rate, adjust by wickets
//   - 2nd innings (chase): use required-rate vs achievable-rate + wickets-in-hand
// ============================================================================

import type { Match, Ball, WinProbPoint } from "./types";
import { ballsPerSet, absoluteBallNumber } from "./formatUtils";

export function totalBallsForFormat(match: Match): number {
  // Tests have variable innings — win prob model doesn't apply cleanly; use a large cap
  if (match.format === "Test") return 450;
  if (match.format === "ODI") return 300;       // 50 overs
  if (match.format === "Hundred") return 100;   // 100-ball format
  return 120;                                   // T20 / T20I
}

export function calculateWinProbForMatch(match: Match): WinProbPoint[] {
  const points: WinProbPoint[] = [];
  const totalBalls = totalBallsForFormat(match);
  const target = match.innings[0]?.runs ? match.innings[0].runs + 1 : null;
  const venuePar = match.venue.parScore ?? (match.format === "ODI" ? 270 : match.format === "Test" ? 320 : 170);
  const battingFirstWinPct = match.venue.battingFirstWinPct ?? 0.5;

  let prevWP = 0.5;

  for (const innings of match.innings) {
    let cumulativeRuns = 0;
    let cumulativeWickets = 0;

    for (let i = 0; i < innings.balls.length; i++) {
      const ball = innings.balls[i];
      cumulativeRuns += ball.runs + ball.extras;
      if (ball.isWicket) cumulativeWickets++;

      const bps = ballsPerSet(match.format);
      const overFloat = ball.over - 1 + (ball.ballInOver + 1) / bps;
      const ballsBowled = absoluteBallNumber(ball, match.format);
      const ballsRemaining = totalBalls - ballsBowled;

      let wpTeamA: number;

      if (innings.number === 1) {
        // Team A is batting first
        const projectedTotal = ballsBowled > 0 ? (cumulativeRuns / ballsBowled) * totalBalls : venuePar;
        const wicketsLeft = 10 - cumulativeWickets;
        const wicketsFactor = Math.max(0.4, Math.min(1.2, wicketsLeft / 8));
        const projectedAdj = projectedTotal * wicketsFactor;
        const ratio = projectedAdj / venuePar;
        // Sigmoid around par
        const baseProb = 1 / (1 + Math.exp(-(ratio - 1) * 4));
        // Anchor toward venue baseline
        wpTeamA = battingFirstWinPct * (1 - 0.6) + baseProb * 0.6;
      } else {
        // Team B chasing target
        const need = target! - cumulativeRuns;
        const wicketsLeft = 10 - cumulativeWickets;
        if (need <= 0) {
          wpTeamA = 0; // team A loses, chase done
        } else if (wicketsLeft <= 0 || ballsRemaining <= 0) {
          wpTeamA = 1; // team A wins, chase failed
        } else {
          const rrr = (need / ballsRemaining) * ballsPerSet(match.format);

          // Max RPO a full-strength team can sustain, by format
          const baseRPO = match.format === "ODI" ? 8.0
                        : match.format === "Test" ? 3.5
                        : match.format === "Hundred" ? 9.5
                        : 9.5; // T20 / T20I

          // Wickets-in-hand reduces achievable RPO via a gentle power curve:
          //   10 wkts → full baseRPO;  4 wkts → ~76%;  2 wkts → ~66%
          // Power 0.25 keeps wickets influential without double-counting.
          const achievableRPO = baseRPO * Math.pow(wicketsLeft / 10, 0.25);

          // Sigmoid: ratio > 1 = chasing team has headroom; < 1 = under pressure
          const ratio = achievableRPO / rrr;
          const wpTeamB = 1 / (1 + Math.exp(-(ratio - 1) * 5));

          // No separate wicket multiplier — already encoded in achievableRPO
          wpTeamA = 1 - wpTeamB;
        }
      }

      const winProbDelta = wpTeamA - prevWP;
      const isInflection = Math.abs(winProbDelta) > 0.05 || ball.isWicket || ball.isBoundary6;

      let inflectionLabel: string | undefined;
      let inflectionKind: WinProbPoint["inflectionKind"];
      if (isInflection) {
        if (ball.isWicket) {
          inflectionLabel = `O ${ball.over}.${ball.ballInOver + 1} — ${ball.batterName} ${ball.dismissalType}, ${formatDelta(winProbDelta, match.teamA.shortName)}`;
          inflectionKind = "wicket";
        } else if (ball.isBoundary6) {
          inflectionLabel = `O ${ball.over}.${ball.ballInOver + 1} — ${ball.batterName} SIX, ${formatDelta(winProbDelta, match.teamA.shortName)}`;
          inflectionKind = "six";
        } else {
          inflectionLabel = `O ${ball.over}.${ball.ballInOver + 1} — momentum shift, ${formatDelta(winProbDelta, match.teamA.shortName)}`;
          inflectionKind = winProbDelta > 0 ? "big-over" : "quiet-over";
        }
      }

      points.push({
        overFloat,
        ballId: ball.id,
        winProbTeamA: clamp01(wpTeamA),
        isInflection,
        inflectionLabel,
        inflectionKind,
      });

      prevWP = wpTeamA;
    }
  }

  return points;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function formatDelta(delta: number, teamACode: string): string {
  const pct = Math.round(delta * 100);
  if (pct === 0) return "no shift";
  if (pct > 0) return `+${pct}% ${teamACode}`;
  return `${pct}% ${teamACode}`;
}

// Per-ball projected score and pressure gauge for the current state
export function calculateProjectedScore(match: Match): { runs: number; perOver: number; confidence: number } | null {
  const totalBalls2 = totalBallsForFormat(match);
  const bps = ballsPerSet(match.format);

  // Path 1: ball-by-ball data available — wicket-adjusted projection
  const live = match.innings.find(i => i.balls.length > 0 && i.balls.length < totalBalls2);
  if (live) {
    const ballsBowled = live.balls.length;
    const cumulativeRuns = live.balls.reduce((s, b) => s + b.runs + b.extras, 0);
    const cumulativeWickets = live.balls.filter(b => b.isWicket).length;
    if (ballsBowled === 0) return null;
    const perOver = cumulativeRuns / (ballsBowled / bps);
    const wicketsLeft = 10 - cumulativeWickets;
    const projectedTotal = cumulativeRuns + (totalBalls2 - ballsBowled) * (perOver / bps) * Math.max(0.7, wicketsLeft / 9);
    return {
      runs: Math.round(projectedTotal),
      perOver: Math.round(perOver * 100) / 100,
      confidence: 0.6 + (ballsBowled / totalBalls2) * 0.3,
    };
  }

  // Path 2: scorecard-level only (overs + runs, no ball objects) — used for matches
  // where live score feeds provide aggregates but not delivery-by-delivery data.
  const liveByOvers = match.innings.find(
    i => i.number === 1 && i.overs > 0 && match.innings.length === 1 && match.status === "live"
  );
  if (!liveByOvers) return null;
  const ballsBowled = Math.round(liveByOvers.overs * bps);
  if (ballsBowled === 0) return null;
  const wicketsLeft = 10 - (liveByOvers.wickets ?? 0);
  const perOver = liveByOvers.runs / liveByOvers.overs;
  const ballsLeft = totalBalls2 - ballsBowled;
  const projectedTotal = liveByOvers.runs + ballsLeft * (perOver / bps) * Math.max(0.7, wicketsLeft / 9);
  return {
    runs: Math.round(projectedTotal),
    perOver: Math.round(perOver * 100) / 100,
    confidence: 0.4,
  };
}

export function calculatePressureGauge(match: Match): { level: number; trend: "rising" | "falling" | "steady" } | null {
  const totalBalls = totalBallsForFormat(match);
  const totalBalls2 = totalBalls;
  const i2 = match.innings.find(i => i.number === 2 && i.balls.length > 0);
  if (!i2) return null;
  const target = match.innings[0].runs + 1;
  const cumulativeRuns = i2.balls.reduce((s, b) => s + b.runs + b.extras, 0);
  const cumulativeWickets = i2.balls.filter(b => b.isWicket).length;
  const ballsBowled = i2.balls.length;
  const ballsRemaining = totalBalls - ballsBowled;
  if (ballsRemaining <= 0) return null;
  const need = target - cumulativeRuns;
  const rrr = (need / ballsRemaining) * ballsPerSet(match.format);
  const wicketsLeft = 10 - cumulativeWickets;

  // Pressure index 0..10
  const rrrPressure = Math.min(10, rrr - 6); // RRR 6 = 0 pressure, 16+ = 10
  const wicketPressure = Math.max(0, (10 - wicketsLeft) * 0.8);
  const level = clamp(0, 10, rrrPressure * 0.7 + wicketPressure * 0.3);

  // Compare to a few balls ago for trend
  const earlierBalls = Math.max(0, ballsBowled - ballsPerSet(match.format));
  const earlierRuns = i2.balls.slice(0, earlierBalls).reduce((s, b) => s + b.runs + b.extras, 0);
  const earlierWickets = i2.balls.slice(0, earlierBalls).filter(b => b.isWicket).length;
  const earlierNeed = target - earlierRuns;
  const earlierBallsRemaining = totalBalls2 - earlierBalls;
  const earlierRRR = earlierBallsRemaining > 0 ? (earlierNeed / earlierBallsRemaining) * 6 : rrr;
  const earlierLevel = clamp(0, 10, Math.min(10, earlierRRR - 6) * 0.7 + Math.max(0, (10 - (10 - earlierWickets)) * 0.8) * 0.3);

  const diff = level - earlierLevel;
  const trend = diff > 0.5 ? "rising" : diff < -0.5 ? "falling" : "steady";
  return { level: Math.round(level * 10) / 10, trend };
}

function clamp(lo: number, hi: number, v: number) {
  return Math.max(lo, Math.min(hi, v));
}
