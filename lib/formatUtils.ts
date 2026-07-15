/**
 * Format-specific cricket rules — single source of truth.
 * Import from here; never duplicate inline.
 */

import type { MatchFormat, Ball, Innings } from "./types";

// ─── Core constants ────────────────────────────────────────────────────────────

/** Legal deliveries per innings. */
export function totalBallsFor(format: MatchFormat): number {
  if (format === "Test")    return 450;   // unlimited; capped for modelling
  if (format === "ODI")     return 300;   // 50 × 6
  if (format === "Hundred") return 100;   // 100-ball format
  return 120;                             // T20 / T20I (20 × 6)
}

/** Deliveries per bowling set / over. 5 for Hundred, 6 for all others. */
export function ballsPerSet(format: MatchFormat): number {
  return format === "Hundred" ? 5 : 6;
}

/**
 * Powerplay length in legal deliveries.
 *   T20 / T20I : 6 overs  = 36 balls
 *   ODI        : 10 overs = 60 balls
 *   Hundred    : 25 balls (official rule)
 *   Test       : no powerplay
 */
export function powerplayBalls(format: MatchFormat): number {
  if (format === "Hundred") return 25;
  if (format === "ODI")     return 60;
  if (format === "Test")    return 0;
  return 36;
}

/**
 * Maximum balls one bowler may bowl per innings.
 *   Hundred : 20  (4 × 5-ball sets)
 *   T20/T20I: 24  (4 × 6-ball overs)
 *   ODI     : 60  (10 overs)
 *   Test    : unlimited
 */
export function maxBowlerBalls(format: MatchFormat): number {
  if (format === "Hundred") return 20;
  if (format === "ODI")     return 60;
  if (format === "Test")    return Infinity;
  return 24;
}

// ─── Phase thresholds (1-indexed ball.over values) ───────────────────────────

export interface FormatPhases {
  /** First ball.over value AFTER the powerplay (exclusive). 0 = no powerplay. */
  powerplayEndOver: number;
  /** First ball.over value where death overs begin (inclusive). 0 = no death phase. */
  deathStartOver: number;
  /** For Hundred (ball-based): absolute ball number after which powerplay ends. */
  powerplayBallEnd?: number;
  /** For Hundred (ball-based): absolute ball number at which death phase starts. */
  deathBallStart?: number;
}

/**
 * Official phase boundaries per format.
 * All over values are 1-indexed (matching ball.over in our data model).
 */
export function formatPhases(format: MatchFormat): FormatPhases {
  if (format === "Hundred") {
    // Powerplay = balls 1–25; Death = balls 76–100
    return { powerplayEndOver: 0, deathStartOver: 0, powerplayBallEnd: 25, deathBallStart: 76 };
  }
  if (format === "ODI") {
    // Powerplay = overs 1–10; Death = overs 41–50
    return { powerplayEndOver: 11, deathStartOver: 41 };
  }
  if (format === "Test") {
    return { powerplayEndOver: 0, deathStartOver: 0 };
  }
  // T20 / T20I: Powerplay = overs 1–6; Death = overs 16–20
  return { powerplayEndOver: 7, deathStartOver: 16 };
}

/** Human-readable phase label. */
export function phaseLabel(
  phase: "powerplay" | "middle" | "death",
  format: MatchFormat,
): string {
  if (format === "Hundred") {
    return phase === "powerplay" ? "Power Play (25 balls)"
         : phase === "death"     ? "Death (last 25 balls)"
         : "Middle";
  }
  if (format === "ODI") {
    return phase === "powerplay" ? "Powerplay (10 ov)"
         : phase === "death"     ? "Death overs (41–50)"
         : "Middle overs";
  }
  // T20 / T20I
  return phase === "powerplay" ? "Powerplay (6 ov)"
       : phase === "death"     ? "Death overs (16–20)"
       : "Middle overs";
}

// ─── Ball-number helpers ───────────────────────────────────────────────────────

/**
 * 1-based absolute ball number within the innings.
 *
 * ball.over is 1-indexed (first over = 1), so we subtract 1 before
 * multiplying to get a 0-based completed-set count.
 *
 *   over=1, ballInOver=0 → (1-1)×6 + 0 + 1 = 1   (first ball ever)
 *   over=20, ballInOver=5 → (20-1)×6 + 5 + 1 = 120 (last ball of T20)
 */
export function absoluteBallNumber(ball: Ball, format: MatchFormat): number {
  return (ball.over - 1) * ballsPerSet(format) + ball.ballInOver + 1;
}

/**
 * Short ball label — Cricinfo convention:
 *   completed_overs_in_over.ball_in_current_over
 *
 *   over=1, ballInOver=0 → "0.1"  (0 complete overs, 1st ball)
 *   over=20, ballInOver=5 → "19.6" (19 complete overs, 6th ball)
 *
 * For Hundred: "Ball 84"
 */
export function ballLabel(ball: Ball, format: MatchFormat): string {
  if (format === "Hundred") {
    return `Ball ${absoluteBallNumber(ball, format)}`;
  }
  return `${ball.over - 1}.${ball.ballInOver + 1}`;
}

/**
 * Innings progress label from a running overs float (already 0-indexed).
 *   oversFloat=16.0 → "Over 16.0"
 *   Hundred → "Ball 80"
 */
export function inningsProgressLabel(oversFloat: number, format: MatchFormat): string {
  if (format === "Hundred") {
    const ballsDone = Math.round(oversFloat * ballsPerSet(format));
    return `Ball ${ballsDone}`;
  }
  return `Over ${Math.floor(oversFloat)}.${Math.round((oversFloat % 1) * 10)}`;
}

/**
 * "Need X off Y" situation string, or "Over X.Y" / "Ball X" label.
 * Used in BallGIF context header and share card.
 */
export function situationLabel(
  ball: Ball,
  format: MatchFormat,
  _inningsNumber: number,
  chaseRemaining: number | null,
): string {
  if (chaseRemaining !== null && chaseRemaining > 0) {
    const ballsDone = absoluteBallNumber(ball, format);
    const ballsLeft = totalBallsFor(format) - ballsDone;
    if (ballsLeft > 0) return `Need ${chaseRemaining} off ${ballsLeft}`;
  }
  return ballLabel(ball, format);
}

/** True if this ball is inside the powerplay window. */
export function isInPowerplay(ball: Ball, format: MatchFormat): boolean {
  const phases = formatPhases(format);
  if (format === "Hundred") {
    return absoluteBallNumber(ball, format) <= (phases.powerplayBallEnd ?? 25);
  }
  if (phases.powerplayEndOver === 0) return false;
  return ball.over < phases.powerplayEndOver;
}

/**
 * Which innings THIS IS FOR THE BATTING TEAM (1st or 2nd) — not the global
 * sequence position in match.innings. A team's 2nd Test innings is always
 * "Innings 2" in cricket terms, never "Innings 3" or "Innings 4" (there is
 * no such thing as a team's 3rd/4th innings; only the match-wide ball order
 * reaches that high, once both teams have batted twice).
 *
 * For non-Test formats every team bats exactly once, so this always
 * returns 1 -- it's a safe no-op there.
 */
export function teamInningsOccurrence(allInnings: Innings[], target: Innings): number {
  let count = 0;
  for (const inn of allInnings) {
    if (inn.battingTeam === target.battingTeam) {
      count++;
      if (inn === target || inn.number === target.number) break;
    }
  }
  return count || 1;
}

/** "1st"/"2nd"/"3rd"/"4th" for small positive integers (innings/day counts). */
export function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

/** "Over" or "Set" depending on format. */
export function setLabel(format: MatchFormat): string {
  return format === "Hundred" ? "Set" : "Over";
}

/**
 * Team score display string, honoring the standard cricket "all out"
 * convention: when a team is bowled out, the wicket count is dropped
 * entirely -- "187", never "187/10" and never a dangling "187/". The same
 * applies whenever a wicket count simply isn't available (undefined/null),
 * which is the actual root cause this guards against: some completed-match
 * summaries were missing their wickets field, and a plain
 * `${runs}/${wickets}` interpolation there produced a bare trailing slash.
 * Every other count (0-9) renders normally, including "runs/0" for an
 * opening stand that hasn't lost a wicket -- 0 is a real, displayable
 * value, not an absent one.
 */
export function formatScore(runs: number, wickets?: number | null): string {
  if (wickets == null || wickets >= 10) return `${runs}`;
  return `${runs}/${wickets}`;
}
