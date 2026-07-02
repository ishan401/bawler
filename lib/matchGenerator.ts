import { COMPETITIONS, TEAMS, VENUES } from "./mockData";
import type { Match, Team, Venue } from "./types";

const PAST_SUMMARIES = [
  "Late-order partnership flipped a stalled chase.",
  "Spinners ran the show — neither side topped 7 RPO.",
  "Powerplay collapse 60/0 to 78/5 set the tone.",
  "Captain's century anchored a near-dead chase.",
  "19th-over no-ball changed the chase math.",
  "Bowlers won — fields tightened, then 5/24.",
  "Three sixes in the last over ended a tense scrap.",
  "Foreign pace pair shared seven wickets.",
];
const FUTURE_SUMMARIES = [
  "Both one win from sealing playoff seeding. High-stakes Friday night.",
  "Spin-heavy attacks vs a small ground. Runfest after dew.",
  "Last meeting was a thrashing. Rematch carries revenge undertones.",
  "Two of the top-three run-scorers of the season face off.",
  "First-vs-bottom on paper, last 5 head-to-heads were upsets.",
  "Knockout-feel. Net-run-rate stops the loser from the top four.",
  "Returning captain meets the side that benched him last season.",
];

const TEAM_PAIRS: Array<[keyof typeof TEAMS, keyof typeof TEAMS]> = [
  ["MI", "CSK"], ["RCB", "DC"], ["KKR", "PBKS"], ["RR", "SRH"], ["LSG", "GT"],
  ["MI", "RCB"], ["CSK", "KKR"], ["DC", "PBKS"], ["RR", "LSG"], ["SRH", "GT"],
  ["MI", "DC"], ["CSK", "PBKS"], ["KKR", "RCB"], ["RR", "GT"], ["LSG", "SRH"],
  ["MI", "KKR"], ["CSK", "RCB"], ["DC", "SRH"], ["RR", "PBKS"], ["LSG", "GT"],
];

function pick<T>(arr: T[], idx: number): T {
  return arr[Math.abs(idx) % arr.length];
}

function seededRandom(seed: number): number {
  // Simple deterministic pseudo-random — same input always yields same output
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a batch of synthetic past matches earlier than `earliestIso`.
 * Used for infinite-scroll on the past column.
 */
export function generatePastMatches(earliestIso: string, batchSize: number): Match[] {
  const earliestMs = new Date(earliestIso).getTime();
  return Array.from({ length: batchSize }, (_, i) => {
    const idx = (Math.floor(earliestMs / 1000) % 1000) + i + 1;
    const dayOffset = (i + 1) * 18 + 6; // hours back from earliestMs
    const startMs = earliestMs - dayOffset * 3600 * 1000;
    const pairIdx = Math.floor(seededRandom(idx + 11) * TEAM_PAIRS.length);
    const [aCode, bCode] = TEAM_PAIRS[pairIdx];
    const venues = Object.values(VENUES);
    const venue: Venue = venues[Math.floor(seededRandom(idx + 23) * venues.length)];
    const winnerIsA = seededRandom(idx + 7) > 0.5;
    const margin = seededRandom(idx + 13) > 0.5
      ? `by ${5 + Math.floor(seededRandom(idx) * 60)} runs`
      : `by ${1 + Math.floor(seededRandom(idx) * 9)} wickets`;
    const aRuns = 140 + Math.floor(seededRandom(idx + 1) * 60);
    const bRuns = winnerIsA ? aRuns - 5 - Math.floor(seededRandom(idx + 2) * 30) : aRuns + 1 + Math.floor(seededRandom(idx + 3) * 12);
    const excitement = 3 + Math.floor(seededRandom(idx + 5) * 8);
    const teamA: Team = TEAMS[aCode];
    const teamB: Team = TEAMS[bCode];
    return {
      id: `gen-past-${idx}`,
      competition: COMPETITIONS.ipl2026,
      format: "T20" as const,
      season: 2026,
      startTimeIso: new Date(startMs).toISOString(),
      status: "post-match",
      venue,
      teamA,
      teamB,
      innings: [],
      result: {
        winner: winnerIsA ? teamA.code : teamB.code,
        margin,
        teamARuns: aRuns,
        teamAWickets: 4 + Math.floor(seededRandom(idx + 14) * 6),
        teamBRuns: bRuns,
        teamBWickets: 4 + Math.floor(seededRandom(idx + 15) * 6),
      },
      summary: pick(PAST_SUMMARIES, idx),
      excitement,
      highlightBadge: excitement >= 9 ? "Instant classic" : excitement >= 8 ? "Sharp finish" : undefined,
    };
  });
}

/**
 * Generate a batch of synthetic future matches later than `latestIso`.
 */
export function generateFutureMatches(latestIso: string, batchSize: number): Match[] {
  const latestMs = new Date(latestIso).getTime();
  return Array.from({ length: batchSize }, (_, i) => {
    const idx = (Math.floor(latestMs / 1000) % 1000) + i + 1;
    const dayOffset = (i + 1) * 22 + 6; // hours forward
    const startMs = latestMs + dayOffset * 3600 * 1000;
    const pairIdx = Math.floor(seededRandom(idx + 31) * TEAM_PAIRS.length);
    const [aCode, bCode] = TEAM_PAIRS[pairIdx];
    const venues = Object.values(VENUES);
    const venue: Venue = venues[Math.floor(seededRandom(idx + 41) * venues.length)];
    const excitement = 3 + Math.floor(seededRandom(idx + 51) * 8);
    return {
      id: `gen-fut-${idx}`,
      competition: COMPETITIONS.ipl2026,
      format: "T20" as const,
      season: 2026,
      startTimeIso: new Date(startMs).toISOString(),
      status: "upcoming",
      venue,
      teamA: TEAMS[aCode],
      teamB: TEAMS[bCode],
      innings: [],
      summary: pick(FUTURE_SUMMARIES, idx),
      excitement,
      highlightBadge: excitement >= 9 ? "Must watch" : excitement >= 8 ? "High stakes" : undefined,
    };
  });
}
