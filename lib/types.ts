// ============================================================================
// Bawler — TypeScript types
// ============================================================================
// These mirror the shape we EXPECT from a cricket data API.
// Fields marked `// derived:` are computed by us, not from the API.
//
// v1.1 — widened from IPL-only to global cricket:
//   - TeamCode → string (was a fixed IPL union)
//   - competition → Competition object (was literal "IPL")
//   - Added MatchFormat, Competition
//   - Team extended with type, flagEmoji, country
//   - Innings.number extended to 1|2|3|4 for Tests
// ============================================================================

// Team code — no longer a closed union; any string (e.g. "MI", "IND", "SYD")
export type TeamCode = string;

export type MatchFormat = "T20" | "T20I" | "ODI" | "Test" | "Hundred";

export interface Competition {
  id: string;           // "ipl-2026", "icc-t20wc-2026", "ashes-2025-26"
  name: string;         // "IPL 2026", "ICC T20 World Cup 2026", "The Ashes 2025-26"
  shortName: string;    // "IPL", "T20 WC", "Ashes"
  type: "league" | "international" | "bilateral" | "domestic";
  format: MatchFormat;
  season?: string;      // "2026", "2025-26"
  logoColor?: string;   // hex for competition badge accent
  hasStandings: boolean; // true = league/tournament with group table; false = bilateral series
}

export interface Team {
  code: TeamCode;
  shortName: string;
  fullName: string;
  primaryColor: string;     // hex — chart lines + accents
  secondaryColor: string;
  currentRanking?: number;  // league position or ICC ranking
  type?: "national" | "franchise"; // national = country, franchise = league team
  flagEmoji?: string;       // "🇮🇳" — shown next to national team names
  country?: string;         // ISO 3-letter: "IND", "AUS" — for national teams
  squad?: string[];         // current squad — 11-15 player short-names
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  battingStyle?: "RHB" | "LHB";
  bowlingStyle?: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  country?: string;
  parScore?: number;
  battingFirstWinPct?: number;
}

export type MatchStatus = "upcoming" | "pre-match" | "toss" | "live" | "innings-break" | "post-match";

export interface Match {
  id: string;
  format: MatchFormat;
  competition: Competition;
  matchNumber?: string;     // "Match 32", "3rd Test", "Final"
  season?: number;
  startTimeIso: string;
  status: MatchStatus;
  venue: Venue;
  teamA: Team;
  teamB: Team;
  toss?: {
    winner: TeamCode;
    elected: "bat" | "bowl";
  };
  innings: Innings[];
  result?: {
    winner: TeamCode | "draw" | "tie" | "no-result";
    margin: string;
    teamARuns?: number;
    teamAWickets?: number;
    teamBRuns?: number;
    teamBWickets?: number;
    manOfMatch?: string;
    manOfTournament?: string;
  };
  summary?: string;
  excitement?: number;
  highlightBadge?: string;
  liveStatusOverride?: string;
  liveWinProbOverride?: { teamCode: string; pct: number }; // pct MUST be 0-1 (e.g. 0.72 = 72%). Never 0-100.
  phase?: string;          // "group" | "super-8" | "qualifier" | "semifinal" | "final"
  championship?: Competition; // overarching championship this match contributes to (e.g. WTC for Test matches)
  seriesStatus?: string;     // one-line bilateral series summary e.g. "IND lead 2-1 · 5-match T20I series"
}

export interface Innings {
  number: 1 | 2 | 3 | 4;   // 3 & 4 used in Test matches
  battingTeam: TeamCode;
  bowlingTeam: TeamCode;
  runs: number;
  wickets: number;
  overs: number;
  balls: Ball[];
  battingCard: BattingEntry[];
  bowlingCard: BowlingEntry[];
  fieldingPositions?: FielderPosition[];
  declared?: boolean;        // Test: batting team declared
  followOn?: boolean;        // Test: this innings is following on
}

export interface FielderPosition {
  name: string;
  positionName: string;
  angle: number;
  distance: number;
}

export interface BattingEntry {
  playerId: string;
  playerName: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  out: boolean;
  dismissal?: string;
  onStrike?: boolean;
}

export interface BowlingEntry {
  playerId: string;
  playerName: string;
  oversBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
}

// ============================================================================
// Ball — the heart of Bawler's data model
// ============================================================================

export interface Ball {
  id: string;
  inningsNumber: 1 | 2 | 3 | 4;
  over: number;
  ballInOver: number;
  timestampIso: string;

  batterId: string;
  batterName: string;
  bowlerId: string;
  bowlerName: string;

  runs: number;
  extras: number;
  extraType?: "wd" | "nb" | "b" | "lb" | "pen";
  isWicket: boolean;
  dismissalType?: "bowled" | "caught" | "lbw" | "run-out" | "stumped" | "hit-wicket" | "retired";
  isBoundary4: boolean;
  isBoundary6: boolean;

  pitchX?: number;
  pitchY?: number;
  heightAtBounce?: number;
  ballSpeedKmh?: number;

  shotAngle?: number;
  shotPower?: number;
  shotLoft?: number;
  shotType?: "drive" | "pull" | "cut" | "sweep" | "flick" | "defensive" | "left" | "edged";
  shotIsAerial?: boolean;

  bowlingArm?: "left" | "right";
  bowlingFrom?: "over" | "round";
  bowlingLength?: "yorker" | "full" | "good" | "short" | "bouncer";
  bowlingLine?: "wide-off" | "outside-off" | "off" | "middle" | "leg" | "outside-leg" | "wide-leg";
  heightAtBatter?: number;
  ballVariation?: "stock" | "slower" | "yorker" | "bouncer" | "knuckle" | "off-cutter" | "leg-cutter" | "googly" | "carrom" | "doosra" | "topspinner";
  swingDirection?: "in" | "out" | "none";
  spinDirection?: "off" | "leg" | "none";
  pace?: "fast" | "medium-fast" | "medium" | "slow";

  ballReachedFielder?: string;
  ballReachedBoundary?: boolean;

  winProbBeforeBall?: number;
  winProbAfterBall?: number;
  winProbDelta?: number;
  isInflectionPoint?: boolean;
  inflectionLabel?: string;

  oneLiner?: string;
  nextBatterName?: string;  // set on isWicket balls — the incoming batter
}

// ============================================================================
// Insight feed
// ============================================================================

export type InsightSourceTier = "analyst" | "cricbuzz" | "espn" | "bot" | "official";

export interface Insight {
  id: string;
  sourceTier: InsightSourceTier;
  sourceHandle: string;
  sourceUrl?: string;
  text: string;
  timestampIso: string;
  relatedBallId?: string;
  relatedOver?: number;
  tags?: string[];
}

export interface WinProbPoint {
  overFloat: number;
  ballId: string;
  winProbTeamA: number;
  isInflection: boolean;
  inflectionLabel?: string;
  inflectionKind?: "wicket" | "six" | "four-streak" | "big-over" | "quiet-over" | "milestone";
}

export interface ProjectedScore {
  runs: number;
  confidence: number;
  perOver: number;
}

export interface PressureGauge {
  level: number;
  trend: "rising" | "falling" | "steady";
}

// ============================================================================
// AI Metrics
// ============================================================================

export type MetricKind = "win-prob" | "projected" | "momentum" | "acceleration" | "key-player";

export interface AIMetric {
  kind: MetricKind;
  label: string;
  primaryValue: string;
  secondaryValue?: string;
  trend?: "up" | "down" | "flat";
  trendDelta?: string;
  tint?: "cyan" | "orange" | "boundary" | "six" | "wicket" | "neutral";
  expandable?: boolean;
}

// ============================================================================
// Match Events
// ============================================================================

export type EventKind =
  | "wicket"
  | "six"
  | "four"
  | "milestone"
  | "phase-shift"
  | "big-over"
  | "quiet-over"
  | "momentum-swing"
  | "key-bowling-change";

export interface MatchEvent {
  id: string;
  kind: EventKind;
  ballId?: string;
  overFloat: number;
  label: string;
  context: string;
  importance: number;
}

// ============================================================================
// Insight v2
// ============================================================================

export type InsightCategory = "stat" | "opinion";

export interface InsightV2 {
  id: string;
  category: InsightCategory;
  text: string;
  numericHighlights?: string[];
  relatedBallId?: string;
  timestampIso: string;
  attribution?: {
    handle: string;
    sourceTier: InsightSourceTier;
  };
  tags?: string[];
}

// ============================================================================
// League standings
// ============================================================================

export interface StandingsRow {
  teamCode: TeamCode;      // string — works for any team
  played: number;
  won: number;
  lost: number;
  drawn?: number;          // Test/bilateral series standings
  tied?: number;
  noResult: number;
  netRunRate?: number;     // T20/ODI leagues — absent in Test series standings
  points: number;
  pct?: number;            // Win % — used by some formats instead of points
  qualified?: "playoff" | "eliminated" | null;
}

// ============================================================================
// Competition standings — data-layer driven (replaces hardcoded STANDINGS_MAP)
// ============================================================================

export interface CompetitionStandings {
  competitionId: string;
  phase?: string;          // "group-a" | "super-8" | "playoff" — undefined = single phase
  phaseLabel?: string;     // Display label: "Group Stage", "Super 8", "Points Table"
  updatedAt: string;       // ISO — set from API; use new Date().toISOString() for mock data
  rows: StandingsRow[];
  showNrr: boolean;        // Show NRR column (T20/ODI leagues)
  showDrawn: boolean;      // Show Drawn column (Test/bilateral series standings)
  showPct?: boolean;       // Show PCT% column — WTC and some ODI leagues rank by win percentage
  qualifyingSpots: number; // Top N rows get the playoff/qualification marker
}

// ============================================================================
// Pitch report
// ============================================================================

export interface PitchReport {
  venueId: string;
  surfaceType: "red-soil" | "black-soil" | "grass-heavy" | "dry" | "balanced";
  paceFriendly: number;
  spinFriendly: number;
  bounceConsistency: number;
  expectedFirstInningsScore: { low: number; mid: number; high: number };
  dewFactor?: "low" | "moderate" | "high";
  bullets: string[];
}

// ============================================================================
// Player profiles
// ============================================================================

export interface FormatStats {
  matches: number;
  // Batting
  innings?: number;
  runs?: number;
  highScore?: string;            // "183*" (not-out marker included)
  battingAvg?: number;
  battingStrikeRate?: number;
  hundreds?: number;
  fifties?: number;
  // Bowling
  wickets?: number;
  bestBowling?: string;          // "7/56"
  bowlingAvg?: number;
  economy?: number;
  fiveWickets?: number;
}

export interface PlayerProfile {
  id: string;                    // canonical URL slug, e.g. "v-kohli"
  name: string;                  // "Virat Kohli"
  shortName: string;             // "V Kohli"
  dateOfBirth?: string;          // "1988-11-05"
  nationality: string;           // "India"
  teamCode?: string;             // national team code: "IND"
  franchiseCode?: string;        // league franchise: "RCB"
  role: "batsman" | "bowler" | "all-rounder" | "wicket-keeper";
  battingStyle?: "RHB" | "LHB";
  bowlingStyle?: string;         // "Right-arm fast-medium", "Leg break", etc.
  bio?: string;
  iccRankings?: {
    testBatting?: number;
    odiBatting?: number;
    t20iBatting?: number;
    testBowling?: number;
    odiBowling?: number;
    t20iBowling?: number;
    testAllrounder?: number;
    odiAllrounder?: number;
    t20iAllrounder?: number;
  };
  testStats?: FormatStats;
  odiStats?: FormatStats;
  t20iStats?: FormatStats;
  franchiseStats?: FormatStats;
  franchiseLeague?: string;  // "IPL" | "BBL" | "PSL" | "SA20" | "The Hundred" | "CPL" | "MLC" etc.
}

// ============================================================================
// Matchup stats — batter vs bowler career H2H
// ============================================================================

export interface MatchupDismissalType {
  type: string;   // "Caught" | "Bowled" | "LBW" | "Stumped" | "Run Out"
  count: number;
}

export interface MatchupStats {
  batterName: string;
  bowlerName: string;
  format: MatchFormat;
  ballsFaced: number;
  runsScored: number;
  timesOut: number;
  dotBalls: number;
  fours: number;
  sixes: number;
  dismissalTypes: MatchupDismissalType[];
  dangerDelivery?: string;   // e.g. "Full, seaming in, yorker length"
  lastDismissal?: string;    // e.g. "Caught Warner · Jan 2024"
  venueStat?: string;        // e.g. "Best: 47 at MCG · 2024"
}
