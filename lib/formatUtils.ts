/**
 * Format-specific cricket rules.
 *
 * All format constants live here so changes propagate everywhere automatically.
 * Import what you need — never duplicate these values inline.
 */

import type { MatchFormat } from "./types";
import type { Ball } from "./types";

// ─── Core constants ────────────────────────────────────────────────────────────

/** Legal deliveries per innings per side. */
export function totalBallsFor(format: MatchFormat): number {
  if (format === "Test")    return 450;   // unlimited in practice; capped for modelling
  if (format === "ODI")     return 300;   // 50 × 6
  if (format === "Hundred") return 100;   // 100-ball format
  return 120;                             // T20 / T20I  (20 × 6)
}

/** Deliveries per bowling "set" / over. */
export function ballsPerSet(format: MatchFormat): number {
  return format === "Hundred" ? 5 : 6;
}

/**
 * Powerplay length in balls (fielding restriction: ≤ 2 outside circle).
 *  - T20 / T20I : first 6 overs  = 36 balls
 *  - ODI        : first 10 overs = 60 balls
 *  - Hundred    : first 25 balls (official rule)
 *  - Test       : no formal powerplay
 */
export function powerplayBalls(format: MatchFormat): number {
  if (format === "Hundred") return 25;
  if (format === "ODI")     return 60;
  if (format === "Test")    return 0;
  return 36; // T20 / T20I
}

/**
 * Maximum balls a single bowler may bowl in an innings.
 *  - Hundred : 20  (4 × 5-ball sets)
 *  - T20/T20I: 24  (4 × 6-ball overs)
 *  - ODI     : 60  (10 × 6-ball overs)
 *  - Test    : unlimited
 */
export function maxBowlerBalls(format: MatchFormat): number {
  if (format === "Hundred") return 20;
  if (format === "ODI")     return 60;
  if (format === "Test")    return Infinity;
  return 24; // T20 / T20I
}

// ─── Ball-number helpers ───────────────────────────────────────────────────────

/**
 * Absolute 1-based ball number within the innings.
 * For Hundred: set × 5 + ballInSet + 1
 * For all others: over × 6 + ballInOver + 1
 */
export function absoluteBallNumber(ball: Ball, format: MatchFormat): number {
  return ball.over * ballsPerSet(format) + ball.ballInOver + 1;
}

/**
 * Short label for a single delivery.
 *   Hundred → "Ball 84"
 *   others  → "16.4"
 */
export function ballLabel(ball: Ball, format: MatchFormat): string {
  if (format === "Hundred") {
    return `Ball ${absoluteBallNumber(ball, format)}`;
  }
  return `${ball.over}.${ball.ballInOver + 1}`;
}

/**
 * Overs/progress label for a running innings total (from innings.overs float).
 *   Hundred → "Ball 84"   (uses ballsDone computed from the overs float)
 *   others  → "Over 16.4"
 */
export function inningsProgressLabel(oversFloat: number, format: MatchFormat): string {
  if (format === "Hundred") {
    const ballsDone = Math.round(oversFloat * ballsPerSet(format));
    return `Ball ${ballsDone}`;
  }
  return `Over ${Math.floor(oversFloat)}.${Math.round((oversFloat % 1) * 10)}`;
}

/**
 * "Need X off Y" or "Over / Ball X" situation string.
 * Used in BallGIF context header and share card.
 */
export function situationLabel(
  ball: Ball,
  format: MatchFormat,
  inningsNumber: number,
  chaseRemaining: number | null,  // null if 1st innings
): string {
  if (chaseRemaining !== null && chaseRemaining > 0) {
    const totalBalls  = totalBallsFor(format);
    const ballsDone   = absoluteBallNumber(ball, format);
    const ballsLeft   = totalBalls - ballsDone;
    if (ballsLeft > 0) return `Need ${chaseRemaining} off ${ballsLeft}`;
  }
  if (format === "Hundred") {
    return `Ball ${absoluteBallNumber(ball, format)}`;
  }
  return `Over ${ball.over}.${ball.ballInOver + 1}`;
}

/** True if the ball is inside the powerplay window. */
export function isInPowerplay(ball: Ball, format: MatchFormat): boolean {
  return absoluteBallNumber(ball, format) <= powerplayBalls(format);
}

/** Label for a bowling "over" / set. */
export function setLabel(format: MatchFormat): string {
  return format === "Hundred" ? "Set" : "Over";
}
