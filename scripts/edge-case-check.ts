// One-off verification script for the real-data-readiness fixes:
//   1. multi-part surname → display name resolution
//   2. rain-delay-sized gap → Test session derivation
//   3. null/zero 1st-innings runs → win-prob target handling
// Not part of the app; run with `npx tsx scripts/edge-case-check.ts`.

import { getPlayerShortName } from "../lib/mockData";
import { deriveTestSessions } from "../lib/transformers";
import { calculateWinProbForMatch } from "../lib/winProb";
import { normalizeMatch } from "../lib/dataValidation";
import type { Ball, Match, Team, Venue, Competition } from "../lib/types";

let failures = 0;
function check(label: string, cond: boolean, detail: string) {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label} — ${detail}`);
  }
}

// ============================================================================
// 1. Multi-part surname
// ============================================================================
console.log("\n--- 1. Multi-part surname (lastName / getPlayerShortName) ---");

// Not in the PLAYERS registry: should return the FULL name unchanged, never
// a wrong guessed split like "Silva" or "Dussen".
const unknownCompound = getPlayerShortName("Dimuth de Silva");
check(
  "unknown compound surname returns full name (no guessed split)",
  unknownCompound === "Dimuth de Silva",
  `got ${JSON.stringify(unknownCompound)}`
);

const unknownCompound2 = getPlayerShortName("Rassie van der Dussen");
check(
  "unknown compound surname (3-part) returns full name unchanged",
  unknownCompound2 === "Rassie van der Dussen",
  `got ${JSON.stringify(unknownCompound2)}`
);

// A player that IS in the registry with a genuine short surname should
// still resolve to the registry's explicit shortName (not a split guess).
const known = getPlayerShortName("Virat Kohli");
check(
  "known player resolves via registry shortName",
  known === "V Kohli",
  `got ${JSON.stringify(known)}`
);

// null/undefined/empty safety (previous behavior preserved)
check("null input returns empty string", getPlayerShortName(null) === "", `got ${JSON.stringify(getPlayerShortName(null))}`);
check("undefined input returns empty string", getPlayerShortName(undefined) === "", `got ${JSON.stringify(getPlayerShortName(undefined))}`);

// ============================================================================
// 2. Rain-delay-sized gap in Test ball timestamps
// ============================================================================
console.log("\n--- 2. Rain-delay-sized gap (deriveTestSessions) ---");

function makeBall(over: number, ballInOver: number, timestampIso: string): Ball {
  return {
    id: `b-${over}-${ballInOver}-${timestampIso}`,
    inningsNumber: 1,
    over,
    ballInOver,
    timestampIso,
    batterId: "p1", batterName: "Test Batter",
    bowlerId: "p2", bowlerName: "Test Bowler",
    runs: 1, extras: 0,
    isWicket: false, isBoundary4: false, isBoundary6: false,
  };
}

const matchStart = "2026-07-20T04:00:00.000Z"; // Day 1 start, 04:00 UTC

// Session 1 play: overs 1-30, one ball every ~90s, all within first ~45 min.
const sessionOneBalls: Ball[] = [];
{
  let t = new Date("2026-07-20T04:00:00.000Z").getTime();
  let over = 1, ballInOver = 0;
  for (let i = 0; i < 30 * 6; i++) {
    sessionOneBalls.push(makeBall(over, ballInOver, new Date(t).toISOString()));
    t += 90 * 1000;
    ballInOver++;
    if (ballInOver === 6) { ballInOver = 0; over++; }
  }
}
const afterSessionOne = new Date(sessionOneBalls[sessionOneBalls.length - 1].timestampIso).getTime();

// A genuine lunch break: 40 minutes later, resumes session 2 as normal.
const lunchBreakStart = afterSessionOne + 40 * 60 * 1000;
const sessionTwoBalls: Ball[] = [];
{
  let t = lunchBreakStart;
  let over = 31, ballInOver = 0;
  for (let i = 0; i < 20 * 6; i++) {
    sessionTwoBalls.push(makeBall(over, ballInOver, new Date(t).toISOString()));
    t += 90 * 1000;
    ballInOver++;
    if (ballInOver === 6) { ballInOver = 0; over++; }
  }
}
const afterSessionTwo = new Date(sessionTwoBalls[sessionTwoBalls.length - 1].timestampIso).getTime();

// A 3-HOUR rain delay mid "session 2 continuation" — NOT a real lunch/tea
// break — then play resumes the SAME session on the SAME day.
const rainDelayResumeMs = afterSessionTwo + 3 * 60 * 60 * 1000;
const afterRainBalls: Ball[] = [];
{
  let t = rainDelayResumeMs;
  let over = 51, ballInOver = 0;
  for (let i = 0; i < 10 * 6; i++) {
    afterRainBalls.push(makeBall(over, ballInOver, new Date(t).toISOString()));
    t += 90 * 1000;
    ballInOver++;
    if (ballInOver === 6) { ballInOver = 0; over++; }
  }
}

const allBallsDay1 = [...sessionOneBalls, ...sessionTwoBalls, ...afterRainBalls];
const sessionsWithRainDelay = deriveTestSessions(allBallsDay1, matchStart, false);

check(
  "rain-delay gap does NOT create a spurious extra session (still 2 sessions for the day)",
  sessionsWithRainDelay.length === 2,
  `got ${sessionsWithRainDelay.length} sessions: ${JSON.stringify(sessionsWithRainDelay.map(s => s.label))}`
);

const secondSession = sessionsWithRainDelay[1];
check(
  "the rain-delayed play stays labeled as the 2nd session (not mislabeled as a 3rd)",
  secondSession?.session === "second",
  `got ${JSON.stringify(secondSession)}`
);
check(
  "the rain-delayed session's over range extends across the delay (30→60)",
  secondSession?.startOver === 31 && secondSession?.endOver === 60,
  `got startOver=${secondSession?.startOver} endOver=${secondSession?.endOver}`
);

// Compare against a GENUINE 3rd session (tea break, 25 min) to confirm normal
// session breaks still work correctly alongside the new rain-delay handling.
const teaBreakStart = new Date(afterRainBalls[afterRainBalls.length - 1].timestampIso).getTime() + 25 * 60 * 1000;
const sessionThreeBalls: Ball[] = [];
{
  let t = teaBreakStart;
  let over = 61, ballInOver = 0;
  for (let i = 0; i < 10 * 6; i++) {
    sessionThreeBalls.push(makeBall(over, ballInOver, new Date(t).toISOString()));
    t += 90 * 1000;
    ballInOver++;
    if (ballInOver === 6) { ballInOver = 0; over++; }
  }
}
const sessionsWithTea = deriveTestSessions([...allBallsDay1, ...sessionThreeBalls], matchStart, false);
check(
  "a genuine tea-length break after the rain delay correctly starts a real 3rd session",
  sessionsWithTea.length === 3 && sessionsWithTea[2]?.session === "third",
  `got ${JSON.stringify(sessionsWithTea.map(s => s.session))}`
);

// Multi-day case: a gap spanning midnight must still split into a new day,
// even though the day-change check is now independent of gap duration.
const day2Balls: Ball[] = [makeBall(1, 0, "2026-07-21T04:00:00.000Z")];
const sessionsAcrossDays = deriveTestSessions([...allBallsDay1, ...day2Balls], matchStart, false);
const lastDay = sessionsAcrossDays[sessionsAcrossDays.length - 1];
check(
  "a gap crossing midnight still starts a new day (day 2)",
  lastDay?.day === 2,
  `got day=${lastDay?.day}, all days: ${JSON.stringify(sessionsAcrossDays.map(s => s.day))}`
);

// ============================================================================
// 3. Null / zero 1st-innings runs → win-prob target handling
// ============================================================================
console.log("\n--- 3. Null/zero 1st-innings runs (win-prob target!) ---");

const teamA: Team = { code: "AAA", shortName: "AAA", fullName: "Team AAA", primaryColor: "#111111", secondaryColor: "#222222" };
const teamB: Team = { code: "BBB", shortName: "BBB", fullName: "Team BBB", primaryColor: "#333333", secondaryColor: "#444444" };
const venue: Venue = { id: "v1", name: "Test Venue", city: "Test City" };
const competition: Competition = { id: "c1", name: "Test Series", shortName: "TS", type: "bilateral", format: "ODI", hasStandings: false };

function chaseBall(i: number): Ball {
  return {
    id: `chase-${i}`,
    inningsNumber: 2,
    over: Math.floor(i / 6) + 1,
    ballInOver: i % 6,
    timestampIso: new Date(Date.now() + i * 60000).toISOString(),
    batterId: "p3", batterName: "Chaser One",
    bowlerId: "p4", bowlerName: "Bowler One",
    runs: 1, extras: 0,
    isWicket: false, isBoundary4: false, isBoundary6: false,
  };
}

// Case A: 1st innings runs is explicitly 0 (not yet started / genuinely 0),
// but a (malformed/edge-case) 2nd innings already has balls.
const matchWithZeroFirstInnings: Match = {
  id: "m-zero-first",
  format: "ODI",
  competition,
  startTimeIso: new Date().toISOString(),
  status: "live",
  venue,
  teamA,
  teamB,
  innings: [
    { number: 1, battingTeam: "AAA", bowlingTeam: "BBB", runs: 0, wickets: 0, overs: 0, balls: [], battingCard: [], bowlingCard: [] },
    { number: 2, battingTeam: "BBB", bowlingTeam: "AAA", runs: 6, wickets: 0, overs: 1, balls: [chaseBall(0), chaseBall(1), chaseBall(2), chaseBall(3), chaseBall(4), chaseBall(5)], battingCard: [], bowlingCard: [] },
  ],
};

let threwA = false;
let pointsA: ReturnType<typeof calculateWinProbForMatch> = [];
try {
  pointsA = calculateWinProbForMatch(matchWithZeroFirstInnings);
} catch (e) {
  threwA = true;
  console.log("  threw:", e);
}
check("null-target case does not throw", !threwA, "calculateWinProbForMatch threw an exception");
const anyNaNA = pointsA.some(p => Number.isNaN(p.winProbTeamA));
check("null-target case never produces a NaN win-prob point", !anyNaNA, `points: ${JSON.stringify(pointsA)}`);
check(
  "null-target case skips the chase-innings points entirely (no fake percentage shown)",
  pointsA.length === 0,
  `expected 0 points (target unknown), got ${pointsA.length}: ${JSON.stringify(pointsA)}`
);

// Case B: 1st innings runs is undefined (missing field entirely) — same
// expectation, and also confirms the validation layer flags this as an
// issue rather than staying silent about it.
const matchWithUndefinedFirstInnings: Match = {
  ...matchWithZeroFirstInnings,
  id: "m-undefined-first",
  innings: [
    { number: 1, battingTeam: "AAA", bowlingTeam: "BBB", runs: undefined as unknown as number, wickets: 0, overs: 0, balls: [], battingCard: [], bowlingCard: [] },
    matchWithZeroFirstInnings.innings[1],
  ],
};
let threwB = false;
let pointsB: ReturnType<typeof calculateWinProbForMatch> = [];
try {
  pointsB = calculateWinProbForMatch(matchWithUndefinedFirstInnings);
} catch (e) {
  threwB = true;
  console.log("  threw:", e);
}
check("undefined-runs case does not throw", !threwB, "calculateWinProbForMatch threw an exception");
check("undefined-runs case also skips chase points (no NaN)", pointsB.length === 0 && !pointsB.some(p => Number.isNaN(p.winProbTeamA)), `points: ${JSON.stringify(pointsB)}`);

const validation = normalizeMatch(matchWithUndefinedFirstInnings, { source: "edge-case-check" });
check(
  "validation layer flags the missing 1st-innings runs as a warning",
  validation.ok && validation.warnings.some(w => w.path.includes("innings[0].runs")),
  `validation result: ${JSON.stringify(validation)}`
);

// Case C: sanity check — a NORMAL match (1st innings has a real total)
// still produces real, non-NaN win-prob points for the chase.
const matchNormal: Match = {
  ...matchWithZeroFirstInnings,
  id: "m-normal",
  innings: [
    { number: 1, battingTeam: "AAA", bowlingTeam: "BBB", runs: 180, wickets: 6, overs: 20, balls: [], battingCard: [], bowlingCard: [] },
    matchWithZeroFirstInnings.innings[1],
  ],
};
const pointsC = calculateWinProbForMatch(matchNormal);
check(
  "normal match with a real target still produces valid, non-NaN win-prob points",
  pointsC.length > 0 && pointsC.every(p => !Number.isNaN(p.winProbTeamA)),
  `points: ${JSON.stringify(pointsC)}`
);

// ============================================================================
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
