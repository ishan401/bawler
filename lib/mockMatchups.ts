import type { MatchupStats } from "./types";

// Normalise a player name for map keying — strips spaces, punctuation, lowercases
// "V Kohli" → "vkohli", "P Cummins" → "pcummins"
function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function key(batter: string, bowler: string): string {
  return `${normalise(batter)}_${normalise(bowler)}`;
}

// ---------------------------------------------------------------------------
// Mock H2H data — T20I career records (realistic, not real)
// All names must match exactly what appears in ball.batterName / ball.bowlerName
// in mockData.ts so the lookup fires correctly in the live view.
// ---------------------------------------------------------------------------
const MATCHUP_DATA: MatchupStats[] = [

  // ── IND batters vs AUS bowlers ──────────────────────────────────────────
  {
    batterName: "S Gill",
    bowlerName: "P Cummins",
    format: "T20I",
    ballsFaced: 43, runsScored: 38, timesOut: 2,
    dotBalls: 17, fours: 3, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 2 }],
    dangerDelivery: "Short ball, outside off stump",
    lastDismissal: "Caught Head · Mar 2024",
  },
  {
    batterName: "S Gill",
    bowlerName: "M Starc",
    format: "T20I",
    ballsFaced: 28, runsScored: 31, timesOut: 1,
    dotBalls: 9, fours: 4, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Full, swinging in late",
    lastDismissal: "Caught Inglis · Jan 2024",
  },
  {
    batterName: "S Gill",
    bowlerName: "J Hazlewood",
    format: "T20I",
    ballsFaced: 19, runsScored: 22, timesOut: 0,
    dotBalls: 7, fours: 3, sixes: 0,
    dismissalTypes: [],
    dangerDelivery: "Back of length, angling away",
  },
  {
    batterName: "V Kohli",
    bowlerName: "P Cummins",
    format: "T20I",
    ballsFaced: 94, runsScored: 62, timesOut: 3,
    dotBalls: 38, fours: 5, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 2 }, { type: "Bowled", count: 1 }],
    dangerDelivery: "Full, seaming in, yorker length",
    lastDismissal: "Caught Warner · Jan 2024",
  },
  {
    batterName: "V Kohli",
    bowlerName: "M Starc",
    format: "T20I",
    ballsFaced: 76, runsScored: 71, timesOut: 2,
    dotBalls: 27, fours: 8, sixes: 2,
    dismissalTypes: [{ type: "Caught", count: 2 }],
    dangerDelivery: "Full, swinging late, seaming away",
    lastDismissal: "Caught Smith · Nov 2023",
  },
  {
    batterName: "V Kohli",
    bowlerName: "J Hazlewood",
    format: "T20I",
    ballsFaced: 58, runsScored: 48, timesOut: 1,
    dotBalls: 23, fours: 6, sixes: 0,
    dismissalTypes: [{ type: "LBW", count: 1 }],
    dangerDelivery: "Back of length, angling in sharply",
    lastDismissal: "LBW · Dec 2023",
  },
  {
    batterName: "S Iyer",
    bowlerName: "P Cummins",
    format: "T20I",
    ballsFaced: 31, runsScored: 22, timesOut: 2,
    dotBalls: 13, fours: 2, sixes: 0,
    dismissalTypes: [{ type: "Caught", count: 1 }, { type: "Bowled", count: 1 }],
    dangerDelivery: "Full, straight, hitting top of off",
    lastDismissal: "Bowled · Jan 2024",
  },
  {
    batterName: "S Iyer",
    bowlerName: "M Starc",
    format: "T20I",
    ballsFaced: 24, runsScored: 28, timesOut: 1,
    dotBalls: 8, fours: 3, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Yorker, into the blockhole",
    lastDismissal: "Caught Cummins · Mar 2024",
  },
  {
    batterName: "S Iyer",
    bowlerName: "J Hazlewood",
    format: "T20I",
    ballsFaced: 22, runsScored: 19, timesOut: 2,
    dotBalls: 9, fours: 1, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 2 }],
    dangerDelivery: "Short of length, moving away",
    lastDismissal: "Caught Maxwell · Mar 2024",
  },
  {
    batterName: "H Pandya",
    bowlerName: "P Cummins",
    format: "T20I",
    ballsFaced: 24, runsScored: 18, timesOut: 2,
    dotBalls: 10, fours: 1, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 2 }],
    dangerDelivery: "Short ball, targeting the body",
    lastDismissal: "Caught Inglis · Jan 2024",
  },
  {
    batterName: "H Pandya",
    bowlerName: "M Starc",
    format: "T20I",
    ballsFaced: 29, runsScored: 42, timesOut: 1,
    dotBalls: 8, fours: 4, sixes: 3,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Yorker, into the boots",
    lastDismissal: "Caught Maxwell · Nov 2023",
  },
  {
    batterName: "H Pandya",
    bowlerName: "J Hazlewood",
    format: "T20I",
    ballsFaced: 18, runsScored: 21, timesOut: 1,
    dotBalls: 6, fours: 2, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Good length, seaming away late",
    lastDismissal: "Caught Head · Dec 2023",
  },
  {
    batterName: "R Pant",
    bowlerName: "P Cummins",
    format: "T20I",
    ballsFaced: 67, runsScored: 82, timesOut: 4,
    dotBalls: 21, fours: 7, sixes: 4,
    dismissalTypes: [{ type: "Caught", count: 3 }, { type: "Bowled", count: 1 }],
    dangerDelivery: "Short ball, outside off stump",
    lastDismissal: "Caught Hazlewood · Jan 2024",
  },
  {
    batterName: "R Pant",
    bowlerName: "M Starc",
    format: "T20I",
    ballsFaced: 44, runsScored: 56, timesOut: 2,
    dotBalls: 13, fours: 5, sixes: 3,
    dismissalTypes: [{ type: "Caught", count: 2 }],
    dangerDelivery: "Full, swinging in, straight",
    lastDismissal: "Caught Smith · Nov 2023",
  },
  {
    batterName: "R Pant",
    bowlerName: "J Hazlewood",
    format: "T20I",
    ballsFaced: 38, runsScored: 44, timesOut: 2,
    dotBalls: 12, fours: 4, sixes: 2,
    dismissalTypes: [{ type: "Caught", count: 2 }],
    dangerDelivery: "Wobble seam, good length",
    lastDismissal: "Caught Maxwell · Dec 2023",
  },
  {
    batterName: "R Jadeja",
    bowlerName: "P Cummins",
    format: "T20I",
    ballsFaced: 18, runsScored: 24, timesOut: 0,
    dotBalls: 7, fours: 2, sixes: 1,
    dismissalTypes: [],
    dangerDelivery: "Full, late seam, straight",
  },
  {
    batterName: "R Jadeja",
    bowlerName: "J Hazlewood",
    format: "T20I",
    ballsFaced: 12, runsScored: 9, timesOut: 1,
    dotBalls: 5, fours: 1, sixes: 0,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Back of length, shaping away",
    lastDismissal: "Caught Maxwell · Jan 2024",
  },
  {
    batterName: "J Bumrah",
    bowlerName: "P Cummins",
    format: "T20I",
    ballsFaced: 8, runsScored: 6, timesOut: 1,
    dotBalls: 4, fours: 0, sixes: 1,
    dismissalTypes: [{ type: "Bowled", count: 1 }],
    dangerDelivery: "Full, straight, toe-crushing",
    lastDismissal: "Bowled · Nov 2023",
  },

  // ── AUS batters vs IND bowlers ──────────────────────────────────────────
  {
    batterName: "T Head",
    bowlerName: "J Bumrah",
    format: "T20I",
    ballsFaced: 31, runsScored: 18, timesOut: 3,
    dotBalls: 15, fours: 1, sixes: 0,
    dismissalTypes: [{ type: "Bowled", count: 2 }, { type: "LBW", count: 1 }],
    dangerDelivery: "Yorker, angling into the stumps",
    lastDismissal: "Bowled · Mar 2024",
  },
  {
    batterName: "T Head",
    bowlerName: "M Siraj",
    format: "T20I",
    ballsFaced: 22, runsScored: 34, timesOut: 1,
    dotBalls: 6, fours: 4, sixes: 2,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Outswinger, full length",
    lastDismissal: "Caught Kohli · Jan 2024",
  },
  {
    batterName: "S Smith",
    bowlerName: "J Bumrah",
    format: "T20I",
    ballsFaced: 26, runsScored: 21, timesOut: 1,
    dotBalls: 11, fours: 2, sixes: 0,
    dismissalTypes: [{ type: "LBW", count: 1 }],
    dangerDelivery: "Full, seaming back in sharply",
    lastDismissal: "LBW · Jan 2024",
  },
  {
    batterName: "S Smith",
    bowlerName: "Y Chahal",
    format: "T20I",
    ballsFaced: 33, runsScored: 24, timesOut: 2,
    dotBalls: 16, fours: 2, sixes: 0,
    dismissalTypes: [{ type: "Caught", count: 1 }, { type: "Stumped", count: 1 }],
    dangerDelivery: "Legbreak, short-pitched, turning",
    lastDismissal: "Stumped Pant · Mar 2024",
  },
  {
    batterName: "M Labuschagne",
    bowlerName: "Y Chahal",
    format: "T20I",
    ballsFaced: 29, runsScored: 17, timesOut: 2,
    dotBalls: 14, fours: 1, sixes: 0,
    dismissalTypes: [{ type: "Caught", count: 1 }, { type: "Bowled", count: 1 }],
    dangerDelivery: "Legbreak, gripping and turning",
    lastDismissal: "Caught Gill · Jan 2024",
  },
  {
    batterName: "M Labuschagne",
    bowlerName: "Kuldeep Y",
    format: "T20I",
    ballsFaced: 21, runsScored: 14, timesOut: 2,
    dotBalls: 11, fours: 1, sixes: 0,
    dismissalTypes: [{ type: "Stumped", count: 1 }, { type: "Caught", count: 1 }],
    dangerDelivery: "Googly, through the gate",
    lastDismissal: "Stumped Pant · Nov 2023",
  },
  {
    batterName: "G Maxwell",
    bowlerName: "Y Chahal",
    format: "T20I",
    ballsFaced: 52, runsScored: 31, timesOut: 4,
    dotBalls: 25, fours: 2, sixes: 1,
    dismissalTypes: [{ type: "Stumped", count: 2 }, { type: "Caught", count: 2 }],
    dangerDelivery: "Flighted, turning away, tossed up",
    lastDismissal: "Stumped Pant · Mar 2024",
  },
  {
    batterName: "G Maxwell",
    bowlerName: "Kuldeep Y",
    format: "T20I",
    ballsFaced: 34, runsScored: 48, timesOut: 1,
    dotBalls: 9, fours: 4, sixes: 3,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Googly, straight through the gate",
    lastDismissal: "Caught Pandya · Nov 2023",
  },
  {
    batterName: "M Stoinis",
    bowlerName: "J Bumrah",
    format: "T20I",
    ballsFaced: 19, runsScored: 14, timesOut: 2,
    dotBalls: 9, fours: 1, sixes: 0,
    dismissalTypes: [{ type: "Bowled", count: 1 }, { type: "Caught", count: 1 }],
    dangerDelivery: "Full, straight, late inswing",
    lastDismissal: "Bowled · Mar 2024",
  },
  {
    batterName: "M Stoinis",
    bowlerName: "H Pandya",
    format: "T20I",
    ballsFaced: 14, runsScored: 22, timesOut: 1,
    dotBalls: 4, fours: 2, sixes: 1,
    dismissalTypes: [{ type: "Caught", count: 1 }],
    dangerDelivery: "Slower bouncer, outside off",
    lastDismissal: "Caught Gill · Jan 2024",
  },
  {
    batterName: "A Turner",
    bowlerName: "J Bumrah",
    format: "T20I",
    ballsFaced: 11, runsScored: 8, timesOut: 1,
    dotBalls: 5, fours: 1, sixes: 0,
    dismissalTypes: [{ type: "Bowled", count: 1 }],
    dangerDelivery: "Yorker, angling in",
    lastDismissal: "Bowled · Jan 2024",
  },
];

// ---------------------------------------------------------------------------
// Build lookup map — O(1) access at runtime
// ---------------------------------------------------------------------------
const MATCHUP_MAP = new Map<string, MatchupStats>(
  MATCHUP_DATA.map(m => [key(m.batterName, m.bowlerName), m])
);

/**
 * Returns career H2H stats for batter vs bowler, or null if not in mock data.
 * Normalises names so spacing/capitalisation differences don't matter.
 */
export function getMatchupStats(batterName: string, bowlerName: string): MatchupStats | null {
  return MATCHUP_MAP.get(key(batterName, bowlerName)) ?? null;
}
