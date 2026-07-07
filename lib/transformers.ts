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
    balls: (inn.Balls ?? []).map(b => transformESPNBall(b)),
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

function transformESPNBall(raw: ESPNRawBall): Ball {
  return {
    id: raw.BallId,
    inningsNumber: 1,   // TODO: pass innings number from parent
    over: raw.Over,
    ballInOver: raw.BallNumber,
    timestampIso: new Date().toISOString(),   // ESPN doesn't provide per-ball timestamps
    batterId: String(raw.BatterId),
    batterName: normaliseName(raw.BatterName),
    bowlerId: String(raw.BowlerId),
    bowlerName: normaliseName(raw.BowlerName),
    runs: raw.Runs,
    extras: raw.Extras,
    isWicket: raw.IsWicket,
    isBoundary4: raw.IsBoundary4,
    isBoundary6: raw.IsBoundary6,
  };
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

    const internalBalls: Ball[] = balls.map(b => ({
      id: String(b.id),
      inningsNumber: (idx + 1) as 1 | 2 | 3 | 4,
      over: b.over,
      ballInOver: b.delivery,
      timestampIso: b.time,
      batterId: "unknown",  // TODO: SportRadar timeline doesn't include batter ID directly
      batterName: normaliseName(b.batsman_name ?? "unknown"),
      bowlerId: "unknown",
      bowlerName: normaliseName(b.bowler_name ?? "unknown"),
      runs: b.runs_scored,
      extras: b.runs_scored - b.runs_off_bat,
      extraType: b.extras_type as Ball["extraType"],
      isWicket: b.type === "wicket",
      isBoundary4: b.boundary?.boundary_type === "4",
      isBoundary6: b.boundary?.boundary_type === "6",
    }));

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
