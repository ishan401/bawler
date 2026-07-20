// ============================================================================
// Bawler — External API Transformers
// ============================================================================
// Each function transforms a raw external API response into our internal types.
// Fill in the implementation when you get real API access.
// The raw types below are PARTIAL — only the fields we actually need are typed.
// ============================================================================

import type {
  Match,
  Innings,
  Ball,
  Team,
  Competition,
  StandingsRow,
  CompetitionStandings,
  BattingEntry,
  BowlingEntry,
  MatchFormat,
  PlayerProfile,
  FormatStats,
  TestSession,
} from "./types";

// ============================================================================
// Name normalisation — applied at every API boundary so partnership tracker,
// matchup lookup, and player links all use a consistent format.
//
// APIs send names in wildly different formats:
//   "Virat Kohli"  /  "V Kohli"  /  "kohli, v"  /  "V. Kohli"
// We normalise to "First-Initial Surname" (e.g. "V Kohli") throughout.
// ============================================================================

/**
 * Normalise a player name to "I Surname" format.
 * Works for:
 *   "Virat Kohli"       → "V Kohli"
 *   "V Kohli"           → "V Kohli"   (already short)
 *   "kohli, virat"      → "V Kohli"   (comma-last format)
 *   "Pat Cummins"       → "P Cummins"
 *   "Mohammed Siraj"    → "M Siraj"
 */
export function normaliseName(raw: string): string {
  if (!raw) return raw;
  const s = raw.trim();
  // Handle "Surname, Firstname" format
  if (s.includes(",")) {
    const [last, first] = s.split(",").map(p => p.trim());
    const initial = first.charAt(0).toUpperCase();
    const surname = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
    return `${initial} ${surname}`;
  }
  const parts = s.split(/\s+/);
  if (parts.length === 1) return s; // single name — return as-is
  // Already initialised ("V Kohli") — first part is one char
  if (parts[0].length === 1 || (parts[0].length === 2 && parts[0].endsWith("."))) {
    const initial = parts[0].replace(".", "");
    const surname = parts.slice(1).join(" ");
    return `${initial} ${surname}`;
  }
  // Full name — take first initial + last word as surname
  const initial = parts[0].charAt(0).toUpperCase();
  const surname = parts[parts.length - 1];
  return `${initial} ${surname}`;
}

// ============================================================================
// Ball normalisation — canonical entry point for real-data robustness
// ============================================================================
// Every API transformer MUST route ball data through normalizeBall().
// This fixes the three known fragility points in one place:
//
//   1. Over indexing    — Bawler is 1-indexed (over 1 = first over).
//                         SportRadar & Cricbuzz are 0-indexed; ESPN is 1-indexed.
//                         Set overIsZeroIndexed=true for 0-indexed APIs.
//
//   2. ballInOver       — Bawler is 0-indexed (ball 0 = first delivery).
//                         ESPN & Cricbuzz send 1-indexed ball numbers.
//                         Set ballInOverIsOneIndexed=true for those APIs.
//
//   3. extraType string — APIs send "WIDE", "wide", "no_ball", "Wide" etc.
//                         normalizeExtraType() maps all variants to our enum.
//
//   4. Boundary flags   — Some APIs don't send isBoundary4/6 at all; they
//                         just set runs=4 or runs=6. normalizeBall() derives
//                         them when the explicit flags are absent.
//
//   5. Player names     — normaliseName() applied automatically.
// ============================================================================

/**
 * Normalize over number to Bawler's 1-indexed convention.
 *
 *   SportRadar timeline: 0-indexed → overIsZeroIndexed = true
 *   Cricbuzz ball-by-ball: 0-indexed → overIsZeroIndexed = true
 *   Roanuz: 0-indexed → overIsZeroIndexed = true
 *   ESPN sportsdata.io: 1-indexed → overIsZeroIndexed = false (default)
 */
export function normalizeOver(rawOver: number, apiIsZeroIndexed = false): number {
  return apiIsZeroIndexed ? rawOver + 1 : rawOver;
}

/**
 * Normalize ball-in-over to Bawler's 0-indexed convention.
 * (ballInOver 0 = first delivery of the over; 5 = sixth delivery)
 *
 *   ESPN sportsdata.io BallNumber: 1-indexed → apiIsOneIndexed = true
 *   Cricbuzz ball-by-ball: 1-indexed → apiIsOneIndexed = true
 *   SportRadar delivery: 0-indexed → apiIsOneIndexed = false (default)
 *   Roanuz: 0-indexed → apiIsOneIndexed = false (default)
 */
export function normalizeBallInOver(rawBall: number, apiIsOneIndexed = false): number {
  return apiIsOneIndexed ? rawBall - 1 : rawBall;
}

/**
 * Normalize any API extra-type string to Bawler's internal enum values.
 * Case-insensitive; strips spaces, underscores, hyphens before matching.
 *
 * Known API variants handled:
 *   "wide" / "WIDE" / "Wide"          → "wd"
 *   "no_ball" / "noball" / "No Ball"  → "nb"
 *   "bye" / "byes" / "Bye"            → "b"
 *   "leg_bye" / "legbye" / "Leg Byes" → "lb"
 *   "penalty" / "pen"                 → "pen"
 */
export function normalizeExtraType(raw?: string | null): Ball["extraType"] | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase().replace(/[\s_\-]/g, "");
  if (s === "wd" || s === "wide") return "wd";
  if (s === "nb" || s === "noball") return "nb";
  if (s === "b" || s === "bye" || s === "byes") return "b";
  if (s === "lb" || s === "legbye" || s === "legbyes") return "lb";
  if (s === "pen" || s === "penalty" || s === "penalties") return "pen";
  console.warn(`[transformers] Unknown extraType "${raw}" — ignoring`);
  return undefined;
}

/**
 * Raw ball input accepted by normalizeBall().
 * Only the fields required for every ball — all enriched fields are optional.
 */
export interface RawBallInput {
  id: string;
  inningsNumber: 1 | 2 | 3 | 4;
  /** Raw over number from the API — normalized per overIsZeroIndexed */
  over: number;
  /** Raw ball-in-over from the API — normalized per ballInOverIsOneIndexed */
  ballInOver: number;
  batterName: string;
  bowlerName: string;
  /** Runs off the bat (not including extras) */
  runs: number;
  /** Total extras on this delivery */
  extras?: number;
  /** Raw extra-type string from the API — normalized automatically */
  extraType?: string | null;
  isWicket?: boolean;
  dismissalType?: Ball["dismissalType"];
  /**
   * Explicit boundary flag from the API.
   * If absent, derived: runs === 4 && extras === 0 && !isWicket.
   */
  isBoundary4?: boolean;
  /**
   * Explicit boundary flag from the API.
   * If absent, derived: runs === 6 && extras === 0 && !isWicket.
   */
  isBoundary6?: boolean;
  batterId?: string;
  bowlerId?: string;
  timestampIso?: string;
  // Pass-through enriched fields (Bawler-generated, not from APIs)
  oneLiner?: string;
  nextBatterName?: string;
  // ── Indexing conventions — set once per API, not per ball ──────────────────
  /** true if this API's first over is numbered 0 (SportRadar, Cricbuzz, Roanuz) */
  overIsZeroIndexed?: boolean;
  /** true if this API's first ball of an over is numbered 1 (ESPN, Cricbuzz) */
  ballInOverIsOneIndexed?: boolean;
}

/**
 * Canonical ball builder — call this in every API transformer instead of
 * constructing Ball objects directly. Handles all normalization in one place.
 *
 * Usage example (Cricbuzz ball-by-ball):
 *   const ball = normalizeBall({
 *     id: String(raw.ballId),
 *     inningsNumber: 1,
 *     over: raw.overNumber,          // e.g. 0 for first over
 *     ballInOver: raw.ballNumber,    // e.g. 1 for first ball
 *     batterName: raw.batsmanName,
 *     bowlerName: raw.bowlerName,
 *     runs: raw.runs,
 *     extras: raw.extras,
 *     extraType: raw.extrasType,     // e.g. "Wide" — normalized automatically
 *     isWicket: raw.isWicket,
 *     overIsZeroIndexed: true,       // Cricbuzz is 0-indexed
 *     ballInOverIsOneIndexed: true,  // Cricbuzz ball numbers start at 1
 *   });
 */
export function normalizeBall(raw: RawBallInput): Ball {
  const over      = normalizeOver(raw.over, raw.overIsZeroIndexed ?? false);
  const ballInOver = normalizeBallInOver(raw.ballInOver, raw.ballInOverIsOneIndexed ?? false);
  const extraType = normalizeExtraType(raw.extraType);
  const runs      = raw.runs ?? 0;
  const extras    = raw.extras ?? 0;
  const isWicket  = raw.isWicket ?? false;

  // Derive boundary flags when the API doesn't send them explicitly.
  // Guard: a 4 off a no-ball is runs=4, extras≥1 — that's NOT a boundary 4.
  const isBoundary4 =
    raw.isBoundary4 !== undefined
      ? raw.isBoundary4
      : runs === 4 && extras === 0 && !isWicket;
  const isBoundary6 =
    raw.isBoundary6 !== undefined
      ? raw.isBoundary6
      : runs === 6 && extras === 0 && !isWicket;

  return {
    id: raw.id,
    inningsNumber: raw.inningsNumber,
    over,
    ballInOver,
    timestampIso:  raw.timestampIso ?? new Date().toISOString(),
    batterId:      raw.batterId ?? raw.batterName,
    batterName:    normaliseName(raw.batterName),
    bowlerId:      raw.bowlerId ?? raw.bowlerName,
    bowlerName:    normaliseName(raw.bowlerName),
    runs,
    extras,
    extraType,
    isWicket,
    dismissalType: raw.dismissalType,
    isBoundary4,
    isBoundary6,
    oneLiner:       raw.oneLiner,
    nextBatterName: raw.nextBatterName,
  };
}

// ============================================================================
// Cricbuzz (unofficial) — https://cricbuzz-cricket.p.rapidapi.com
// Most widely used for Indian cricket. Real-time ball-by-ball.
// ============================================================================

/** Raw shape from GET /matches/v1/live → matchList[].adDetail or seriesMatches */
export interface CricbuzzRawMatch {
  matchInfo: {
    matchId: number;
    seriesId: number;
    seriesName: string;
    matchFormat: string;          // "T20", "TEST", "ODI"
    state: string;                // "In Progress", "Complete", "Preview"
    status: string;               // "MI won by 4 wickets", etc.
    team1: { teamId: number; teamName: string; teamSName: string; };
    team2: { teamId: number; teamName: string; teamSName: string; };
    venueInfo?: { ground: string; city: string; };
    startDate: string;            // epoch ms as string
  };
  matchScore?: {
    team1Score?: { inngs1?: CricbuzzInningsScore; inngs2?: CricbuzzInningsScore; };
    team2Score?: { inngs1?: CricbuzzInningsScore; inngs2?: CricbuzzInningsScore; };
  };
}

export interface CricbuzzInningsScore {
  inningsId: number;
  runs: number;
  wickets: number;
  overs: number;
}

/** Raw shape from GET /mcenter/v1/{matchId}/hscard (scorecard) */
export interface CricbuzzRawScorecard {
  scoreCard: Array<{
    inningsId: number;
    batTeamDetails: {
      batTeamName: string;
      batsmenData: Record<string, {
        batId: number;    // Cricbuzz's canonical numeric player ID — use as playerId
        batName: string; runs: number; balls: number;
        fours: number; sixes: number; strikeRate: number;
        outDesc: string; wicketCode: string;
      }>;
    };
    bowlTeamDetails: {
      bowlTeamName: string;
      bowlersData: Record<string, {
        bowlId: number;   // Cricbuzz's canonical numeric player ID — use as playerId
        bowlName: string; overs: number; maidens: number;
        runs: number; wickets: number; economy: number;
      }>;
    };
  }>;
}

/** Raw shape from GET /series/v1/{seriesId}/standings */
export interface CricbuzzRawStandings {
  standingsData: Array<{
    teamId: number;
    teamName: string;
    teamSName: string;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    matchesDraw: number;
    noResult: number;
    points: number;
    nrr: number;
    seriesId: number;
  }>;
}

// ============================================================================
// Competition ID normalisation
// ============================================================================
// The series schedule bottom sheet filters matches by competition.id.
// This MUST be the same string for every match in a series (past, live,
// upcoming). Different API endpoints (recent, live, schedule) often return
// the same series under slightly different IDs. Normalise here at the
// transformer boundary so no UI code ever has to compensate.
//
// Strategy:
//   1. Keep CRICBUZZ_SERIES_ID_MAP as the single source of truth that maps
//      numeric Cricbuzz seriesId → your internal competition.id string.
//   2. Every transformer function (live, recent, schedule) resolves the
//      competition object through this map — never pass the raw seriesId into
//      Match.competition.id.
//   3. If an API returns a seriesId you haven't mapped yet, fall back to
//      `"unknown-series-${seriesId}"` and log a warning. The series sheet
//      will still work (returns 0 matches) but won't silently mix up series.
export function resolveCompetition(
  seriesId: number,
  seriesIdMap: Record<number, Competition>,
  seriesName: string,
): Competition {
  const mapped = seriesIdMap[seriesId];
  if (mapped) return mapped;
  // Fallback — keeps the sheet from crashing; surface this in your API-wiring TODO list
  console.warn(`[transformers] Unknown Cricbuzz seriesId ${seriesId} ("${seriesName}") — add to CRICBUZZ_SERIES_ID_MAP`);
  return {
    id: `unknown-series-${seriesId}`,
    name: seriesName,
    shortName: seriesName,
    type: "bilateral",
    format: "T20I",
    season: new Date().getFullYear().toString(),
    logoColor: "#64748B",
    hasStandings: false,
  };
}

/**
 * Transform a Cricbuzz live match summary → internal Match (partial — no balls).
 * Use resolveCompetition() (above) to get the competition object — never pass
 * raw seriesId strings directly into Match.competition.id.
 */
export function transformCricbuzzMatch(
  raw: CricbuzzRawMatch,
  competition: Competition,          // resolved externally via CRICBUZZ_SERIES_ID_MAP
  teamA: Team,                       // resolved externally via CRICBUZZ_TEAM_ID_MAP
  teamB: Team,
  allCompetitions: Record<string, Competition>, // pass your full COMPETITIONS object
): Match {
  const format = normalizeCricbuzzFormat(raw.matchInfo.matchFormat);
  const status = normalizeCricbuzzStatus(raw.matchInfo.state);

  // Auto-resolve championship: look up the series ID in CRICBUZZ_CHAMPIONSHIP_MAP.
  // If found, attach the championship — no manual tagging needed per match.
  const championshipId = CRICBUZZ_CHAMPIONSHIP_MAP[raw.matchInfo.seriesId];
  const championship = championshipId
    ? Object.values(allCompetitions).find(c => c.id === championshipId)
    : undefined;

  const innings: Innings[] = [];
  // TODO: map raw.matchScore into innings[] using battingTeam + bowlingTeam lookup
  // For now returns shell — fill in via transformCricbuzzScorecard below

  return {
    id: `cricbuzz-${raw.matchInfo.matchId}`,
    format,
    competition,
    championship,                    // auto-set from CRICBUZZ_CHAMPIONSHIP_MAP
    startTimeIso: new Date(Number(raw.matchInfo.startDate)).toISOString(),
    status,
    venue: {
      id: String(raw.matchInfo.venueInfo?.ground ?? "unknown"),
      name: raw.matchInfo.venueInfo?.ground ?? "Unknown Venue",
      city: raw.matchInfo.venueInfo?.city ?? "",
    },
    teamA,
    teamB,
    innings,
    liveStatusOverride: status === "live" ? raw.matchInfo.status : undefined,
  };
}

/**
 * Merge Cricbuzz scorecard data into innings[] on an existing Match.
 * Call after transformCricbuzzMatch to fill batting/bowling cards.
 */
export function transformCricbuzzScorecard(
  raw: CricbuzzRawScorecard,
  match: Match,
): Match {
  const innings: Innings[] = raw.scoreCard.map((card, idx) => {
    const battingTeam =
      card.batTeamDetails.batTeamName === match.teamA.fullName
        ? match.teamA.code
        : match.teamB.code;
    const bowlingTeam = battingTeam === match.teamA.code ? match.teamB.code : match.teamA.code;

    const battingCard: BattingEntry[] = Object.values(card.batTeamDetails.batsmenData).map(b => ({
      // Use Cricbuzz's own numeric ID as playerId — this is what the /player/[id] route
      // will receive, ensuring batting-card links always resolve to the right profile.
      playerId: b.batId.toString(),
      playerName: b.batName,
      runs: b.runs,
      ballsFaced: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      strikeRate: b.strikeRate,
      out: b.wicketCode !== "not-out" && b.wicketCode !== "",
      dismissal: b.outDesc || undefined,
    }));

    const bowlingCard: BowlingEntry[] = Object.values(card.bowlTeamDetails.bowlersData).map(b => ({
      playerId: b.bowlId.toString(),
      playerName: b.bowlName,
      oversBowled: b.overs,
      maidens: b.maidens,
      runsConceded: b.runs,
      wickets: b.wickets,
      economy: b.economy,
    }));

    // TODO: pull runs/wickets/overs from matchScore rather than re-computing
    const runs = battingCard.reduce((s, b) => s + b.runs, 0);
    const wickets = battingCard.filter(b => b.out).length;

    return {
      number: (idx + 1) as 1 | 2 | 3 | 4,
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      overs: 0,       // TODO: pull from matchScore
      balls: [],      // TODO: fill from ball-by-ball endpoint
      battingCard,
      bowlingCard,
    };
  });

  return { ...match, innings };
}

/**
 * Transform Cricbuzz standings → internal CompetitionStandings.
 */
export function transformCricbuzzStandings(
  raw: CricbuzzRawStandings,
  competitionId: string,
  qualifyingSpots: number = 4,
): CompetitionStandings {
  const rows: StandingsRow[] = raw.standingsData.map(r => ({
    teamCode: r.teamSName,      // TODO: map to your internal team code
    played: r.matchesPlayed,
    won: r.matchesWon,
    lost: r.matchesLost,
    drawn: r.matchesDraw > 0 ? r.matchesDraw : undefined,
    noResult: r.noResult,
    netRunRate: r.nrr,
    points: r.points,
  }));

  // Mark qualifying spots
  rows.forEach((row, idx) => {
    row.qualified = idx < qualifyingSpots ? "playoff" : null;
  });

  return {
    competitionId,
    phaseLabel: "Points Table",
    updatedAt: new Date().toISOString(),
    rows,
    showNrr: true,
    showDrawn: rows.some(r => (r.drawn ?? 0) > 0),
    qualifyingSpots,
  };
}


// ============================================================================
// Player profile transformers
// ============================================================================

/**
 * Raw shape from GET /stats/v1/player/{playerId} (Cricbuzz player profile).
 * Only the fields we actually map are typed here.
 */
export interface CricbuzzRawPlayer {
  id: number;
  name: string;
  nickName?: string;
  dateOfBirth?: string;         // "Nov 05, 1988"
  role?: string;                // "Batsman", "Bowler", "All Rounder", "WK-Batsman"
  battingStyle?: string;        // "Right Handed Bat"
  bowlingStyle?: string;        // "Right-arm fast"
  intlTeam?: string;            // "India"
  bio?: string;
  rankings?: {
    bat?: { testRank?: string; odiRank?: string; t20Rank?: string; };
    bowl?: { testRank?: string; odiRank?: string; t20Rank?: string; };
  };
}

/**
 * Raw shape from GET /stats/v1/player/{playerId}/batting or /bowling.
 * Career stats keyed by matchType.
 */
export interface CricbuzzRawPlayerStats {
  values: Array<{
    matchType: string;          // "test", "odi", "t20i", "ipl"
    matches: string;
    inns?: string;
    runs?: string;
    hs?: string;
    avg?: string;
    sr?: string;
    hundreds?: string;
    fifties?: string;
    wickets?: string;
    bb?: string;
    bowlAvg?: string;
    eco?: string;
    fiveWickets?: string;
  }>;
}


function parseCricbuzzRole(role?: string): PlayerProfile["role"] {
  if (!role) return "batsman";
  const r = role.toLowerCase();
  if (r.includes("all")) return "all-rounder";
  if (r.includes("bowl")) return "bowler";
  if (r.includes("wk") || r.includes("wicket")) return "wicket-keeper";
  return "batsman";
}

function parseCricbuzzBattingStyle(s?: string): "RHB" | "LHB" | undefined {
  if (!s) return undefined;
  return s.toLowerCase().includes("left") ? "LHB" : "RHB";
}

function parseCricbuzzFormatStats(
  battingValues: CricbuzzRawPlayerStats["values"],
  bowlingValues: CricbuzzRawPlayerStats["values"],
  matchType: string,
): FormatStats | undefined {
  const bat = battingValues.find(v => v.matchType.toLowerCase() === matchType);
  const bowl = bowlingValues.find(v => v.matchType.toLowerCase() === matchType);
  if (!bat && !bowl) return undefined;

  const matches = parseInt(bat?.matches ?? bowl?.matches ?? "0");
  if (matches === 0) return undefined;

  return {
    matches,
    innings:            bat?.inns      ? parseInt(bat.inns)     : undefined,
    runs:               bat?.runs      ? parseInt(bat.runs)      : undefined,
    highScore:          bat?.hs        ?? undefined,
    battingAvg:         bat?.avg       ? parseFloat(bat.avg)     : undefined,
    battingStrikeRate:  bat?.sr        ? parseFloat(bat.sr)      : undefined,
    hundreds:           bat?.hundreds  ? parseInt(bat.hundreds)  : undefined,
    fifties:            bat?.fifties   ? parseInt(bat.fifties)   : undefined,
    wickets:            bowl?.wickets  ? parseInt(bowl.wickets)  : undefined,
    bestBowling:        bowl?.bb       ?? undefined,
    bowlingAvg:         bowl?.bowlAvg  ? parseFloat(bowl.bowlAvg): undefined,
    economy:            bowl?.eco      ? parseFloat(bowl.eco)    : undefined,
    fiveWickets:        bowl?.fiveWickets ? parseInt(bowl.fiveWickets) : undefined,
  };
}

/**
 * Transform a Cricbuzz player profile + career stats → internal PlayerProfile.
 *
 * Usage (in /player/[id]/page.tsx, Tier 2):
 *   const rawProfile = await fetchCricbuzzPlayer(params.id);
 *   const rawBatting = await fetchCricbuzzPlayerStats(params.id, "batting");
 *   const rawBowling = await fetchCricbuzzPlayerStats(params.id, "bowling");
 *   const player = transformCricbuzzPlayer(rawProfile, rawBatting, rawBowling);
 */
export function transformCricbuzzPlayer(
  raw: CricbuzzRawPlayer,
  batting: CricbuzzRawPlayerStats,
  bowling: CricbuzzRawPlayerStats,
): PlayerProfile {
  const id = raw.id.toString();
  return {
    id,
    name:          raw.name,
    shortName:     raw.nickName ?? raw.name,
    dateOfBirth:   raw.dateOfBirth,      // TODO: normalise to YYYY-MM-DD
    nationality:   raw.intlTeam ?? "Unknown",
    role:          parseCricbuzzRole(raw.role),
    battingStyle:  parseCricbuzzBattingStyle(raw.battingStyle),
    bowlingStyle:  raw.bowlingStyle,
    bio:           raw.bio,
    iccRankings: {
      testBatting:  raw.rankings?.bat?.testRank ? parseInt(raw.rankings.bat.testRank) : undefined,
      odiBatting:   raw.rankings?.bat?.odiRank  ? parseInt(raw.rankings.bat.odiRank)  : undefined,
      t20iBatting:  raw.rankings?.bat?.t20Rank  ? parseInt(raw.rankings.bat.t20Rank)  : undefined,
      testBowling:  raw.rankings?.bowl?.testRank ? parseInt(raw.rankings.bowl.testRank) : undefined,
      odiBowling:   raw.rankings?.bowl?.odiRank  ? parseInt(raw.rankings.bowl.odiRank)  : undefined,
      t20iBowling:  raw.rankings?.bowl?.t20Rank  ? parseInt(raw.rankings.bowl.t20Rank)  : undefined,
    },
    testStats:  parseCricbuzzFormatStats(batting.values, bowling.values, "test"),
    odiStats:   parseCricbuzzFormatStats(batting.values, bowling.values, "odi"),
    t20iStats:  parseCricbuzzFormatStats(batting.values, bowling.values, "t20i"),
    franchiseStats:   parseCricbuzzFormatStats(batting.values, bowling.values, "ipl"),
  };
}

// ============================================================================
// ESPN Cricinfo / sportsdata.io — https://api.sportsdata.io/v3/cricket
// Better for international coverage + historical data.
// ============================================================================

/** Partial raw shape from GET /scores/json/LiveMatches */
export interface ESPNRawMatch {
  GameId: number;
  Season: string;
  Status: string;          // "InProgress" | "Final" | "Scheduled"
  DateTime: string;        // ISO
  HomeTeamId: number;
  AwayTeamId: number;
  HomeTeamName: string;
  AwayTeamName: string;
  VenueName?: string;
  VenueLocation?: string;
  Innings?: ESPNRawInnings[];
}

export interface ESPNRawInnings {
  InningsNumber: number;
  BattingTeamId: number;
  BowlingTeamId: number;
  Runs: number;
  Wickets: number;
  Overs: number;
  Balls?: ESPNRawBall[];
}

export interface ESPNRawBall {
  BallId: string;
  Over: number;
  BallNumber: number;
  BatterId: number;
  BatterName: string;
  BowlerId: number;
  BowlerName: string;
  Runs: number;
  Extras: number;
  IsWicket: boolean;
  IsBoundary4: boolean;
  IsBoundary6: boolean;
}


/** Partial shape from GET /players/json/PlayersByTeam/{teamId} or /players/json/Player/{playerId} */
export interface ESPNRawPlayer {
  PlayerId: number;
  FirstName: string;
  LastName: string;
  CommonName?: string;
  DateOfBirth?: string;          // "1988-11-05"
  Nationality?: string;
  Position?: string;             // "Batsman" | "Bowler" | "All Rounder" | "Wicket Keeper"
  BattingHand?: string;          // "Right" | "Left"
  BowlingStyle?: string;
  Biography?: string;
  BattingAverage?: number;
  BattingStrikeRate?: number;
  TotalRuns?: number;
  TotalWickets?: number;
  BowlingAverage?: number;
  BowlingEconomy?: number;
  IccBattingRankTest?: number;
  IccBattingRankOdi?: number;
  IccBattingRankT20?: number;
  IccBowlingRankTest?: number;
  IccBowlingRankOdi?: number;
  IccBowlingRankT20?: number;
  // Stats are broken out by format in a separate endpoint
  Stats?: ESPNRawPlayerStats[];
}

export interface ESPNRawPlayerStats {
  Type: string;                  // "Test" | "ODI" | "T20I" | "T20" (IPL)
  Matches: number;
  Innings?: number;
  Runs?: number;
  HighScore?: string;
  Average?: number;
  StrikeRate?: number;
  Hundreds?: number;
  Fifties?: number;
  Wickets?: number;
  BestBowling?: string;
  BowlingAverage?: number;
  Economy?: number;
  FiveWickets?: number;
}

/**
 * Transform ESPN raw match → internal Match.
 * TODO: resolve HomeTeamId/AwayTeamId → Team via a maintained ID→code lookup.
 */
export function transformESPNMatch(
  raw: ESPNRawMatch,
  competition: Competition,
  teamA: Team,   // home team
  teamB: Team,   // away team
): Match {
  const innings: Innings[] = (raw.Innings ?? []).map(inn => ({
    number: inn.InningsNumber as 1 | 2 | 3 | 4,
    battingTeam: inn.BattingTeamId === teamA.code as unknown as number ? teamA.code : teamB.code,
    bowlingTeam: inn.BowlingTeamId === teamA.code as unknown as number ? teamA.code : teamB.code,
    runs: inn.Runs,
    wickets: inn.Wickets,
    overs: inn.Overs,
    balls: (inn.Balls ?? []).map(b => transformESPNBall(b, inn.InningsNumber as 1 | 2 | 3 | 4)),
    battingCard: [],  // TODO: fetch from scorecard endpoint
    bowlingCard: [],
  }));

  return {
    id: `espn-${raw.GameId}`,
    format: "T20" as MatchFormat,   // TODO: derive from competition
    competition,
    startTimeIso: raw.DateTime,
    status: raw.Status === "InProgress" ? "live"
           : raw.Status === "Final" ? "post-match"
           : "upcoming",
    venue: {
      id: String(raw.VenueName ?? "unknown"),
      name: raw.VenueName ?? "Unknown Venue",
      city: raw.VenueLocation ?? "",
    },
    teamA,
    teamB,
    innings,
  };
}


/** Partial shape from GET /stats/json/PlayerStatsByGame/{gameId} */
export interface ESPNRawScorecard {
  BattingStats: Array<{
    PlayerId: number;
    PlayerName: string;
    Runs: number;
    BallsFaced: number;
    Fours: number;
    Sixes: number;
    StrikeRate: number;
    HowOut?: string;
  }>;
  BowlingStats: Array<{
    PlayerId: number;
    PlayerName: string;
    Overs: number;
    Maidens: number;
    Runs: number;
    Wickets: number;
    Economy: number;
  }>;
}

/**
 * Transform ESPN scorecard → BattingEntry[] + BowlingEntry[].
 * Call per innings and inject into Innings.battingCard / bowlingCard.
 */
export function transformESPNScorecard(raw: ESPNRawScorecard): {
  battingCard: BattingEntry[];
  bowlingCard: BowlingEntry[];
} {
  return {
    battingCard: raw.BattingStats.map(b => ({
      playerId: b.PlayerId.toString(),   // ESPN numeric ID → /player/[id]
      playerName: b.PlayerName,
      runs: b.Runs,
      ballsFaced: b.BallsFaced,
      fours: b.Fours,
      sixes: b.Sixes,
      strikeRate: b.StrikeRate,
      out: !!b.HowOut && b.HowOut !== "not out" && b.HowOut !== "",
      dismissal: b.HowOut || undefined,
    })),
    bowlingCard: raw.BowlingStats.map(b => ({
      playerId: b.PlayerId.toString(),
      playerName: b.PlayerName,
      oversBowled: b.Overs,
      maidens: b.Maidens,
      runsConceded: b.Runs,
      wickets: b.Wickets,
      economy: b.Economy,
    })),
  };
}

function transformESPNBall(raw: ESPNRawBall, inningsNumber: 1 | 2 | 3 | 4 = 1): Ball {
  // ESPN sportsdata.io conventions:
  //   Over       — 1-indexed (Over 1 = first over)     → overIsZeroIndexed: false
  //   BallNumber — 1-indexed (BallNumber 1 = first ball) → ballInOverIsOneIndexed: true
  //   IsBoundary4/6 — explicit booleans sent; normalizeBall respects them.
  return normalizeBall({
    id: raw.BallId,
    inningsNumber,
    over: raw.Over,
    ballInOver: raw.BallNumber,
    batterId: String(raw.BatterId),
    batterName: raw.BatterName,
    bowlerId: String(raw.BowlerId),
    bowlerName: raw.BowlerName,
    runs: raw.Runs,
    extras: raw.Extras,
    isWicket: raw.IsWicket,
    isBoundary4: raw.IsBoundary4,
    isBoundary6: raw.IsBoundary6,
    overIsZeroIndexed: false,       // ESPN Over is 1-indexed
    ballInOverIsOneIndexed: true,   // ESPN BallNumber is 1-indexed
  });
}


/**
 * Transform ESPN raw player → internal PlayerProfile.
 *
 * Usage (in /player/[id]/page.tsx, Tier 2):
 *   const raw = await fetchESPNPlayer(params.id);
 *   const player = transformESPNPlayer(raw);
 */
export function transformESPNPlayer(raw: ESPNRawPlayer): PlayerProfile {
  function parseESPNRole(pos?: string): PlayerProfile["role"] {
    if (!pos) return "batsman";
    const p = pos.toLowerCase();
    if (p.includes("all")) return "all-rounder";
    if (p.includes("bowl")) return "bowler";
    if (p.includes("wicket") || p.includes("keeper")) return "wicket-keeper";
    return "batsman";
  }

  function parseESPNFormatStats(stats: ESPNRawPlayerStats[], type: string): FormatStats | undefined {
    const s = stats.find(s => s.Type.toLowerCase() === type.toLowerCase());
    if (!s || s.Matches === 0) return undefined;
    return {
      matches:            s.Matches,
      innings:            s.Innings,
      runs:               s.Runs,
      highScore:          s.HighScore,
      battingAvg:         s.Average,
      battingStrikeRate:  s.StrikeRate,
      hundreds:           s.Hundreds,
      fifties:            s.Fifties,
      wickets:            s.Wickets,
      bestBowling:        s.BestBowling,
      bowlingAvg:         s.BowlingAverage,
      economy:            s.Economy,
      fiveWickets:        s.FiveWickets,
    };
  }

  const stats = raw.Stats ?? [];
  return {
    id: raw.PlayerId.toString(),
    name: raw.CommonName ?? `${raw.FirstName} ${raw.LastName}`,
    shortName: raw.LastName,
    dateOfBirth: raw.DateOfBirth,
    nationality: raw.Nationality ?? "Unknown",
    role: parseESPNRole(raw.Position),
    battingStyle: raw.BattingHand?.toLowerCase().includes("left") ? "LHB" : "RHB",
    bowlingStyle: raw.BowlingStyle,
    bio: raw.Biography,
    iccRankings: {
      testBatting:  raw.IccBattingRankTest,
      odiBatting:   raw.IccBattingRankOdi,
      t20iBatting:  raw.IccBattingRankT20,
      testBowling:  raw.IccBowlingRankTest,
      odiBowling:   raw.IccBowlingRankOdi,
      t20iBowling:  raw.IccBowlingRankT20,
    },
    testStats:  parseESPNFormatStats(stats, "Test"),
    odiStats:   parseESPNFormatStats(stats, "ODI"),
    t20iStats:  parseESPNFormatStats(stats, "T20I"),
    franchiseStats:   parseESPNFormatStats(stats, "T20"),
  };
}

// ============================================================================
// SportRadar Cricket API — enterprise tier, most complete ball-by-ball
// https://developer.sportradar.com/cricket/reference/cricket-overview
// ============================================================================

/** Partial shape from GET /sport_events/{id}/timeline.json */
export interface SportRadarTimeline {
  sport_event: {
    id: string;
    scheduled: string;
    tournament: { id: string; name: string; };
    competitors: Array<{ id: string; name: string; abbreviation: string; qualifier: "home" | "away" }>;
  };
  sport_event_status: {
    status: string;   // "live" | "closed" | "not_started"
    toss_won_by?: string;
    toss_decision?: "bat" | "bowl";
  };
  timeline?: Array<{
    id: number;
    type: string;   // "delivery" | "wicket" | "boundary" | "over_start"
    time: string;
    batting_team: string;
    bowling_team: string;
    over: number;
    delivery: number;
    runs_scored: number;
    runs_off_bat: number;
    extras_type?: string;
    batsman_name?: string;   // present in full delivery feeds
    bowler_name?: string;    // present in full delivery feeds
    wicket?: { type: string; };
    boundary?: { boundary_type: "4" | "6" };
  }>;
}

/**
 * Transform SportRadar timeline → internal Match with full ball-by-ball.
 * TODO: resolve competitor IDs → Team via a lookup table.
 */
export function transformSportRadarTimeline(
  raw: SportRadarTimeline,
  competition: Competition,
  teamA: Team,
  teamB: Team,
): Match {
  const deliveries = (raw.timeline ?? []).filter(e => e.type === "delivery");

  // Group deliveries by innings (batting_team changes = new innings)
  const inningsMap = new Map<string, typeof deliveries>();
  for (const d of deliveries) {
    const key = d.batting_team;
    if (!inningsMap.has(key)) inningsMap.set(key, []);
    inningsMap.get(key)!.push(d);
  }

  const innings: Innings[] = Array.from(inningsMap.entries()).map(([battingTeamId, balls], idx) => {
    const battingTeam = battingTeamId.includes(teamA.code) ? teamA.code : teamB.code;
    const bowlingTeam = battingTeam === teamA.code ? teamB.code : teamA.code;

    const internalBalls: Ball[] = balls.map(b => {
      // SportRadar timeline conventions:
      //   over     — 0-indexed (over 0 = first over)     → overIsZeroIndexed: true
      //   delivery — 0-indexed (delivery 0 = first ball) → ballInOverIsOneIndexed: false
      //   extras_type — free-form string e.g. "wide", "no_ball" → normalizeExtraType handles it
      //   boundary — nested object; absent when not a boundary  → normalizeBall derives when missing
      return normalizeBall({
        id: String(b.id),
        inningsNumber: (idx + 1) as 1 | 2 | 3 | 4,
        over: b.over,
        ballInOver: b.delivery,
        timestampIso: b.time,
        batterName: b.batsman_name ?? "Unknown",
        bowlerName: b.bowler_name ?? "Unknown",
        runs: b.runs_off_bat,                       // runs_off_bat = bat runs only
        extras: b.runs_scored - b.runs_off_bat,     // total − bat = extras
        extraType: b.extras_type,                   // normalized by normalizeBall
        isWicket: b.type === "wicket",
        isBoundary4: b.boundary?.boundary_type === "4",
        isBoundary6: b.boundary?.boundary_type === "6",
        overIsZeroIndexed: true,        // SportRadar over is 0-indexed
        ballInOverIsOneIndexed: false,  // SportRadar delivery is 0-indexed
      });
    });

    const runs = internalBalls.reduce((s, b) => s + b.runs, 0);
    const wickets = internalBalls.filter(b => b.isWicket).length;
    const lastBall = internalBalls[internalBalls.length - 1];
    const overs = lastBall ? lastBall.over + lastBall.ballInOver / 10 : 0;

    return {
      number: (idx + 1) as 1 | 2 | 3 | 4,
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      overs,
      balls: internalBalls,
      battingCard: [],   // TODO: populate from separate scorecard endpoint
      bowlingCard: [],
    };
  });

  const home = raw.sport_event.competitors.find(c => c.qualifier === "home");
  const away = raw.sport_event.competitors.find(c => c.qualifier === "away");
  const tossWinner = raw.sport_event_status.toss_won_by;
  const tossTeamCode = tossWinner?.includes(teamA.code) ? teamA.code : teamB.code;

  return {
    id: `sr-${raw.sport_event.id}`,
    format: "T20" as MatchFormat,   // TODO: derive from tournament type
    competition,
    startTimeIso: raw.sport_event.scheduled,
    status: raw.sport_event_status.status === "live" ? "live"
           : raw.sport_event_status.status === "closed" ? "post-match"
           : "upcoming",
    venue: { id: "unknown", name: "Unknown Venue", city: "" },   // TODO: tournament.venue endpoint
    teamA,
    teamB,
    toss: raw.sport_event_status.toss_won_by ? {
      winner: tossTeamCode,
      elected: raw.sport_event_status.toss_decision ?? "bat",
    } : undefined,
    innings,
  };
}



// ============================================================================
// SportRadar player profile
// ============================================================================

/** Partial shape from GET /players/{playerId}/profile.json */
export interface SportRadarRawPlayer {
  player: {
    id: string;                  // "sr:player:858454" — use as playerId
    name: string;                // "Kohli, Virat"
    date_of_birth?: string;      // "1988-11-05"
    nationality?: string;
    type?: string;               // "batsman" | "bowler" | "all-rounder" | "wicket_keeper_batsman"
    hand?: string;               // "right" | "left"
    bowling_hand?: string;
    bowling_style?: string;
    statistics?: {
      batting?: SportRadarFormatStats[];
      bowling?: SportRadarFormatStats[];
    };
  };
}

export interface SportRadarFormatStats {
  format: string;               // "test" | "odi" | "t20i" | "t20"
  matches_played: number;
  innings?: number;
  runs_scored?: number;
  highest_score?: string;
  batting_average?: number;
  strike_rate?: number;
  hundreds?: number;
  fifties?: number;
  wickets?: number;
  best_bowling_match?: string;
  bowling_average?: number;
  economy_rate?: number;
  five_wickets_haul?: number;
}

/** Partial shape from SportRadar scorecard endpoint — player IDs in scoring */
export interface SportRadarScorecardPlayer {
  id: string;                   // "sr:player:858454"
  name: string;
  runs?: number;
  balls_faced?: number;
  fours?: number;
  sixes?: number;
  strike_rate?: number;
  how_out?: string;
  overs_bowled?: number;
  maidens?: number;
  runs_conceded?: number;
  wickets?: number;
  economy?: number;
}

/**
 * Transform SportRadar scorecard players → BattingEntry[] / BowlingEntry[].
 */
export function transformSportRadarScorecard(
  batters: SportRadarScorecardPlayer[],
  bowlers: SportRadarScorecardPlayer[],
): { battingCard: BattingEntry[]; bowlingCard: BowlingEntry[] } {
  return {
    battingCard: batters.map(b => ({
      playerId: b.id,           // full "sr:player:858454" ID — used as /player/[id]
      playerName: b.name,
      runs: b.runs ?? 0,
      ballsFaced: b.balls_faced ?? 0,
      fours: b.fours ?? 0,
      sixes: b.sixes ?? 0,
      strikeRate: b.strike_rate ?? 0,
      out: !!b.how_out && b.how_out !== "not_out",
      dismissal: b.how_out?.replace(/_/g, " ") || undefined,
    })),
    bowlingCard: bowlers.map(b => ({
      playerId: b.id,
      playerName: b.name,
      oversBowled: b.overs_bowled ?? 0,
      maidens: b.maidens ?? 0,
      runsConceded: b.runs_conceded ?? 0,
      wickets: b.wickets ?? 0,
      economy: b.economy ?? 0,
    })),
  };
}

/**
 * Transform SportRadar player profile → internal PlayerProfile.
 *
 * Usage (in /player/[id]/page.tsx, Tier 2):
 *   const raw = await fetchSportRadarPlayer(params.id);
 *   const player = transformSportRadarPlayer(raw);
 */
export function transformSportRadarPlayer(raw: SportRadarRawPlayer): PlayerProfile {
  const p = raw.player;

  function parseSRRole(type?: string): PlayerProfile["role"] {
    if (!type) return "batsman";
    const t = type.toLowerCase();
    if (t.includes("all")) return "all-rounder";
    if (t.includes("bowl")) return "bowler";
    if (t.includes("wicket") || t.includes("keeper")) return "wicket-keeper";
    return "batsman";
  }

  function parseSRFormatStats(
    batting: SportRadarFormatStats[],
    bowling: SportRadarFormatStats[],
    format: string,
  ): FormatStats | undefined {
    const bat  = batting.find(s => s.format === format);
    const bowl = bowling.find(s => s.format === format);
    if (!bat && !bowl) return undefined;
    const matches = bat?.matches_played ?? bowl?.matches_played ?? 0;
    if (matches === 0) return undefined;
    return {
      matches,
      innings:           bat?.innings,
      runs:              bat?.runs_scored,
      highScore:         bat?.highest_score,
      battingAvg:        bat?.batting_average,
      battingStrikeRate: bat?.strike_rate,
      hundreds:          bat?.hundreds,
      fifties:           bat?.fifties,
      wickets:           bowl?.wickets,
      bestBowling:       bowl?.best_bowling_match,
      bowlingAvg:        bowl?.bowling_average,
      economy:           bowl?.economy_rate,
      fiveWickets:       bowl?.five_wickets_haul,
    };
  }

  const batting = p.statistics?.batting ?? [];
  const bowling = p.statistics?.bowling ?? [];

  // Normalise "Kohli, Virat" → "Virat Kohli"
  const nameParts = p.name.split(",").map(s => s.trim()).reverse();
  const fullName = nameParts.join(" ");

  return {
    id: p.id,                               // "sr:player:858454"
    name: fullName,
    shortName: nameParts[nameParts.length - 1] ?? fullName,
    dateOfBirth: p.date_of_birth,
    nationality: p.nationality ?? "Unknown",
    role: parseSRRole(p.type),
    battingStyle: p.hand === "left" ? "LHB" : "RHB",
    bowlingStyle: p.bowling_style,
    testStats:  parseSRFormatStats(batting, bowling, "test"),
    odiStats:   parseSRFormatStats(batting, bowling, "odi"),
    t20iStats:  parseSRFormatStats(batting, bowling, "t20i"),
    franchiseStats:   parseSRFormatStats(batting, bowling, "t20"),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function normalizeCricbuzzFormat(raw: string): MatchFormat {
  switch (raw.toUpperCase()) {
    case "TEST": return "Test";
    case "ODI":  return "ODI";
    case "T20":  return "T20";
    case "T20I": return "T20I";
    default:     return "T20";
  }
}

function normalizeCricbuzzStatus(state: string): Match["status"] {
  switch (state) {
    case "In Progress":  return "live";
    case "Complete":     return "post-match";
    case "Preview":      return "upcoming";
    case "Toss":         return "toss";
    default:             return "upcoming";
  }
}

// ============================================================================
// ID lookup tables — maintain these as you onboard teams & competitions
// ============================================================================

/**
 * Map Cricbuzz series IDs → internal competition IDs.
 * Add entries as you encounter new series IDs in the API response.
 */
export const CRICBUZZ_SERIES_ID_MAP: Record<number, string> = {
  // 9237: "ipl-2026",   // example — replace with real series IDs
};

/**
 * Map Cricbuzz series IDs → overarching championship IDs.
 *
 * HOW THIS WORKS:
 * Each bilateral Test series has its own Cricbuzz series ID. The ICC announces
 * which series contribute to the WTC cycle at the start of each cycle.
 * Fill this table once per cycle — it auto-applies to every match in those series.
 *
 * WTC 2025-27 contributing series (add real IDs when you get API access):
 *   Ashes 2025-26           → "wtc-2025-27"
 *   India in England 2026   → "wtc-2025-27"
 *   SA in NZ 2026           → "wtc-2025-27"
 *   ... (all 27 ICC-designated WTC series)
 *
 * Refresh this map at the start of each new WTC cycle (every 2 years).
 */
export const CRICBUZZ_CHAMPIONSHIP_MAP: Record<number, string> = {
  // Example (replace with real Cricbuzz series IDs):
  // 7607: "wtc-2025-27",  // Ashes 2025-26
  // 7891: "wtc-2025-27",  // India tour of England 2026
  // 7654: "wtc-2025-27",  // SA tour of New Zealand 2025-26
};

/**
 * Map ESPN/sportsdata.io series IDs → overarching championship IDs.
 * Same concept as CRICBUZZ_CHAMPIONSHIP_MAP — fill once per cycle.
 */
export const ESPN_CHAMPIONSHIP_MAP: Record<number, string> = {
  // Example:
  // 4321: "wtc-2025-27",  // Ashes 2025-26
};

/**
 * Map SportRadar tournament IDs → overarching championship IDs.
 */
export const SPORTRADAR_CHAMPIONSHIP_MAP: Record<string, string> = {
  // Example:
  // "sr:tournament:56789": "wtc-2025-27",
};

/**
 * Map Cricbuzz team IDs → internal team codes.
 */
export const CRICBUZZ_TEAM_ID_MAP: Record<number, string> = {
  // 2: "IND", 3: "AUS", etc. — fill from Cricbuzz team list API
};

/**
 * Map SportRadar competitor IDs → internal team codes.
 */
export const SPORTRADAR_TEAM_ID_MAP: Record<string, string> = {
  // "sr:competitor:123456": "MI",
};

// ============================================================================
// Test session derivation — fallback when API has no explicit session events
// ============================================================================
//
// Real-time Test feeds rarely send explicit "lunch break" or "tea break" events.
// This function detects session boundaries from gaps in ball timestamps and
// produces the same TestSession[] shape the DigestTab expects.
//
// How to use:
//   In your match transformer, after building inn.balls, call:
//
//     if (match.format === "Test" && inn.balls.some(b => b.timestampIso)) {
//       inn.sessions = deriveTestSessions(inn.balls, match.startTimeIso, isLive);
//     }
//
//   If explicit session/stoppage events ARE available from your API, either
//   build the sessions array directly from that data (skip this function),
//   or pass them as `knownStoppages` below so the real signal overrides the
//   timestamp-gap heuristic wherever the two would disagree.
//
// Gap thresholds (same calendar day):
//   20–75 min  → genuine session break (lunch or tea) — starts a new session
//   > 75 min   → irregular stoppage (rain / bad light / other delay) — play
//                resumes but it's still the SAME session, just interrupted;
//                does not advance the session index or split into a new
//                session the way a real lunch/tea break does
//   < 20 min   → normal play gap (drinks, over change, etc.) — ignored
//   any gap that crosses a calendar day (UTC) → always a new day, regardless
//                of gap length
//
// WHY THIS MATTERS: a naive "any gap over ~20 min = new session" rule
// mistakes a multi-hour rain delay for a lunch/tea break, which both
// mislabels the resumed play (e.g. calling it "2nd Session" when it's
// really an interrupted "1st Session") and can exhaust the 3-session/day
// cycle early, throwing off every session label for the rest of that day.
// Genuine lunch/tea breaks have a tight, predictable duration; weather and
// bad-light stoppages routinely run far longer and unpredictably — that
// duration gap is what SESSION_BREAK_MAX_MS distinguishes on.
// ============================================================================


const SESSION_BREAK_MIN_MS = 20 * 60 * 1000; // 20 min  — below this, ignore (drinks/over change)
const SESSION_BREAK_MAX_MS = 75 * 60 * 1000; // 75 min  — above this, treat as a weather/light
                                              // stoppage within the same session, not a real
                                              // lunch/tea break (generous upper bound for a
                                              // slightly-extended tea break before we call it
                                              // "irregular")

/** A known, API-confirmed stoppage window — always trusted over the gap heuristic. */
export interface KnownStoppage {
  startIso: string;
  endIso: string;
}

function isWithinKnownStoppage(fromIso: string, toIso: string, knownStoppages: KnownStoppage[]): boolean {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return knownStoppages.some(s => {
    const sStart = new Date(s.startIso).getTime();
    const sEnd = new Date(s.endIso).getTime();
    // The gap between two balls overlaps a known stoppage window
    return from <= sEnd && to >= sStart;
  });
}

/**
 * Derive Test match session metadata from ball timestamps.
 *
 * @param balls         All balls for one innings (may include extras).
 * @param matchStartIso ISO string for the match's scheduled start time — used
 *                      to compute the day number (Day 1 = match start date).
 * @param isLastInnLive Set true when this is the live innings still in
 *                      progress; marks the last session as isComplete: false.
 * @param knownStoppages Optional explicit stoppage windows from the API (rain
 *                      delays, bad light, etc.). When a gap between two balls
 *                      overlaps one of these, it's always treated as an
 *                      in-session stoppage — never inferred as a session
 *                      break — regardless of how long the gap is.
 */
export function deriveTestSessions(
  balls: Ball[],
  matchStartIso: string,
  isLastInnLive = false,
  knownStoppages: KnownStoppage[] = []
): TestSession[] {
  // Only balls with timestamps are usable
  const withTs = balls.filter(b => b.timestampIso);
  if (withTs.length === 0) return [];

  const sorted = [...withTs].sort(
    (a, b) =>
      new Date(a.timestampIso!).getTime() - new Date(b.timestampIso!).getTime()
  );

  // Match start — midnight of the match start date (timezone-naive, UTC)
  const matchStartDate = new Date(matchStartIso);
  matchStartDate.setUTCHours(0, 0, 0, 0);

  function utcDateKey(iso: string): number {
    const d = new Date(iso);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  }

  // ── Step 1: split balls into session groups at significant gaps ──────────
  // A new group starts when EITHER: the calendar day changed (always, no
  // matter the gap size — covers multi-day rain washouts cleanly), OR the
  // gap falls within the genuine lunch/tea window. A gap longer than that
  // window, on the same day, is treated as a mid-session weather/light
  // stoppage: play merges back into the CURRENT group rather than starting
  // a new session.
  const groups: Ball[][] = [];
  let current: Ball[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevIso = sorted[i - 1].timestampIso!;
    const curIso = sorted[i].timestampIso!;
    const gap = new Date(curIso).getTime() - new Date(prevIso).getTime();
    const dayChanged = utcDateKey(curIso) !== utcDateKey(prevIso);
    const knownStoppage = knownStoppages.length > 0 && isWithinKnownStoppage(prevIso, curIso, knownStoppages);

    const isGenuineSessionBreak =
      !knownStoppage &&
      !dayChanged &&
      gap >= SESSION_BREAK_MIN_MS &&
      gap <= SESSION_BREAK_MAX_MS;

    if (dayChanged || isGenuineSessionBreak) {
      groups.push(current);
      current = [];
    }
    // else: either a normal gap, or a same-day irregular/known stoppage —
    // keep accumulating into the current session group uninterrupted.
    current.push(sorted[i]);
  }
  groups.push(current);

  // ── Step 2: map each group to a TestSession ──────────────────────────────
  const SESSION_ORDER: Array<"first" | "second" | "third"> = [
    "first",
    "second",
    "third",
  ];

  // Track how many sessions have occurred per day so far
  const daySessionCount = new Map<number, number>();

  return groups.map((group, gIdx) => {
    // Determine day number from the first ball's UTC date
    const firstTs = new Date(group[0].timestampIso!);
    const firstMidnight = new Date(firstTs);
    firstMidnight.setUTCHours(0, 0, 0, 0);
    const dayNum =
      Math.round(
        (firstMidnight.getTime() - matchStartDate.getTime()) / (24 * 3600 * 1000)
      ) + 1;

    // Assign session name (morning → afternoon → evening, reset each day)
    const sessIdx = daySessionCount.get(dayNum) ?? 0;
    daySessionCount.set(dayNum, sessIdx + 1);

    const session = SESSION_ORDER[sessIdx % 3];
    const SESSION_LABELS: Record<string, string> = {
      first: "1st Session", second: "2nd Session", third: "3rd Session",
    };
    const label = `Day ${dayNum} ${SESSION_LABELS[session] ?? session}`;

    // Over range from the group's balls
    const overs = group.map(b => b.over);
    const startOver = Math.min(...overs);
    const endOver = Math.max(...overs);

    const isComplete = !(isLastInnLive && gIdx === groups.length - 1);

    return { day: dayNum, session, label, startOver, endOver, isComplete };
  });
}
