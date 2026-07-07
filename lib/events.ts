import type { Match, MatchEvent, Ball } from "./types";
import { ballsPerSet, absoluteBallNumber } from "./formatUtils";

export function extractMatchEvents(match: Match): MatchEvent[] {
  const events: MatchEvent[] = [];
  const bps = ballsPerSet(match.format);

  for (const innings of match.innings) {
    // Track state for computed events
    const batterTotals = new Map<string, number>();       // batter name → cumulative runs
    const batterBallsFaced = new Map<string, number>();   // batter name → balls faced
    const bowlerWickets = new Map<string, number>();      // bowler name → total wickets this innings
    // For hat-trick: track the last two consecutive wicket balls per bowler
    // consecutive = no non-wicket ball from that bowler in between
    const bowlerLastTwoWicketConsec = new Map<string, number>(); // bowler → count of consecutive wkt deliveries

    for (let i = 0; i < innings.balls.length; i++) {
      const ball = innings.balls[i];
      const overFloat = ball.over - 1 + (ball.ballInOver + 1) / bps;
      const isFaced = ball.extraType !== "wd";

      // Accumulate batter stats
      const prevRuns = batterTotals.get(ball.batterName) ?? 0;
      const newRuns  = prevRuns + ball.runs;
      batterTotals.set(ball.batterName, newRuns);
      if (isFaced) {
        const prevBalls = batterBallsFaced.get(ball.batterName) ?? 0;
        batterBallsFaced.set(ball.batterName, prevBalls + 1);
      }

      // ── Debut ──────────────────────────────────────────────────────────────
      if (ball.isDebut) {
        // Could be batter's debut (first ball of their innings AND debut flag)
        // or bowler's debut — label accordingly
        const isFirst = !batterBallsFaced.has(ball.batterName) || batterBallsFaced.get(ball.batterName) === (isFaced ? 1 : 0);
        events.push({
          id: `debut-${ball.id}`,
          kind: "debut",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} debut`,
          context: `${ball.bowlerName} · first international delivery`,
          importance: 0.75,
        });
      }

      // ── Six ────────────────────────────────────────────────────────────────
      if (ball.isBoundary6) {
        events.push({
          id: `six-${ball.id}`,
          kind: "six",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} SIX`,
          context: `${ball.bowlerName}${ball.shotType ? ` · ${ball.shotType}` : ""}`,
          importance: 0.70,
        });
      }

      // ── Four ───────────────────────────────────────────────────────────────
      if (ball.isBoundary4) {
        events.push({
          id: `four-${ball.id}`,
          kind: "four",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} FOUR`,
          context: `${ball.bowlerName}${ball.shotType ? ` · ${ball.shotType}` : ""}`,
          importance: 0.55,
        });
      }

      // ── Batter milestones ─────────────────────────────────────────────────
      const ballsFaced = batterBallsFaced.get(ball.batterName) ?? 0;
      if (prevRuns < 50 && newRuns >= 50) {
        events.push({
          id: `ms-50-${ball.id}`,
          kind: "milestone",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} 50`,
          context: `${newRuns} off ${ballsFaced} balls`,
          importance: 0.85,
        });
      }
      if (prevRuns < 100 && newRuns >= 100) {
        events.push({
          id: `ms-100-${ball.id}`,
          kind: "milestone",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} 100`,
          context: `${newRuns} off ${ballsFaced} balls`,
          importance: 0.98,
        });
      }

      // ── Wicket ────────────────────────────────────────────────────────────
      if (ball.isWicket) {
        const prevWkts = bowlerWickets.get(ball.bowlerName) ?? 0;
        const newWkts  = prevWkts + 1;
        bowlerWickets.set(ball.bowlerName, newWkts);

        // Hat-trick detection: this bowler had 2 consecutive wickets before this
        const consec = bowlerLastTwoWicketConsec.get(ball.bowlerName) ?? 0;
        const isHatTrick = consec >= 2;

        if (isHatTrick) {
          events.push({
            id: `hattrick-${ball.id}`,
            kind: "hat-trick-ball",
            ballId: ball.id,
            overFloat,
            label: `${ball.bowlerName} HAT-TRICK!`,
            context: `${ball.batterName} ${ball.dismissalType ?? "out"}`,
            importance: 1.0,
          });
        }

        // 5-for
        if (newWkts === 5) {
          events.push({
            id: `fivefor-${ball.id}`,
            kind: "five-for",
            ballId: ball.id,
            overFloat,
            label: `${ball.bowlerName} 5-for`,
            context: `${newWkts} wickets this innings`,
            importance: 0.97,
          });
        }

        // Regular wicket event (don't add if hat-trick already pushed — still push for clarity)
        events.push({
          id: `wkt-${ball.id}`,
          kind: "wicket",
          ballId: ball.id,
          overFloat,
          label: `${ball.batterName} out`,
          context: `${ball.dismissalType ?? "dismissed"} · ${ball.bowlerName} · ${prevRuns}(${ballsFaced})`,
          importance: 0.90,
        });

        // Update consecutive wicket counter for this bowler
        bowlerLastTwoWicketConsec.set(ball.bowlerName, consec + 1);
      } else {
        // Any non-wicket delivery resets that bowler's consecutive count
        // (only resets for the bowler bowling THIS ball)
        if (ball.bowlerName) {
          bowlerLastTwoWicketConsec.set(ball.bowlerName, 0);
        }
      }

      // ── Near run-out ──────────────────────────────────────────────────────
      if (ball.isNearRunOut) {
        events.push({
          id: `nro-${ball.id}`,
          kind: "near-runout",
          ballId: ball.id,
          overFloat,
          label: `Near run-out miss`,
          context: `${ball.batterName} · ${ball.bowlerName}`,
          importance: 0.60,
        });
      }

      // ── Overthrows ────────────────────────────────────────────────────────
      if (ball.overthrows && ball.overthrows > 0) {
        events.push({
          id: `ot-${ball.id}`,
          kind: "overthrow",
          ballId: ball.id,
          overFloat,
          label: `Overthrows +${ball.overthrows}`,
          context: `${ball.batterName} · ${ball.bowlerName}`,
          importance: 0.55,
        });
      }

      // ── DRS review ───────────────────────────────────────────────────────
      if (ball.isDRSReview) {
        const resultLabel = ball.drsResult
          ? ball.drsResult === "upheld" ? "Review upheld"
          : ball.drsResult === "overturned" ? "Decision overturned"
          : "Umpire's call"
          : "DRS review";
        events.push({
          id: `drs-${ball.id}`,
          kind: "drs-review",
          ballId: ball.id,
          overFloat,
          label: resultLabel,
          context: `${ball.batterName} vs ${ball.bowlerName}`,
          importance: 0.65,
        });
      }
    }
  }

  const seen = new Set<string>();
  return events.filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

function ballsFacedByBatter(balls: Ball[], batter: string, uptoIdx: number): number {
  let count = 0;
  for (let i = 0; i <= uptoIdx; i++) {
    if (balls[i].batterName === batter && balls[i].extraType !== "wd") count++;
  }
  return count;
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
  const top = [...scoped].sort((a, b) => b.importance - a.importance).slice(0, 12);
  return top.sort((a, b) => a.overFloat - b.overFloat);
}
