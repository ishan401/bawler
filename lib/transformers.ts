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
} from "./types";

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
        batName: string; runs: number; balls: number;
        fours: number; sixes: number; strikeRate: number;
        outDesc: string; wicketCode: string;
      }>;
    };
    bowlTeamDetails: {
      bowlTeamName: string;
      bowlersData: Record<string, {
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

/**
 * Transform a Cricbuzz live match summary → internal Match (partial — no balls).
 * TODO: map seriesId → internal competition.id via a lookup table you maintain.
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
      playerId: b.batName,
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
      playerId: b.bowlName,
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

function transformESPNBall(raw: ESPNRawBall): Ball {
  return {
    id: raw.BallId,
    inningsNumber: 1,   // TODO: pass innings number from parent
    over: raw.Over,
    ballInOver: raw.BallNumber,
    timestampIso: new Date().toISOString(),   // ESPN doesn't provide per-ball timestamps
    batterId: String(raw.BatterId),
    batterName: raw.BatterName,
    bowlerId: String(raw.BowlerId),
    bowlerName: raw.BowlerName,
    runs: raw.Runs,
    extras: raw.Extras,
    isWicket: raw.IsWicket,
    isBoundary4: raw.IsBoundary4,
    isBoundary6: raw.IsBoundary6,
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
      batterName: "unknown",
      bowlerId: "unknown",
      bowlerName: "unknown",
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
