// ============================================================================
// Bawler — TypeScript types
// ============================================================================
// These mirror the shape we EXPECT from Roanuz Cricket API for v1.
// Any field marked with `// roanuz:` is documented from public Roanuz docs.
// Fields marked `// derived:` are computed by us, not from the API.
// Fields marked `// scraped:` come from Cricbuzz/ESPN/odds-market scrapers.
//
// When real Roanuz data arrives, we adjust this file and the
// `lib/adapters/roanuz.ts` adapter — components stay the same.
// ============================================================================

export type TeamCode = "MI" | "CSK" | "KKR" | "RCB" | "DC" | "SRH" | "PBKS" | "RR" | "LSG" | "GT";

export interface Team {
  code: TeamCode;
  shortName: string;
  fullName: string;
  primaryColor: string; // hex, used for chart lines + accents
  secondaryColor: string;
  currentRanking?: number; // 1..10 — league position
}

export interface Player {
  id: string;
  name: string;
  shortName: string; // e.g. "V Kohli"
  battingStyle?: "RHB" | "LHB";
  bowlingStyle?: string;
}

export interface Venue {
  id: string;
  name: string; // "Eden Gardens"
  city: string; // "Kolkata"
  // derived: from Cricsheet historical
  parScore?: number; // average first-innings total at this venue
  battingFirstWinPct?: number; // 0..1
}

export type MatchStatus = "upcoming" | "pre-match" | "toss" | "live" | "innings-break" | "post-match";

export interface Match {
  id: string;
  competition: "IPL";
  season: number;
  startTimeIso: string;
  status: MatchStatus;
  venue: Venue;
  teamA: Team; // batting first if toss decided
  teamB: Team;
  toss?: {
    winner: TeamCode;
    elected: "bat" | "bowl";
  };
  innings: Innings[];
  result?: {
    winner: TeamCode;
    margin: string; // "by 32 runs", "by 5 wickets"
    teamARuns?: number;
    teamAWickets?: number;
    teamBRuns?: number;
    teamBWickets?: number;
  };
  // 15-word recap for past matches ("…helps someone who watched quickly identify it")
  // or anticipation pitch for future matches ("…why this match promises to be a good watch")
  summary?: string;
  // 0..10 — drives the "highlighted" treatment on home page cards
  excitement?: number;
  // Optional badge label rendered on highlighted cards
  highlightBadge?: string;
  // For mock-only synthetic live matches — overrides the runtime status string + win prob
  liveStatusOverride?: string;
  liveWinProbOverride?: { teamCode: string; pct: number };
}

export interface Innings {
  number: 1 | 2;
  battingTeam: TeamCode;
  bowlingTeam: TeamCode;
  runs: number;
  wickets: number;
  overs: number; // 14.3 means 14 overs and 3 balls
  balls: Ball[]; // chronological
  battingCard: BattingEntry[];
  bowlingCard: BowlingEntry[];
  fieldingPositions?: FielderPosition[];
}

// Polar coordinates of a fielder, from batter's stance
// angle: 0..360 clockwise from 12 o'clock (straight down ground)
// distance: 0..1 (0 = at stumps, 1 = on boundary)
export interface FielderPosition {
  name: string;
  positionName: string; // "slip", "mid-off", "deep midwicket", etc.
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
// This is the unit that drives the ball-replay GIF (Pillar 3).
//
// Coordinate system for the GIF:
//   pitchX:  -1.0 (off-stump side) … 0.0 (middle) … +1.0 (leg-side)
//   pitchY:  0.0 (batter end) … 1.0 (bowler end) — i.e. distance up the pitch
//   shotAngle: 0..360 degrees, clockwise from straight (12 o'clock)
//             0 = straight down ground, 90 = point, 180 = behind keeper, 270 = fine leg
//   shotPower: 0..1 — distance reached relative to boundary
//   heightAtBounce: 0..1 — for shadow-offset animation in delivery phase
//   shotLoft: 0..1 — for dot-scale/glow animation in shot phase, also drives side-strip
// ============================================================================

export interface Ball {
  // identity
  id: string;
  inningsNumber: 1 | 2;
  over: number; // 14
  ballInOver: number; // 0..5 normally, 6+ if extras
  timestampIso: string;

  // who
  batterId: string;
  batterName: string;
  bowlerId: string;
  bowlerName: string;

  // outcome
  runs: number;
  extras: number;
  extraType?: "wd" | "nb" | "b" | "lb" | "pen";
  isWicket: boolean;
  dismissalType?: "bowled" | "caught" | "lbw" | "run-out" | "stumped" | "hit-wicket" | "retired";
  isBoundary4: boolean;
  isBoundary6: boolean;

  // coordinates — roanuz: from Ball Tracker product
  pitchX?: number; // -1..1
  pitchY?: number; // 0..1
  heightAtBounce?: number; // 0..1
  ballSpeedKmh?: number;

  shotAngle?: number; // 0..360 deg
  shotPower?: number; // 0..1
  shotLoft?: number; // 0..1 (max height during shot)
  shotType?: "drive" | "pull" | "cut" | "sweep" | "flick" | "defensive" | "left" | "edged";
  shotIsAerial?: boolean; // true if the ball went in the air

  // ---- Delivery descriptors — for the front-umpire-POV clip ----
  bowlingArm?: "left" | "right";
  bowlingFrom?: "over" | "round"; // over the wicket vs round the wicket
  bowlingLength?: "yorker" | "full" | "good" | "short" | "bouncer"; // length category
  bowlingLine?: "wide-off" | "outside-off" | "off" | "middle" | "leg" | "outside-leg" | "wide-leg";
  heightAtBatter?: number; // 0..1 (0 = ankle, 0.5 = waist, 1 = head height)
  ballVariation?: "stock" | "slower" | "yorker" | "bouncer" | "knuckle" | "off-cutter" | "leg-cutter" | "googly" | "carrom" | "doosra" | "topspinner";
  swingDirection?: "in" | "out" | "none"; // for seam bowling
  spinDirection?: "off" | "leg" | "none"; // for spin bowling
  pace?: "fast" | "medium-fast" | "medium" | "slow";

  // ---- Field reach — for the overhead-fielding clip ----
  ballReachedFielder?: string; // fielder position name who collected
  ballReachedBoundary?: boolean;

  // derived: from us
  winProbBeforeBall?: number; // 0..1 prob of team A winning
  winProbAfterBall?: number;
  winProbDelta?: number; // computed
  isInflectionPoint?: boolean; // |delta| > 0.05 OR isWicket OR over runs >= 12
  inflectionLabel?: string; // "Russell c. Bumrah, –12%"

  // scraped: one-liner commentary
  oneLiner?: string;
}

// ============================================================================
// Insight feed (Pillar 2)
// ============================================================================

export type InsightSourceTier = "analyst" | "cricbuzz" | "espn" | "bot" | "official";

export interface Insight {
  id: string;
  sourceTier: InsightSourceTier;
  sourceHandle: string; // "@mufaddal_vohra"
  sourceUrl?: string;
  text: string;
  timestampIso: string;
  relatedBallId?: string;
  relatedOver?: number;
  tags?: string[]; // ["wicket", "milestone", "venue-stat"]
}

// ============================================================================
// Win-prob chart (Pillar 1)
// ============================================================================

export interface WinProbPoint {
  overFloat: number; // 14.3 -> 14.5
  ballId: string;
  winProbTeamA: number; // 0..1
  isInflection: boolean;
  inflectionLabel?: string;
  inflectionKind?: "wicket" | "six" | "four-streak" | "big-over" | "quiet-over" | "milestone";
}

export interface ProjectedScore {
  runs: number;
  confidence: number; // 0..1
  perOver: number;
}

export interface PressureGauge {
  level: number; // 0..10
  trend: "rising" | "falling" | "steady";
}

// ============================================================================
// AI Metrics (front-page dashboard) — replaces the pressure/projected duo
// ============================================================================

export type MetricKind = "win-prob" | "projected" | "momentum" | "acceleration" | "key-player";

export interface AIMetric {
  kind: MetricKind;
  label: string;
  primaryValue: string; // big number
  secondaryValue?: string; // sub-line
  trend?: "up" | "down" | "flat";
  trendDelta?: string; // "+8% last 12 balls"
  tint?: "cyan" | "orange" | "boundary" | "six" | "wicket" | "neutral";
  expandable?: boolean; // true for win-prob (opens chart)
}

// ============================================================================
// Match Events — moments worth jumping to in the Moments strip,
//                also serve as zoom-aware annotations on the prob chart
// ============================================================================

export type EventKind =
  | "wicket"
  | "six"
  | "four"
  | "milestone"      // batter 50/100, partnership 100, etc.
  | "phase-shift"    // powerplay end, death overs start
  | "big-over"       // 12+ runs
  | "quiet-over"     // 3 or fewer runs in over
  | "momentum-swing" // win-prob shift >= 10%
  | "key-bowling-change";

export interface MatchEvent {
  id: string;
  kind: EventKind;
  ballId?: string;
  overFloat: number;
  label: string;      // "Russell c. Bumrah"
  context: string;    // "KKR -14%, target 21 still needed"
  importance: number; // 0..1 — higher = always shown even at zoomed-out view
}

// ============================================================================
// Insight categorization — stats (no attribution) vs opinions (attributed)
// ============================================================================

export type InsightCategory = "stat" | "opinion";

// Layered on top of the existing Insight interface, but new code can use this
export interface InsightV2 {
  id: string;
  category: InsightCategory;
  text: string;
  numericHighlights?: string[]; // ["188 m", "62%", "vs 8/10"]
  relatedBallId?: string;
  timestampIso: string;
  // Only set when category === "opinion"
  attribution?: {
    handle: string;
    sourceTier: InsightSourceTier;
  };
  tags?: string[];
}

// ============================================================================
// League standings — for the Table page
// ============================================================================

export interface StandingsRow {
  teamCode: TeamCode;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  netRunRate: number;
  points: number;
  qualified?: "playoff" | "eliminated" | null; // for badge
}

// ============================================================================
// Pitch report — for the Info tab
// ============================================================================

export interface PitchReport {
  venueId: string;
  surfaceType: "red-soil" | "black-soil" | "grass-heavy" | "dry" | "balanced";
  paceFriendly: number;   // 0..10
  spinFriendly: number;   // 0..10
  bounceConsistency: number; // 0..10 — lower = uneven, higher = even
  expectedFirstInningsScore: { low: number; mid: number; high: number };
  dewFactor?: "low" | "moderate" | "high";
  bullets: string[]; // 3-5 plain-language behavior hints
}
