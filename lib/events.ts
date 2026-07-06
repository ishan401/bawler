import type { Match, MatchEvent, WinProbPoint, Ball } from "./types";
import { calculateWinProbForMatch } from "./winProb";
import { ballsPerSet, absoluteBallNumber, formatPhases, setLabel } from "./formatUtils";

export function extractMatchEvents(match: Match): MatchEvent[] {
  const events: MatchEvent[] = [];
  const wp = calculateWinProbForMatch(match);
  const wpByBallId = new Map<string, WinProbPoint>(wp.map(p => [p.ballId, p]));

  const bps    = ballsPerSet(match.format);
  const phases = formatPhases(match.format);

  for (const innings of match.innings) {
    let battingSideRuns    = 0;
    let battingSideWickets = 0;
    let phaseEmittedPP     = false;
    let phaseEmittedDeath  = false;
    let runsBeforeSet      = 0;
    let lastBowler: string | null = null;
    const batterTotals = new Map<string, number>();

    for (let i = 0; i < innings.balls.length; i++) {
      const ball   = innings.balls[i];
      // 0-indexed overFloat: last T20 ball = 19.something not 20.something
      const overFloat = ball.over - 1 + (ball.ballInOver + 1) / bps;
      const absBall   = absoluteBallNumber(ball, match.format);
      const wpPoint   = wpByBallId.get(ball.id);

      battingSideRuns += ball.runs + ball.extras;
      const prevTotal = batterTotals.get(ball.batterName) ?? 0;
      const newTotal  = prevTotal + ball.runs;
      batterTotals.set(ball.batterName, newTotal);

      // ── Powerplay end ────────────────────────────────────────────────────────
      if (!phaseEmittedPP) {
        const ppDone = match.format === "Hundred"
          ? absBall > (phases.powerplayBallEnd ?? 25)
          : phases.powerplayEndOver > 0 && ball.over >= phases.powerplayEndOver;

        if (ppDone) {
          events.push({
            id: `phase-pp-end-${innings.number}`,
            kind: "phase-shift",
            overFloat: match.format === "Hundred" ? overFloat : phases.powerplayEndOver - 1,
            ballId: ball.id,
            label: "Powerplay ends",
            context: `${innings.battingTeam} ${battingSideRuns}/${battingSideWickets}`,
            importance: 0.6,
          });
          phaseEmittedPP = true;
        }
      }

      // ── Death overs/balls begin ──────────────────────────────────────────────
      if (!phaseEmittedDeath) {
        const deathStarts = match.format === "Hundred"
          ? absBall >= (phases.deathBallStart ?? 76)
          : phases.deathStartOver > 0 && ball.over >= phases.deathStartOver;

        if (deathStarts) {
          events.push({
            id: `phase-death-${innings.number}`,
            kind: "phase-shift",
            overFloat: match.format === "Hundred" ? overFloat : phases.deathStartOver - 1,
            ballId: ball.id,
            label: "Death overs begin",
            context: `${battingSideRuns}/${battingSideWickets}`,
            importance: 0.55,
          });
          phaseEmittedDeath = true;
        }
      }

      // ── Wicket ──────────────────────────────────────────────────────────────
      if (ball.isWicket) {
        battingSideWickets++;
        events.push({
          id: `wkt-${ball.id}`,
          kind: "wicket",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} ${ball.dismissalType ?? "out"}`,
          context: `${ball.bowlerName} · ${prevTotal} off ${ballsFacedByBatter(innings.balls, ball.batterName, i)}`,
          importance: 0.95,
        });
      }

      // ── Six ─────────────────────────────────────────────────────────────────
      if (ball.isBoundary6) {
        events.push({
          id: `six-${ball.id}`,
          kind: "six",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} SIX`,
          context: `${ball.bowlerName} · ${formatShotMeta(ball)}`,
          importance: 0.65,
        });
      }

      // ── Four (only if batter milestone nearby) ───────────────────────────────
      if (ball.isBoundary4 && newTotal >= 50 && prevTotal < 50) {
        events.push({
          id: `four-${ball.id}`,
          kind: "four",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} four`,
          context: ball.bowlerName,
          importance: 0.5,
        });
      }

      // ── Batter milestones ────────────────────────────────────────────────────
      if (prevTotal < 50 && newTotal >= 50) {
        events.push({
          id: `ms-50-${ball.id}`,
          kind: "milestone",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} reaches 50`,
          context: `${newTotal} off ${ballsFacedByBatter(innings.balls, ball.batterName, i)} balls`,
          importance: 0.8,
        });
      }
      if (prevTotal < 100 && newTotal >= 100) {
        events.push({
          id: `ms-100-${ball.id}`,
          kind: "milestone",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} century`,
          context: `${newTotal} off ${ballsFacedByBatter(innings.balls, ball.batterName, i)} balls`,
          importance: 0.98,
        });
      }

      // ── Over / set end ──────────────────────────────────────────────────────
      if (ball.ballInOver === bps - 1) {
        const runsInSet     = battingSideRuns - runsBeforeSet;
        const bigThreshold  = match.format === "ODI" ? 9 : 12;
        const tightThreshold = match.format === "ODI" ? 2 : 3;
        const sl            = setLabel(match.format);

        if (runsInSet >= bigThreshold) {
          events.push({
            id: `bo-${innings.number}-${ball.over}`,
            kind: "big-over",
            ballId: ball.id,
            overFloat,
            label: `Big ${sl}: ${runsInSet}`,
            context: `${innings.battingTeam} ${sl.toLowerCase()} ${ball.over - 1}`,
            importance: 0.6,
          });
        } else if (runsInSet <= tightThreshold) {
          events.push({
            id: `qo-${innings.number}-${ball.over}`,
            kind: "quiet-over",
            ballId: ball.id,
            overFloat,
            label: `Tight ${sl}: ${runsInSet}`,
            context: ball.bowlerName,
            importance: 0.4,
          });
        }
        runsBeforeSet = battingSideRuns;
      }

      // ── Bowling change (late innings only) ───────────────────────────────────
      const deathThreshold = match.format === "Hundred"
        ? (phases.deathBallStart ?? 76)
        : phases.deathStartOver > 0
          ? phases.deathStartOver
          : Math.ceil((match.format === "ODI" ? 50 : 20) * 0.6);
      const lateGame = match.format === "Hundred"
        ? absBall >= deathThreshold
        : ball.over >= deathThreshold;

      if (ball.ballInOver === 0 && lastBowler && lastBowler !== ball.bowlerName && lateGame) {
        events.push({
          id: `bch-${ball.id}`,
          kind: "key-bowling-change",
          ballId: ball.id,
          overFloat,
          label: `${ball.bowlerName} returns`,
          context: `over ${ball.over - 1}`,
          importance: 0.35,
        });
      }
      lastBowler = ball.bowlerName;

      // ── Win-prob momentum swing ─────────────────────────────────────────────
      if (wpPoint?.isInflection && Math.abs(deltaSince(wp, wpPoint, 6)) >= 0.1) {
        if (!events.find(e => e.ballId === ball.id && e.importance > 0.7)) {
          const dPct = Math.round(deltaSince(wp, wpPoint, 6) * 100);
          events.push({
            id: `mom-${ball.id}`,
            kind: "momentum-swing",
            ballId: ball.id,
            overFloat,
            label: dPct > 0
              ? `${match.teamA.shortName} momentum +${dPct}%`
              : `${match.teamB.shortName} momentum +${-dPct}%`,
            context: `${ball.bowlerName} to ${ball.batterName}`,
            importance: 0.55,
          });
        }
      }
    }
  }

  const seen = new Set<string>();
  return events.filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

function ballsFacedByBatter(balls: Ball[], batter: string, uptoIdx: number): number {
  let count = 0;
  for (let i = 0; i <= uptoIdx; i++) {
    if (balls[i].batterName === batter && !balls[i].extras) count++;
  }
  return count;
}

function formatShotMeta(b: Ball): string {
  const parts: string[] = [];
  if (b.shotType && b.shotType !== "defensive") parts.push(b.shotType);
  if (b.shotIsAerial) parts.push("aerial");
  return parts.length ? parts.join(" · ") : "boundary";
}

function deltaSince(wp: WinProbPoint[], point: WinProbPoint, ballsBack: number): number {
  const idx = wp.findIndex(p => p.ballId === point.ballId);
  if (idx <= 0) return 0;
  const baseIdx = Math.max(0, idx - ballsBack);
  return wp[idx].winProbTeamA - wp[baseIdx].winProbTeamA;
}

export function filterEventsForZoom(
  events: MatchEvent[],
  zoomLevel: "full" | "innings" | "recent",
  _currentInnings: 1 | 2 | null,
  currentOver: number,
): MatchEvent[] {
  let scoped = events;
  if (zoomLevel === "recent") {
    scoped = events.filter(e => e.overFloat >= Math.max(0, currentOver - 6));
  }
  const top = [...scoped].sort((a, b) => b.importance - a.importance).slice(0, 8);
  return top.sort((a, b) => a.overFloat - b.overFloat);
}
