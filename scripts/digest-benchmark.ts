// One-off performance benchmark for DigestTab's buildCards() pipeline.
// Not part of the app; run with `npx tsx scripts/digest-benchmark.ts`.
//
// Simulates a realistic full 5-day Test match (~2,700 legal deliveries
// across 4 innings, spread over 5 real days with lunch/tea-length session
// gaps) and measures how long buildCards() takes to run at every "live
// tick" from ball 1 through the final ball — the same call DigestTab makes
// via useMemo on every match/allBalls reference change.

import { buildCards, type DigestCardCache } from "../components/DigestTab";
import type { Ball, Match, Team, Venue, Competition, Innings } from "../lib/types";

const teamA: Team = { code: "AAA", shortName: "AAA", fullName: "Team AAA", primaryColor: "#111111", secondaryColor: "#222222" };
const teamB: Team = { code: "BBB", shortName: "BBB", fullName: "Team BBB", primaryColor: "#333333", secondaryColor: "#444444" };
const venue: Venue = { id: "v1", name: "Bench Ground", city: "Bench City" };
const competition: Competition = { id: "c1", name: "Benchmark Test", shortName: "BT", type: "bilateral", format: "Test", hasStandings: false };

const MATCH_START = new Date("2026-07-16T04:00:00.000Z").getTime();
const DAY_MS = 24 * 3600 * 1000;
const SESSION_LEN_OVERS = 30; // ~30 overs/session, 90 overs/day — realistic Test pacing
const LUNCH_GAP_MS = 40 * 60 * 1000;
const TEA_GAP_MS = 20 * 60 * 1000;
const BALL_GAP_MS = 55 * 1000; // ~55s/ball including over changes — realistic-ish

interface GenResult { balls: Ball[]; }

/**
 * Generate one innings' worth of balls across up to `days` real days,
 * `oversPerDay` overs/day split into 3 sessions, starting at `startMs`.
 * Returns the balls AND the wall-clock time the innings finished at, so the
 * next innings can continue realistically (same day or the next).
 */
function genInnings(inningsNumber: 1 | 2 | 3 | 4, startMs: number, totalOvers: number): { balls: Ball[]; endMs: number } {
  const balls: Ball[] = [];
  let t = startMs;
  let over = 1;
  let ballInOver = 0;
  let oversDoneToday = 0;
  let sessionsDoneToday = 0;
  let ballIdx = 0;

  for (let o = 0; o < totalOvers; o++) {
    for (let b = 0; b < 6; b++) {
      ballIdx++;
      balls.push({
        id: `i${inningsNumber}-${ballIdx}`,
        inningsNumber,
        over: over,
        ballInOver: b,
        timestampIso: new Date(t).toISOString(),
        batterId: "p1", batterName: "Benchmark Batter",
        bowlerId: "p2", bowlerName: "Benchmark Bowler",
        runs: b % 4 === 0 ? 1 : 0,
        extras: 0,
        isWicket: ballIdx % 137 === 0,
        isBoundary4: ballIdx % 41 === 0,
        isBoundary6: ballIdx % 211 === 0,
      });
      t += BALL_GAP_MS;
    }
    over++;
    oversDoneToday++;

    if (oversDoneToday === SESSION_LEN_OVERS) {
      sessionsDoneToday++;
      oversDoneToday = 0;
      if (sessionsDoneToday < 3) {
        // lunch or tea
        t += sessionsDoneToday === 1 ? LUNCH_GAP_MS : TEA_GAP_MS;
      } else {
        // end of day — jump to next day's start
        sessionsDoneToday = 0;
        const dayIdx = Math.floor((t - MATCH_START) / DAY_MS);
        t = MATCH_START + (dayIdx + 1) * DAY_MS;
      }
    }
  }
  return { balls, endMs: t };
}

function buildFullMatch(): { match: Match; allBalls: Ball[] } {
  // Roughly: 100 / 90 / 95 / 40 overs across 4 innings ≈ 325 overs ≈ 1,950
  // balls, spread across 5 days — a realistic (if slightly bowling-friendly)
  // 5-day Test. Bump toward ~2,700 by padding innings lengths a bit more.
  const i1 = genInnings(1, MATCH_START, 115);
  const i2 = genInnings(2, i1.endMs, 105);
  const i3 = genInnings(3, i2.endMs, 100);
  const i4 = genInnings(4, i3.endMs, 45);

  const mkInnings = (num: 1 | 2 | 3 | 4, balls: Ball[]): Innings => ({
    number: num,
    battingTeam: num % 2 === 1 ? "AAA" : "BBB",
    bowlingTeam: num % 2 === 1 ? "BBB" : "AAA",
    runs: balls.reduce((s, b) => s + b.runs + b.extras, 0),
    wickets: balls.filter(b => b.isWicket).length,
    overs: balls.length / 6,
    balls,
    battingCard: [],
    bowlingCard: [],
  });

  const allBalls = [...i1.balls, ...i2.balls, ...i3.balls, ...i4.balls];
  const match: Match = {
    id: "bench-match",
    format: "Test",
    competition,
    startTimeIso: new Date(MATCH_START).toISOString(),
    status: "live",
    venue,
    teamA,
    teamB,
    innings: [
      mkInnings(1, i1.balls),
      mkInnings(2, i2.balls),
      mkInnings(3, i3.balls),
      mkInnings(4, i4.balls),
    ],
  };
  return { match, allBalls };
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function runBenchmark(tickEveryNBalls: number, label: string, useCache: boolean) {
  const { match, allBalls } = buildFullMatch();
  const total = allBalls.length;
  const times: number[] = [];
  const cache: DigestCardCache | undefined = useCache ? new Map() : undefined;

  // Track object-identity stability: of the cards present in tick N and
  // tick N-1 (same id, both ticks), how many kept the EXACT SAME object
  // reference? That's what actually lets React skip re-rendering a card's
  // DOM on a live tick -- raw buildCards() time is only half the picture.
  let prevCardsById = new Map<string, unknown>();
  let stableAcrossTicks = 0;
  let comparableAcrossTicks = 0;

  const t0 = performance.now();
  for (let n = tickEveryNBalls; n <= total; n += tickEveryNBalls) {
    const slice = allBalls.slice(0, n);
    const start = performance.now();
    const cards = buildCards(match, slice, true, cache);
    times.push(performance.now() - start);

    const curCardsById = new Map<string, unknown>();
    for (const c of cards) curCardsById.set((c as { id: string }).id, c);
    for (const [id, obj] of curCardsById) {
      const prev = prevCardsById.get(id);
      if (prev !== undefined) {
        comparableAcrossTicks++;
        if (prev === obj) stableAcrossTicks++;
      }
    }
    prevCardsById = curCardsById;
  }
  const totalMs = performance.now() - t0;

  const sorted = [...times].sort((a, b) => a - b);
  const avg = times.reduce((s, x) => s + x, 0) / times.length;
  const stablePct = comparableAcrossTicks > 0 ? (100 * stableAcrossTicks / comparableAcrossTicks) : 0;
  console.log(`\n--- ${label} (tick every ${tickEveryNBalls} ball${tickEveryNBalls > 1 ? "s" : ""}, cache=${useCache}) ---`);
  console.log(`  total balls: ${total}, ticks simulated: ${times.length}`);
  console.log(`  total time across all ticks: ${totalMs.toFixed(1)}ms`);
  console.log(`  avg per tick: ${avg.toFixed(3)}ms`);
  console.log(`  p50: ${percentile(sorted, 50).toFixed(3)}ms  p90: ${percentile(sorted, 90).toFixed(3)}ms  p99: ${percentile(sorted, 99).toFixed(3)}ms  max: ${sorted[sorted.length - 1].toFixed(3)}ms`);
  console.log(`  card object-identity stability across consecutive ticks: ${stablePct.toFixed(1)}% (${stableAcrossTicks}/${comparableAcrossTicks}) -- higher is better, this is what lets React skip re-rendering unchanged cards`);
  return { totalMs, avg, max: sorted[sorted.length - 1], ticks: times.length, total, stablePct };
}

console.log("=== Digest buildCards() benchmark ===");
const { allBalls } = buildFullMatch();
console.log(`Synthetic match: ${allBalls.length} total balls across 4 innings, 5 days.`);

console.log("\n########## WITHOUT cache (baseline / original behavior) ##########");
runBenchmark(1, "Per-ball live tick", false);
runBenchmark(6, "Per-over live tick", false);
runBenchmark(2, "Frequent poll (~every 2 balls)", false);

console.log("\n########## WITH cache (new behavior) ##########");
runBenchmark(1, "Per-ball live tick", true);
runBenchmark(6, "Per-over live tick", true);
runBenchmark(2, "Frequent poll (~every 2 balls)", true);
