// Verification script for the Digest tab overhaul (structure dedup,
// narrative variety, visual hierarchy). Not part of the app; run with
// `npx tsx scripts/digest-check.ts`.

import { buildCards, type DigestCardCache, type DaySummaryCard, type SessionCard, type OverGroupCard } from "../components/DigestTab";
import type { Ball, Match, Team, Venue, Competition, Innings } from "../lib/types";

let failures = 0;
function check(label: string, cond: boolean, detail: string) {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label} — ${detail}`);
  }
}

const teamA: Team = { code: "AAA", shortName: "AAA", fullName: "Team AAA", primaryColor: "#111111", secondaryColor: "#222222" };
const teamB: Team = { code: "BBB", shortName: "BBB", fullName: "Team BBB", primaryColor: "#333333", secondaryColor: "#444444" };
const venue: Venue = { id: "v1", name: "Check Ground", city: "Check City" };
const competition: Competition = { id: "c1", name: "Digest Check Test", shortName: "DCT", type: "bilateral", format: "Test", hasStandings: false };

const MATCH_START = new Date("2026-07-16T04:00:00.000Z").getTime();
const DAY_MS = 24 * 3600 * 1000;

/**
 * Build one session's worth of balls: `overs` overs, `wicketsWanted`
 * wickets spread evenly through it, `runsPerBall` average (0 = pure dots).
 * `startMs` is this session's own start time; returns the balls plus the
 * wall-clock time the session finished at.
 */
function buildSession(
  inningsNumber: 1,
  startOver: number,
  overs: number,
  wicketsWanted: number,
  runsPerBall: number,
  startMs: number,
  idPrefix: string
): { balls: Ball[]; endMs: number } {
  const balls: Ball[] = [];
  let t = startMs;
  const totalBalls = overs * 6;
  const wicketEvery = wicketsWanted > 0 ? Math.floor(totalBalls / wicketsWanted) : Infinity;
  let wicketsSoFar = 0;

  for (let i = 0; i < totalBalls; i++) {
    const over = startOver + Math.floor(i / 6);
    const ballInOver = i % 6;
    const isWicket = wicketsSoFar < wicketsWanted && (i + 1) % wicketEvery === 0;
    if (isWicket) wicketsSoFar++;
    balls.push({
      id: `${idPrefix}-${i}`,
      inningsNumber,
      over, ballInOver,
      timestampIso: new Date(t).toISOString(),
      batterId: "p1", batterName: "Check Batter",
      bowlerId: "p2", bowlerName: "Check Bowler",
      runs: runsPerBall > 0 && i % Math.max(1, Math.round(1 / runsPerBall)) === 0 ? 1 : 0,
      extras: 0,
      isWicket,
      isBoundary4: false,
      isBoundary6: false,
    });
    t += 55 * 1000;
  }
  return { balls, endMs: t };
}

function mkInnings(num: 1, balls: Ball[]): Innings {
  return {
    number: num,
    battingTeam: "AAA",
    bowlingTeam: "BBB",
    runs: balls.reduce((s, b) => s + b.runs + b.extras, 0),
    wickets: balls.filter(b => b.isWicket).length,
    overs: balls.length / 6,
    balls,
    battingCard: [],
    bowlingCard: [],
  };
}

function mkMatch(allBalls: Ball[], status: Match["status"] = "live"): Match {
  return {
    id: "digest-check-match",
    format: "Test",
    competition,
    startTimeIso: new Date(MATCH_START).toISOString(),
    status,
    venue,
    teamA,
    teamB,
    innings: [mkInnings(1, allBalls)],
  };
}

// ============================================================================
// 1. Structural dedup: 2 fully-complete days + 1 in-progress day
// ============================================================================
console.log("\n--- 1. Structural dedup (complete days -> one card each, no lingering session cards) ---");

// Day 1: 3 sessions of 30 overs each (routine).
const d1s1 = buildSession(1, 1, 30, 2, 0.3, MATCH_START, "d1s1");
const d1s2 = buildSession(1, 31, 30, 2, 0.3, d1s1.endMs + 40 * 60 * 1000, "d1s2");
const d1s3 = buildSession(1, 61, 30, 2, 0.3, d1s2.endMs + 20 * 60 * 1000, "d1s3");
const day1EndMs = MATCH_START + 1 * DAY_MS; // force day rollover regardless of clock drift

// Day 2: 3 sessions, routine.
const d2s1 = buildSession(1, 91, 30, 2, 0.3, day1EndMs, "d2s1");
const d2s2 = buildSession(1, 121, 30, 2, 0.3, d2s1.endMs + 40 * 60 * 1000, "d2s2");
const d2s3 = buildSession(1, 151, 30, 2, 0.3, d2s2.endMs + 20 * 60 * 1000, "d2s3");
const day2EndMs = MATCH_START + 2 * DAY_MS;

// Day 3: only 1 session so far -- still in progress (live).
const d3s1 = buildSession(1, 181, 15, 1, 0.3, day2EndMs, "d3s1");

const allBallsStructural = [
  ...d1s1.balls, ...d1s2.balls, ...d1s3.balls,
  ...d2s1.balls, ...d2s2.balls, ...d2s3.balls,
  ...d3s1.balls,
];
const structuralMatch = mkMatch(allBallsStructural, "live");
const structuralCards = buildCards(structuralMatch, allBallsStructural, true);

const sessionCardsByDay = new Map<number, number>();
const daySummaryCardsByDay = new Map<number, number>();
for (const c of structuralCards) {
  if (c.kind === "session") sessionCardsByDay.set(c.day, (sessionCardsByDay.get(c.day) ?? 0) + 1);
  if (c.kind === "day-summary") daySummaryCardsByDay.set(c.day, (daySummaryCardsByDay.get(c.day) ?? 0) + 1);
}

check(
  "completed Day 1 has exactly ONE day-summary card",
  daySummaryCardsByDay.get(1) === 1,
  `got ${daySummaryCardsByDay.get(1)}`
);
check(
  "completed Day 1 has ZERO lingering session cards",
  !sessionCardsByDay.has(1),
  `got ${sessionCardsByDay.get(1)} session cards for day 1`
);
check(
  "completed Day 2 has exactly ONE day-summary card",
  daySummaryCardsByDay.get(2) === 1,
  `got ${daySummaryCardsByDay.get(2)}`
);
check(
  "completed Day 2 has ZERO lingering session cards",
  !sessionCardsByDay.has(2),
  `got ${sessionCardsByDay.get(2)} session cards for day 2`
);
check(
  "in-progress Day 3 shows its session card (no day-summary yet)",
  sessionCardsByDay.get(3) === 1 && !daySummaryCardsByDay.has(3),
  `sessionCards=${sessionCardsByDay.get(3)} daySummary=${daySummaryCardsByDay.get(3)}`
);

const day1Summary = structuralCards.find(c => c.kind === "day-summary" && c.day === 1) as DaySummaryCard | undefined;
check(
  "Day 1 summary correctly reports all 3 sessions played",
  day1Summary?.sessionRows.length === 3,
  `got ${JSON.stringify(day1Summary?.sessionRows)}`
);

// ============================================================================
// 1b. Weather-shortened day: only 2 sessions played (3rd rained off)
// ============================================================================
console.log("\n--- 1b. Weather-shortened day (2 sessions instead of 3) ---");

const wd1s1 = buildSession(1, 1, 30, 2, 0.3, MATCH_START, "wd1s1");
const wd1s2 = buildSession(1, 31, 30, 2, 0.3, wd1s1.endMs + 40 * 60 * 1000, "wd1s2");
// No 3rd session -- rain wiped it out. Next ball is the following day.
const wDay2Start = MATCH_START + 1 * DAY_MS;
const wd2s1 = buildSession(1, 61, 10, 1, 0.3, wDay2Start, "wd2s1"); // live, in progress

const shortenedBalls = [...wd1s1.balls, ...wd1s2.balls, ...wd2s1.balls];
const shortenedMatch = mkMatch(shortenedBalls, "live");
const shortenedCards = buildCards(shortenedMatch, shortenedBalls, true);
const shortenedDay1Summary = shortenedCards.find(c => c.kind === "day-summary" && c.day === 1) as DaySummaryCard | undefined;

check(
  "weather-shortened day still produces exactly one day-summary card",
  !!shortenedDay1Summary,
  "no day-summary card found for the shortened day"
);
check(
  "weather-shortened day-summary correctly reports only 2 sessions",
  shortenedDay1Summary?.sessionRows.length === 2,
  `got ${JSON.stringify(shortenedDay1Summary?.sessionRows)}`
);

// ============================================================================
// 2. Narrative variety within one day-report + weather-shortened phrasing
// ============================================================================
console.log("\n--- 2. Narrative variety within a single day's report ---");

// A day where ALL THREE sessions land in the SAME bucket (dominant bowling,
// w>=5) -- the exact scenario that used to repeat "Brutal and brilliant"
// verbatim across sessions. Deliberately DIFFERENT wicket/run counts per
// session (6/5/7 wickets, differing run rates) -- this is what actually
// exposed the real bug live: comparing fully-RENDERED strings (with the
// session's own runs/wickets baked in) never treated two same-bucket
// sessions as "the same phrase" because the embedded numbers differed, so
// the old Set-based dedup never triggered. Regression coverage for that
// exact failure mode, not just the same-stats case that accidentally
// passed before the fix.
const vd1s1 = buildSession(1, 1, 30, 6, 0.1, MATCH_START, "vd1s1");
const vd1s2 = buildSession(1, 31, 30, 5, 0.15, vd1s1.endMs + 40 * 60 * 1000, "vd1s2");
const vd1s3 = buildSession(1, 61, 30, 7, 0.08, vd1s2.endMs + 20 * 60 * 1000, "vd1s3");
const vDay2Start = MATCH_START + 1 * DAY_MS;
const vd2s1 = buildSession(1, 91, 10, 1, 0.1, vDay2Start, "vd2s1"); // live tail so day 1 completes

const varietyBalls = [...vd1s1.balls, ...vd1s2.balls, ...vd1s3.balls, ...vd2s1.balls];
const varietyMatch = mkMatch(varietyBalls, "live");
const varietyCards = buildCards(varietyMatch, varietyBalls, true);
const varietyDay1 = varietyCards.find(c => c.kind === "day-summary" && c.day === 1) as DaySummaryCard | undefined;

check("variety-test day-summary was built", !!varietyDay1, "no day-summary found");
if (varietyDay1) {
  // report[0] = day overview, report[1..3] = per-session lines, rest = star bowler/context/tease
  const sessionLines = varietyDay1.report.slice(1, 4);
  const uniqueLines = new Set(sessionLines);
  check(
    "all 3 same-bucket sessions produced 3 DIFFERENT closing lines (exact text)",
    uniqueLines.size === sessionLines.length,
    `lines: ${JSON.stringify(sessionLines)}`
  );

  // A weaker full-string check alone isn't a strong enough regression guard
  // for the bug that actually shipped: each variant in the "dominant
  // bowling" bucket has runs/wickets interpolated INTO the sentence, so
  // even picking the SAME variant (e.g. variant 0) for all 3 sessions would
  // still produce 3 textually-different lines whenever the sessions have
  // different run/wicket counts -- which they do here on purpose. What
  // actually broke live was all 3 sessions landing on variant 0's fixed,
  // non-interpolated closing phrase "Brutal and brilliant." regardless of
  // the numbers. Check directly for each variant's unique fixed marker so
  // "always picks the same variant" can't hide behind different numbers.
  const variantMarkers = ["Brutal and brilliant.", "on its own.", "had no answers."];
  const markerHits = variantMarkers.map(m => sessionLines.filter(l => l.includes(m)).length);
  check(
    "each dominant-bowling phrase VARIANT (not just each rendered string) is used at most once across the 3 sessions",
    markerHits.every(count => count <= 1),
    `marker hit counts ${JSON.stringify(variantMarkers)} -> ${JSON.stringify(markerHits)}; lines: ${JSON.stringify(sessionLines)}`
  );
}

// ============================================================================
// 2b. Weather-shortened SESSION gets distinct phrasing (not "tight/cautious")
// ============================================================================
console.log("\n--- 2b. Weather-shortened session phrasing ---");

const rd1s1 = buildSession(1, 1, 30, 2, 0.3, MATCH_START, "rd1s1");
// Session 2 heavily curtailed: only 8 overs bowled (well under the 18-over
// shortened threshold) before the day's play ends.
const rd1s2 = buildSession(1, 31, 8, 1, 0.3, rd1s1.endMs + 40 * 60 * 1000, "rd1s2");
const rDay2Start = MATCH_START + 1 * DAY_MS;
const rd2s1 = buildSession(1, 39, 10, 1, 0.3, rDay2Start, "rd2s1");

const rainyBalls = [...rd1s1.balls, ...rd1s2.balls, ...rd2s1.balls];
const rainyMatch = mkMatch(rainyBalls, "live");
const rainyCards = buildCards(rainyMatch, rainyBalls, true);
const rainyDay1 = rainyCards.find(c => c.kind === "day-summary" && c.day === 1) as DaySummaryCard | undefined;

check("weather-shortened-session day-summary was built", !!rainyDay1, "no day-summary found");
if (rainyDay1) {
  const secondSessionLine = rainyDay1.report[2] ?? "";
  check(
    "the 8-over session's line mentions the shortened/interrupted framing, not generic 'tight' cricket",
    /interrupt|reduced|held up|weather|conditions/i.test(secondSessionLine),
    `got: ${JSON.stringify(secondSessionLine)}`
  );
}

// ============================================================================
// 3. Notable-vs-routine visual hierarchy
// ============================================================================
console.log("\n--- 3. Notable-vs-routine visual hierarchy ---");

// A genuinely dramatic day: 11 wickets.
const nd1s1 = buildSession(1, 1, 30, 6, 0.1, MATCH_START, "nd1s1");
const nd1s2 = buildSession(1, 31, 30, 5, 0.1, nd1s1.endMs + 40 * 60 * 1000, "nd1s2");
const nDay2Start = MATCH_START + 1 * DAY_MS;
const nd2s1 = buildSession(1, 61, 10, 1, 0.1, nDay2Start, "nd2s1");
const dramaticBalls = [...nd1s1.balls, ...nd1s2.balls, ...nd2s1.balls];
const dramaticMatch = mkMatch(dramaticBalls, "live");
const dramaticCards = buildCards(dramaticMatch, dramaticBalls, true);
const dramaticDay1 = dramaticCards.find(c => c.kind === "day-summary" && c.day === 1) as DaySummaryCard | undefined;

check(
  "an 11-wicket day is flagged isNotable",
  dramaticDay1?.isNotable === true,
  `totalWickets=${dramaticDay1?.totalWickets} isNotable=${dramaticDay1?.isNotable}`
);

// A routine day: ~4 wickets, moderate runs -- should NOT be notable.
const qd1s1 = buildSession(1, 1, 30, 1, 0.5, MATCH_START, "qd1s1");
const qd1s2 = buildSession(1, 31, 30, 2, 0.5, qd1s1.endMs + 40 * 60 * 1000, "qd1s2");
const qd1s3 = buildSession(1, 61, 30, 1, 0.5, qd1s2.endMs + 20 * 60 * 1000, "qd1s3");
const qDay2Start = MATCH_START + 1 * DAY_MS;
const qd2s1 = buildSession(1, 91, 10, 0, 0.5, qDay2Start, "qd2s1");
const routineBalls = [...qd1s1.balls, ...qd1s2.balls, ...qd1s3.balls, ...qd2s1.balls];
const routineMatch = mkMatch(routineBalls, "live");
const routineCards = buildCards(routineMatch, routineBalls, true);
const routineDay1 = routineCards.find(c => c.kind === "day-summary" && c.day === 1) as DaySummaryCard | undefined;

check(
  "a routine ~4-wicket day is NOT flagged isNotable",
  routineDay1?.isNotable === false,
  `totalWickets=${routineDay1?.totalWickets} totalRuns=${routineDay1?.totalRuns} isNotable=${routineDay1?.isNotable}`
);

// ============================================================================
// 4. Cache object-identity stability across recomputation
// ============================================================================
console.log("\n--- 4. Cache reuses completed cards by reference across ticks ---");

const cache: DigestCardCache = new Map();
const fullBalls = allBallsStructural; // day1 (complete) + day2 (complete) + day3 (live)
const tick1 = buildCards(structuralMatch, fullBalls.slice(0, fullBalls.length - 5), true, cache);
const tick2 = buildCards(structuralMatch, fullBalls, true, cache);

const tick1Day1 = tick1.find(c => c.kind === "day-summary" && c.day === 1);
const tick2Day1 = tick2.find(c => c.kind === "day-summary" && c.day === 1);
check(
  "a completed day's card is the SAME object reference across two ticks when new balls only affect a LATER day",
  !!tick1Day1 && tick1Day1 === tick2Day1,
  `tick1 found=${!!tick1Day1}, same ref=${tick1Day1 === tick2Day1}`
);

const tick1Day3Session = tick1.find(c => c.kind === "session" && c.day === 3) as SessionCard | undefined;
const tick2Day3Session = tick2.find(c => c.kind === "session" && c.day === 3) as SessionCard | undefined;
check(
  "the still-live day's session card is a NEW object once more balls arrive for it (correctly not cached)",
  !!tick1Day3Session && !!tick2Day3Session && tick1Day3Session !== tick2Day3Session,
  `tick1 found=${!!tick1Day3Session}, tick2 found=${!!tick2Day3Session}, same ref=${tick1Day3Session === tick2Day3Session}`
);

// ============================================================================
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
