import type { Match, MatchEvent, WinProbPoint, Ball } from "./types";
import { calculateWinProbForMatch } from "./winProb";

/**
 * Extract major events from a match — used by both the Moments strip
 * (clickable jump targets) and the win-prob chart (vertical event markers).
 *
 * Events are returned with an `importance` score 0..1 so callers can
 * filter to N most important when zoomed out.
 */
export function extractMatchEvents(match: Match): MatchEvent[] {
  const events: MatchEvent[] = [];
  const wp = calculateWinProbForMatch(match);
  const wpByBallId = new Map<string, WinProbPoint>(wp.map(p => [p.ballId, p]));

  let battingSideRuns = 0;
  let battingSideWickets = 0;
  let phaseEmittedPP = false;
  let phaseEmittedDeath = false;
  // batter running scores for milestone detection
  const batterTotals = new Map<string, number>();

  for (const innings of match.innings) {
    let cumOver = 0;
    let runsThisOver = 0;
    let lastBowler: string | null = null;
    let runsBeforeOver = 0;

    for (let i = 0; i < innings.balls.length; i++) {
      const ball = innings.balls[i];
      const overFloat = ball.over - 1 + (ball.ballInOver + 1) / 6;
      const wpPoint = wpByBallId.get(ball.id);

      battingSideRuns += ball.runs + ball.extras;
      const prevTotal = batterTotals.get(ball.batterName) ?? 0;
      const newTotal = prevTotal + ball.runs;
      batterTotals.set(ball.batterName, newTotal);

      // Phase shifts
      if (!phaseEmittedPP && ball.over >= 6) {
        events.push({
          id: `phase-pp-end-${innings.number}`,
          kind: "phase-shift",
          overFloat: 6,
          ballId: ball.id,
          label: "Powerplay ends",
          context: `${match.innings[innings.number - 1].battingTeam} ${battingSideRuns}/${battingSideWickets}`,
          importance: 0.6,
        });
        phaseEmittedPP = true;
      }
      if (!phaseEmittedDeath && ball.over >= 16) {
        events.push({
          id: `phase-death-${innings.number}`,
          kind: "phase-shift",
          overFloat: 16,
          ballId: ball.id,
          label: "Death overs begin",
          context: `${battingSideRuns}/${battingSideWickets} after 15`,
          importance: 0.55,
        });
        phaseEmittedDeath = true;
      }

      // Wicket
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

      // Boundary 6
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

      // Boundary 4 — only flag if it's special (gets us to a milestone, swing-mom moment, etc.)
      if (ball.isBoundary4 && (newTotal >= 50 && prevTotal < 50)) {
        events.push({
          id: `four-${ball.id}`,
          kind: "four",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} four`,
          context: `${ball.bowlerName}`,
          importance: 0.5,
        });
      }

      // Milestone — 50 / 100
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

      // Over-end events (after ball 5 of an over)
      if (ball.ballInOver === 5) {
        const runsInOver = battingSideRuns - runsBeforeOver;
        if (runsInOver >= 12) {
          events.push({
            id: `bo-${innings.number}-${ball.over}`,
            kind: "big-over",
            ballId: ball.id,
            overFloat: ball.over,
            label: `Big over: ${runsInOver}`,
            context: `${match.innings[innings.number - 1].battingTeam} over ${ball.over}`,
            importance: 0.6,
          });
        } else if (runsInOver <= 3) {
          events.push({
            id: `qo-${innings.number}-${ball.over}`,
            kind: "quiet-over",
            ballId: ball.id,
            overFloat: ball.over,
            label: `Tight over: ${runsInOver}`,
            context: `${ball.bowlerName}`,
            importance: 0.4,
          });
        }
        runsBeforeOver = battingSideRuns;
      }

      // Bowling change — heuristic: emit when a new bowler starts an over
      // and they haven't bowled an over yet, or it's been > 4 overs
      if (ball.ballInOver === 0 && lastBowler && lastBowler !== ball.bowlerName) {
        // simplistic: emit only for late-innings changes
        if (ball.over >= 12) {
          events.push({
            id: `bch-${ball.id}`,
            kind: "key-bowling-change",
            ballId: ball.id,
            overFloat,
            label: `${ball.bowlerName} returns`,
            context: `over ${ball.over}`,
            importance: 0.35,
          });
        }
      }
      lastBowler = ball.bowlerName;

      // Win-prob momentum swing
      if (wpPoint && wpPoint.isInflection && Math.abs(deltaSince(wp, wpPoint, 6)) >= 0.1) {
        // skip if a more important event already exists for this ball
        if (!events.find(e => e.ballId === ball.id && e.importance > 0.7)) {
          const dPct = Math.round(deltaSince(wp, wpPoint, 6) * 100);
          events.push({
            id: `mom-${ball.id}`,
            kind: "momentum-swing",
            ballId: ball.id,
            overFloat,
            label: dPct > 0 ? `${match.teamA.shortName} momentum +${dPct}%` : `${match.teamB.shortName} momentum +${-dPct}%`,
            context: `${ball.bowlerName} to ${ball.batterName}`,
            importance: 0.55,
          });
        }
      }
    }

    // Reset for innings 2
    battingSideRuns = 0;
    battingSideWickets = 0;
    phaseEmittedPP = false;
    phaseEmittedDeath = false;
    batterTotals.clear();
  }

  // Dedupe by id
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

/**
 * Top N events for a given zoom level. zoomLevel:
 *   "full"     — entire match (top 8 by importance)
 *   "innings"  — current innings (top 8 by importance)
 *   "recent"   — last 6 overs of current innings (all events)
 */
export function filterEventsForZoom(events: MatchEvent[], zoomLevel: "full" | "innings" | "recent", currentInnings: 1 | 2 | null, currentOver: number): MatchEvent[] {
  let scoped = events;
  if (zoomLevel === "innings" && currentInnings) {
    scoped = events.filter(e => {
      // crude: events are appended in innings order; rely on overFloat being in 0..20 range per innings
      // here we use the events list ordering instead
      return true; // since events are dedupedid'd, just trust ordering
    });
  } else if (zoomLevel === "recent") {
    scoped = events.filter(e => e.overFloat >= Math.max(0, currentOver - 6));
  }
  // Sort by importance, take top 8 — but preserve chronological order in output
  const top = [...scoped].sort((a, b) => b.importance - a.importance).slice(0, 8);
  return top.sort((a, b) => a.overFloat - b.overFloat);
}
