import type {
  Match,
  Team,
  Competition,
  Ball,
  Insight,
  Venue,
  Innings,
  BattingEntry,
  BowlingEntry,
  StandingsRow,
} from "./types";

// ============================================================================
// Teams
// ============================================================================

export const TEAMS: Record<string, Team> = {
  MI:   { code: "MI",   shortName: "MI",   fullName: "Mumbai Indians",            primaryColor: "#004BA0", secondaryColor: "#D1AB3E", currentRanking: 6 },
  CSK:  { code: "CSK",  shortName: "CSK",  fullName: "Chennai Super Kings",       primaryColor: "#FDB913", secondaryColor: "#005DB7", currentRanking: 3 },
  KKR:  { code: "KKR",  shortName: "KKR",  fullName: "Kolkata Knight Riders",     primaryColor: "#3A225D", secondaryColor: "#F2C72A", currentRanking: 4 },
  RCB:  { code: "RCB",  shortName: "RCB",  fullName: "Royal Challengers Bengaluru", primaryColor: "#DA1818", secondaryColor: "#000000", currentRanking: 5 },
  DC:   { code: "DC",   shortName: "DC",   fullName: "Delhi Capitals",            primaryColor: "#17449B", secondaryColor: "#EF1B23", currentRanking: 8 },
  SRH:  { code: "SRH",  shortName: "SRH",  fullName: "Sunrisers Hyderabad",       primaryColor: "#F7A721", secondaryColor: "#000000", currentRanking: 7 },
  PBKS: { code: "PBKS", shortName: "PBKS", fullName: "Punjab Kings",              primaryColor: "#DD1F2D", secondaryColor: "#A7A9AC", currentRanking: 9 },
  RR:   { code: "RR",   shortName: "RR",   fullName: "Rajasthan Royals",          primaryColor: "#EA1A85", secondaryColor: "#254AA5", currentRanking: 2 },
  LSG:  { code: "LSG",  shortName: "LSG",  fullName: "Lucknow Super Giants",      primaryColor: "#00A2D6", secondaryColor: "#FF7F00", currentRanking: 10 },
  GT:   { code: "GT",   shortName: "GT",   fullName: "Gujarat Titans",            primaryColor: "#4285F4", secondaryColor: "#1B2133", currentRanking: 1 },
};

// ── National teams (jersey / kit colors) ────────────────────────────────────
// ── National teams (jersey / kit colors, per actual uniforms) ───────────────
export const NATIONAL_TEAMS: Record<string, Team> = {
  // ICC Full Members — ranked
  IND: { code: "IND", shortName: "IND", fullName: "India",                primaryColor: "#005BAC", secondaryColor: "#F9A825", type: "national", flagEmoji: "🇮🇳", country: "IND", currentRanking: 1 },
  AUS: { code: "AUS", shortName: "AUS", fullName: "Australia",             primaryColor: "#FFB81C", secondaryColor: "#006B54", type: "national", flagEmoji: "🇦🇺", country: "AUS", currentRanking: 2 },
  SA:  { code: "SA",  shortName: "SA",  fullName: "South Africa",          primaryColor: "#007A4D", secondaryColor: "#FFB612", type: "national", flagEmoji: "🇿🇦", country: "RSA", currentRanking: 3 },
  ENG: { code: "ENG", shortName: "ENG", fullName: "England",               primaryColor: "#1D244E", secondaryColor: "#00A0C6", type: "national", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "ENG", currentRanking: 4 },
  NZ:  { code: "NZ",  shortName: "NZ",  fullName: "New Zealand",           primaryColor: "#000000", secondaryColor: "#A8A9AD", type: "national", flagEmoji: "🇳🇿", country: "NZL", currentRanking: 5 },
  PAK: { code: "PAK", shortName: "PAK", fullName: "Pakistan",              primaryColor: "#005C3F", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇵🇰", country: "PAK", currentRanking: 6 },
  BAN: { code: "BAN", shortName: "BAN", fullName: "Bangladesh",            primaryColor: "#1A6B3A", secondaryColor: "#CE1126", type: "national", flagEmoji: "🇧🇩", country: "BAN", currentRanking: 7 },
  SL:  { code: "SL",  shortName: "SL",  fullName: "Sri Lanka",             primaryColor: "#003087", secondaryColor: "#C8A951", type: "national", flagEmoji: "🇱🇰", country: "SL",  currentRanking: 8 },
  WI:  { code: "WI",  shortName: "WI",  fullName: "West Indies",           primaryColor: "#6E1436", secondaryColor: "#FFC726", type: "national", flagEmoji: "🌴", country: "WI",  currentRanking: 9 },
  AFG: { code: "AFG", shortName: "AFG", fullName: "Afghanistan",           primaryColor: "#1D71B8", secondaryColor: "#CC0000", type: "national", flagEmoji: "🇦🇫", country: "AFG", currentRanking: 10 },
  // Associates & emerging nations
  IRE: { code: "IRE", shortName: "IRE", fullName: "Ireland",               primaryColor: "#169B62", secondaryColor: "#003A70", type: "national", flagEmoji: "🇮🇪", country: "IRE" },
  ZIM: { code: "ZIM", shortName: "ZIM", fullName: "Zimbabwe",              primaryColor: "#D4212D", secondaryColor: "#009A44", type: "national", flagEmoji: "🇿🇼", country: "ZIM" },
  SCO: { code: "SCO", shortName: "SCO", fullName: "Scotland",              primaryColor: "#003DA5", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", country: "SCO" },
  NED: { code: "NED", shortName: "NED", fullName: "Netherlands",           primaryColor: "#F77F00", secondaryColor: "#003DA5", type: "national", flagEmoji: "🇳🇱", country: "NED" },
  USA: { code: "USA", shortName: "USA", fullName: "United States",         primaryColor: "#002868", secondaryColor: "#B22234", type: "national", flagEmoji: "🇺🇸", country: "USA" },
  UAE: { code: "UAE", shortName: "UAE", fullName: "United Arab Emirates",  primaryColor: "#CC0000", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇦🇪", country: "UAE" },
  NAM: { code: "NAM", shortName: "NAM", fullName: "Namibia",               primaryColor: "#003087", secondaryColor: "#FFD700", type: "national", flagEmoji: "🇳🇦", country: "NAM" },
  PNG: { code: "PNG", shortName: "PNG", fullName: "Papua New Guinea",      primaryColor: "#000000", secondaryColor: "#CE1126", type: "national", flagEmoji: "🇵🇬", country: "PNG" },
  OMA: { code: "OMA", shortName: "OMA", fullName: "Oman",                  primaryColor: "#8B0000", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇴🇲", country: "OMA" },
  CAN: { code: "CAN", shortName: "CAN", fullName: "Canada",                primaryColor: "#CC0000", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇨🇦", country: "CAN" },
  KEN: { code: "KEN", shortName: "KEN", fullName: "Kenya",                 primaryColor: "#006600", secondaryColor: "#CC0000", type: "national", flagEmoji: "🇰🇪", country: "KEN" },
  UGA: { code: "UGA", shortName: "UGA", fullName: "Uganda",                primaryColor: "#000000", secondaryColor: "#FCDC04", type: "national", flagEmoji: "🇺🇬", country: "UGA" },
};

// ── Franchise / league teams ────────────────────────────────────────────────
export const LEAGUE_TEAMS: Record<string, Team> = {
  // ── BBL (Big Bash League — Australia, 8 teams) ───────────────────────────
  SIXERS:    { code: "SIXERS",    shortName: "Sixers",    fullName: "Sydney Sixers",             primaryColor: "#FF1F8E", secondaryColor: "#1A1A1A", type: "franchise" },
  STARS:     { code: "STARS",     shortName: "Stars",     fullName: "Melbourne Stars",            primaryColor: "#00A650", secondaryColor: "#FFFFFF", type: "franchise" },
  HEAT:      { code: "HEAT",      shortName: "Heat",      fullName: "Brisbane Heat",              primaryColor: "#FF6600", secondaryColor: "#5B2D8E", type: "franchise" },
  SCORCHERS: { code: "SCORCHERS", shortName: "Scorchers", fullName: "Perth Scorchers",            primaryColor: "#F15A22", secondaryColor: "#003087", type: "franchise" },
  HURRICANES:{ code: "HURRICANES",shortName: "Canes",     fullName: "Hobart Hurricanes",          primaryColor: "#5C1FAB", secondaryColor: "#00BFFF", type: "franchise" },
  THUNDER:   { code: "THUNDER",   shortName: "Thunder",   fullName: "Sydney Thunder",             primaryColor: "#16A829", secondaryColor: "#FFDD00", type: "franchise" },
  RENE:      { code: "RENE",      shortName: "Renegades", fullName: "Melbourne Renegades",        primaryColor: "#C8102E", secondaryColor: "#1A1A1A", type: "franchise" },
  STR:       { code: "STR",       shortName: "Strikers",  fullName: "Adelaide Strikers",          primaryColor: "#003087", secondaryColor: "#FFB81C", type: "franchise" },
  // ── PSL (Pakistan Super League — 6 teams) ────────────────────────────────
  LAH:       { code: "LAH",       shortName: "Lahore",    fullName: "Lahore Qalandars",           primaryColor: "#00A651", secondaryColor: "#C8102E", type: "franchise" },
  KAR:       { code: "KAR",       shortName: "Karachi",   fullName: "Karachi Kings",              primaryColor: "#00AEEF", secondaryColor: "#FFD700", type: "franchise" },
  PES:       { code: "PES",       shortName: "Peshawar",  fullName: "Peshawar Zalmi",             primaryColor: "#F7A800", secondaryColor: "#C8102E", type: "franchise" },
  QUE:       { code: "QUE",       shortName: "Quetta",    fullName: "Quetta Gladiators",          primaryColor: "#2D2D8F", secondaryColor: "#FFD700", type: "franchise" },
  MUL:       { code: "MUL",       shortName: "Multan",    fullName: "Multan Sultans",             primaryColor: "#8B0000", secondaryColor: "#FFD700", type: "franchise" },
  ISL:       { code: "ISL",       shortName: "Islamabad", fullName: "Islamabad United",           primaryColor: "#C8102E", secondaryColor: "#004B87", type: "franchise" },
  // ── The Hundred (England, 8 teams) ───────────────────────────────────────
  OVI:       { code: "OVI",       shortName: "Oval",      fullName: "Oval Invincibles",           primaryColor: "#1A1A1A", secondaryColor: "#C9A84C", type: "franchise" },
  LSP:       { code: "LSP",       shortName: "London",    fullName: "London Spirit",              primaryColor: "#000000", secondaryColor: "#00B5A4", type: "franchise" },
  MOR:       { code: "MOR",       shortName: "Originals", fullName: "Manchester Originals",       primaryColor: "#CC0000", secondaryColor: "#FF4500", type: "franchise" },
  SBR:       { code: "SBR",       shortName: "S Brave",   fullName: "Southern Brave",             primaryColor: "#2E1760", secondaryColor: "#00BFFF", type: "franchise" },
  NSC:       { code: "NSC",       shortName: "N Super",   fullName: "Northern Superchargers",     primaryColor: "#FFD700", secondaryColor: "#1A1A1A", type: "franchise" },
  TRR:       { code: "TRR",       shortName: "Rockets",   fullName: "Trent Rockets",              primaryColor: "#CC0033", secondaryColor: "#FFFFFF", type: "franchise" },
  WEF:       { code: "WEF",       shortName: "W Fire",    fullName: "Welsh Fire",                 primaryColor: "#8B0000", secondaryColor: "#FFD700", type: "franchise" },
  BPH:       { code: "BPH",       shortName: "Phoenix",   fullName: "Birmingham Phoenix",         primaryColor: "#A0173A", secondaryColor: "#FFD700", type: "franchise" },
  // ── SA20 (South Africa, 6 teams) ─────────────────────────────────────────
  SEC:       { code: "SEC",       shortName: "Sunrisers", fullName: "Sunrisers Eastern Cape",     primaryColor: "#F7A800", secondaryColor: "#000000", type: "franchise" },
  MICT:      { code: "MICT",      shortName: "MI Cape",   fullName: "MI Cape Town",               primaryColor: "#004BA0", secondaryColor: "#D1AB3E", type: "franchise" },
  JSK:       { code: "JSK",       shortName: "Jo'burg",   fullName: "Joburg Super Kings",         primaryColor: "#FDB913", secondaryColor: "#005DB7", type: "franchise" },
  PREC:      { code: "PREC",      shortName: "Capitals",  fullName: "Pretoria Capitals",          primaryColor: "#002868", secondaryColor: "#00B5E2", type: "franchise" },
  PARR:      { code: "PARR",      shortName: "P Royals",  fullName: "Paarl Royals",               primaryColor: "#EA5B7C", secondaryColor: "#003087", type: "franchise" },
  DURGD:     { code: "DURGD",     shortName: "Durban",    fullName: "Durban's Super Giants",      primaryColor: "#00A0C6", secondaryColor: "#FF6600", type: "franchise" },
  // ── CPL (Caribbean Premier League, 6 teams) ──────────────────────────────
  TKR:       { code: "TKR",       shortName: "TKR",       fullName: "Trinbago Knight Riders",     primaryColor: "#3A225D", secondaryColor: "#F2C72A", type: "franchise" },
  BARB:      { code: "BARB",      shortName: "Royals",    fullName: "Barbados Royals",             primaryColor: "#EA1A85", secondaryColor: "#254AA5", type: "franchise" },
  GAW:       { code: "GAW",       shortName: "Warriors",  fullName: "Guyana Amazon Warriors",     primaryColor: "#1A7A1A", secondaryColor: "#FFD700", type: "franchise" },
  JAT:       { code: "JAT",       shortName: "Tallawahs", fullName: "Jamaica Tallawahs",          primaryColor: "#FFD700", secondaryColor: "#1A1A1A", type: "franchise" },
  SKP:       { code: "SKP",       shortName: "Patriots",  fullName: "St Kitts & Nevis Patriots",  primaryColor: "#006400", secondaryColor: "#FFD700", type: "franchise" },
  SLK:       { code: "SLK",       shortName: "St Lucia",  fullName: "St Lucia Kings",             primaryColor: "#003DA5", secondaryColor: "#FFD700", type: "franchise" },
  // ── MLC (Major League Cricket — USA, 6 teams) ────────────────────────────
  LAKR:      { code: "LAKR",      shortName: "LA KR",     fullName: "LA Knight Riders",           primaryColor: "#3A225D", secondaryColor: "#F2C72A", type: "franchise" },
  TSK:       { code: "TSK",       shortName: "Texas SK",  fullName: "Texas Super Kings",          primaryColor: "#FDB913", secondaryColor: "#005DB7", type: "franchise" },
  MINE:      { code: "MINE",      shortName: "MI NY",     fullName: "MI New York",                primaryColor: "#004BA0", secondaryColor: "#D1AB3E", type: "franchise" },
  SEAO:      { code: "SEAO",      shortName: "Orcas",     fullName: "Seattle Orcas",              primaryColor: "#008080", secondaryColor: "#002868", type: "franchise" },
  SFU:       { code: "SFU",       shortName: "Unicorns",  fullName: "San Francisco Unicorns",     primaryColor: "#FF6600", secondaryColor: "#6B2C91", type: "franchise" },
  WASF:      { code: "WASF",      shortName: "Freedom",   fullName: "Washington Freedom",         primaryColor: "#B22234", secondaryColor: "#002868", type: "franchise" },
};

export const ALL_TEAMS: Record<string, Team> = {
  ...TEAMS, ...NATIONAL_TEAMS, ...LEAGUE_TEAMS,
};

// ── Competitions registry ────────────────────────────────────────────────────
export const COMPETITIONS: Record<string, Competition> = {
  ipl2026:       { id: "ipl-2026",         name: "IPL 2026",                      shortName: "IPL",       type: "league",        format: "T20",  season: "2026",    logoColor: "#F7A800" },
  t20wc2026:     { id: "icc-t20wc-2026",   name: "ICC T20 World Cup 2026",        shortName: "T20 WC",    type: "international", format: "T20I", season: "2026",    logoColor: "#00A2D6" },
  ct2025:        { id: "icc-ct-2025",      name: "ICC Champions Trophy 2025",     shortName: "Champ. Tr.",type: "international", format: "ODI",  season: "2025",    logoColor: "#00A2D6" },
  ashes2526:     { id: "ashes-2025-26",    name: "The Ashes 2025-26",             shortName: "Ashes",     type: "bilateral",     format: "Test", season: "2025-26", logoColor: "#8B6914" },
  indEngTest2026:{ id: "ind-eng-test-2026",name: "India tour of England 2026",    shortName: "IND v ENG", type: "bilateral",     format: "Test", season: "2026",    logoColor: "#1565C0" },
  indAusT20i2026:{ id: "ind-aus-t20i-2026",name: "India tour of Australia 2026",  shortName: "IND v AUS", type: "bilateral",     format: "T20I", season: "2026",    logoColor: "#1565C0" },
  engSaOdi2026:  { id: "eng-sa-odi-2026",  name: "South Africa tour of England 2026", shortName: "ENG v SA", type: "bilateral", format: "ODI",  season: "2026",    logoColor: "#C8102E" },
  bbl2526:       { id: "bbl-2025-26",      name: "Big Bash League 2025-26",       shortName: "BBL",       type: "league",        format: "T20",  season: "2025-26", logoColor: "#00BFFF" },
  psl2026:       { id: "psl-2026",         name: "HBL PSL 2026",                  shortName: "PSL",       type: "league",        format: "T20",  season: "2026",    logoColor: "#00A651" },
  hundred2026:   { id: "hundred-2026",     name: "The Hundred 2026",              shortName: "Hundred",   type: "league",        format: "T20",  season: "2026",    logoColor: "#6B2C91" },
  sa202026:      { id: "sa20-2026",        name: "SA20 2026",                     shortName: "SA20",      type: "league",        format: "T20",  season: "2026",    logoColor: "#007A4D" },
  cpl2025:       { id: "cpl-2025",         name: "CPL 2025",                      shortName: "CPL",       type: "league",        format: "T20",  season: "2025",    logoColor: "#7B0041" },
  mlc2026:       { id: "mlc-2026",         name: "Major League Cricket 2026",     shortName: "MLC",       type: "league",        format: "T20",  season: "2026",    logoColor: "#B22234" },
};

// ============================================================================
// Venues
// ============================================================================

export const VENUES: Record<string, Venue> = {
  eden: {
    id: "eden",
    name: "Eden Gardens",
    city: "Kolkata",
    parScore: 171,
    battingFirstWinPct: 0.54,
  },
  wankhede: {
    id: "wankhede",
    name: "Wankhede Stadium",
    city: "Mumbai",
    parScore: 184,
    battingFirstWinPct: 0.49,
  },
  chinnaswamy: {
    id: "chinnaswamy",
    name: "M. Chinnaswamy Stadium",
    city: "Bengaluru",
    parScore: 192,
    battingFirstWinPct: 0.46,
  },
  chepauk: {
    id: "chepauk",
    name: "M. A. Chidambaram Stadium",
    city: "Chennai",
    parScore: 165,
    battingFirstWinPct: 0.58,
  },
  motera: {
    id: "motera",
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    parScore: 178,
    battingFirstWinPct: 0.52,
  },
};

// ============================================================================
// The featured live match — KKR chasing 175 vs MI at Eden Gardens
// We pre-script a chase that's getting tense — mid-innings, 2nd innings ball 14.3
// ============================================================================

const PLAYERS_KKR = [
  "S Iyer", "V Iyer", "R Singh", "A Russell", "S Narine", "S Roy",
  "J Bairstow", "N Rana", "P Cummins", "U Yadav", "V Chakravarthy",
];

const PLAYERS_MI = [
  "R Sharma", "I Kishan", "S Yadav", "T David", "H Pandya", "T Stubbs",
  "P Krishna", "J Bumrah", "G Coetzee", "K Yadav", "P Mishra",
];

function mkBall(
  inningsNumber: 1 | 2,
  over: number,
  ballInOver: number,
  batterName: string,
  bowlerName: string,
  runs: number,
  options: Partial<Ball> = {}
): Ball {
  const id = `${inningsNumber}-${over}.${ballInOver}`;
  // Plausible coordinates per outcome
  const pitchX = (Math.random() - 0.5) * 1.6;
  const pitchY = 0.6 + Math.random() * 0.3;
  const heightAtBounce = 0.3 + Math.random() * 0.4;
  const lengthBuckets: NonNullable<Ball["bowlingLength"]>[] = ["yorker", "full", "good", "good", "short", "bouncer"];
  const bowlingLength = lengthBuckets[Math.floor(Math.abs(pitchY - 0.5) * 8) % lengthBuckets.length];
  const heightAtBatter =
    bowlingLength === "yorker" ? 0.05 + Math.random() * 0.05
    : bowlingLength === "full" ? 0.1 + Math.random() * 0.2
    : bowlingLength === "good" ? 0.35 + Math.random() * 0.2
    : bowlingLength === "short" ? 0.55 + Math.random() * 0.2
    : 0.75 + Math.random() * 0.2;
  const linesAll: NonNullable<Ball["bowlingLine"]>[] = ["wide-off", "outside-off", "off", "middle", "leg", "outside-leg", "wide-leg"];
  const bowlingLine = linesAll[Math.max(0, Math.min(linesAll.length - 1, Math.round(pitchX * 3 + 3)))];

  // Bowler-driven attributes (rough mock — Bumrah pace, Mishra spin, etc.)
  const isSpinner = /(narine|chakravarthy|mishra|k yadav|kuldeep|ashwin)/i.test(bowlerName);
  const isFast = /(bumrah|cummins|krishna|coetzee|u yadav)/i.test(bowlerName);
  const pace: Ball["pace"] = isFast ? "fast" : isSpinner ? "slow" : "medium-fast";
  const ballSpeedKmh =
    pace === "fast" ? 138 + Math.floor(Math.random() * 12)
    : pace === "slow" ? 82 + Math.floor(Math.random() * 16)
    : 125 + Math.floor(Math.random() * 12);

  return {
    id,
    inningsNumber,
    over,
    ballInOver,
    timestampIso: new Date().toISOString(),
    batterId: batterName,
    batterName,
    bowlerId: bowlerName,
    bowlerName,
    runs,
    extras: 0,
    isWicket: false,
    isBoundary4: runs === 4,
    isBoundary6: runs === 6,
    // Coordinates for the GIF (clip 1 — delivery)
    pitchX,
    pitchY,
    heightAtBounce,
    ballSpeedKmh,
    bowlingArm: "right",
    bowlingFrom: "over",
    bowlingLength,
    bowlingLine,
    heightAtBatter,
    pace,
    swingDirection: isFast ? (Math.random() > 0.5 ? "in" : "out") : "none",
    spinDirection: isSpinner ? (Math.random() > 0.5 ? "off" : "leg") : "none",
    ballVariation: isSpinner && Math.random() > 0.8 ? "googly" : isFast && bowlingLength === "yorker" ? "yorker" : isFast && bowlingLength === "bouncer" ? "bouncer" : "stock",
    // Coordinates for the GIF (clip 2 — field)
    shotAngle: Math.random() * 360,
    shotPower: Math.random(),
    shotLoft: runs === 6 ? 0.85 + Math.random() * 0.1 : runs === 4 ? 0.15 + Math.random() * 0.2 : Math.random() * 0.25,
    shotIsAerial: runs === 6 || (runs === 4 && Math.random() > 0.5),
    shotType: runs === 0 ? "defensive" : runs === 6 ? "drive" : "drive",
    oneLiner: oneLinerFor(batterName, bowlerName, runs, options.isWicket),
    ...options,
  };
}

function oneLinerFor(batter: string, bowler: string, runs: number, isWicket?: boolean): string {
  if (isWicket) return `${bowler} to ${batter}, OUT! Big breakthrough for the bowling side.`;
  if (runs === 6) return `${bowler} to ${batter}, SIX! Cleared the boundary with ease.`;
  if (runs === 4) return `${bowler} to ${batter}, FOUR! Crisply timed through the gap.`;
  if (runs === 0) return `${bowler} to ${batter}, no run. Dot.`;
  return `${bowler} to ${batter}, ${runs} run${runs > 1 ? "s" : ""}.`;
}

// ============================================================================
// Build the first innings (MI batted, made 174/6)
// ============================================================================

function buildInnings1(): Innings {
  const balls: Ball[] = [];
  const events: Array<[number, number, string, string, number, Partial<Ball>?]> = [
    // Over 1
    [1, 0, "R Sharma", "P Cummins", 1],
    [1, 1, "I Kishan", "P Cummins", 0],
    [1, 2, "I Kishan", "P Cummins", 4],
    [1, 3, "I Kishan", "P Cummins", 1],
    [1, 4, "R Sharma", "P Cummins", 0],
    [1, 5, "R Sharma", "P Cummins", 2],
    // Over 2
    [2, 0, "I Kishan", "V Chakravarthy", 6],
    [2, 1, "I Kishan", "V Chakravarthy", 0],
    [2, 2, "I Kishan", "V Chakravarthy", 1],
    [2, 3, "R Sharma", "V Chakravarthy", 4],
    [2, 4, "R Sharma", "V Chakravarthy", 0],
    [2, 5, "R Sharma", "V Chakravarthy", 1],
    // Over 6 — Rohit out
    [5, 4, "R Sharma", "S Narine", 0, { isWicket: true, dismissalType: "lbw", oneLiner: "S Narine to R Sharma, OUT! LBW — trapped in front. Huge breakthrough." }],
  ];
  for (const [o, b, batter, bowler, r, opt] of events) {
    balls.push(mkBall(1, o, b, batter, bowler, r, opt ?? {}));
  }

  // Skip ahead — pretend a full innings happened, summarize the card
  const battingCard: BattingEntry[] = [
    { playerId: "R Sharma", playerName: "Rohit Sharma", runs: 12, ballsFaced: 11, fours: 1, sixes: 0, strikeRate: 109.09, out: true, dismissal: "lbw b Narine" },
    { playerId: "I Kishan", playerName: "Ishan Kishan", runs: 41, ballsFaced: 28, fours: 5, sixes: 2, strikeRate: 146.43, out: true, dismissal: "c & b Chakravarthy" },
    { playerId: "S Yadav", playerName: "Suryakumar Yadav", runs: 56, ballsFaced: 32, fours: 6, sixes: 2, strikeRate: 175.00, out: true, dismissal: "c Iyer b Cummins" },
    { playerId: "T David", playerName: "Tim David", runs: 28, ballsFaced: 14, fours: 2, sixes: 2, strikeRate: 200.00, out: true, dismissal: "c Russell b Cummins" },
    { playerId: "H Pandya", playerName: "Hardik Pandya", runs: 22, ballsFaced: 16, fours: 1, sixes: 1, strikeRate: 137.50, out: false },
    { playerId: "T Stubbs", playerName: "Tristan Stubbs", runs: 9, ballsFaced: 7, fours: 1, sixes: 0, strikeRate: 128.57, out: false },
  ];

  const bowlingCard: BowlingEntry[] = [
    { playerId: "P Cummins", playerName: "Pat Cummins", oversBowled: 4, maidens: 0, runsConceded: 32, wickets: 2, economy: 8.00 },
    { playerId: "V Chakravarthy", playerName: "V. Chakravarthy", oversBowled: 4, maidens: 0, runsConceded: 28, wickets: 1, economy: 7.00 },
    { playerId: "S Narine", playerName: "S. Narine", oversBowled: 4, maidens: 0, runsConceded: 24, wickets: 1, economy: 6.00 },
    { playerId: "A Russell", playerName: "A. Russell", oversBowled: 3, maidens: 0, runsConceded: 38, wickets: 0, economy: 12.67 },
    { playerId: "U Yadav", playerName: "U. Yadav", oversBowled: 4, maidens: 0, runsConceded: 41, wickets: 1, economy: 10.25 },
    { playerId: "N Rana", playerName: "N. Rana", oversBowled: 1, maidens: 0, runsConceded: 11, wickets: 0, economy: 11.00 },
  ];

  return {
    number: 1,
    battingTeam: "MI",
    bowlingTeam: "KKR",
    runs: 174,
    wickets: 6,
    overs: 20,
    balls,
    battingCard,
    bowlingCard,
    fieldingPositions: KKR_FIELDERS,
  };
}

// Standard T20 spread for KKR fielding (each angle from batter, clockwise from straight)
// Bowler + WK not in this list (they're implied by the pitch geometry)
const KKR_FIELDERS: import("./types").FielderPosition[] = [
  { name: "S Iyer", positionName: "1st slip", angle: 340, distance: 0.18 },
  { name: "V Iyer", positionName: "cover", angle: 290, distance: 0.5 },
  { name: "N Rana", positionName: "mid-off", angle: 200, distance: 0.45 },
  { name: "P Cummins", positionName: "mid-on", angle: 165, distance: 0.45 },
  { name: "A Russell", positionName: "midwicket", angle: 125, distance: 0.55 },
  { name: "U Yadav", positionName: "deep square", angle: 90, distance: 0.92 },
  { name: "V Chakravarthy", positionName: "fine leg", angle: 35, distance: 0.92 },
  { name: "S Narine", positionName: "third man", angle: 320, distance: 0.92 },
  { name: "S Roy", positionName: "deep cover", angle: 260, distance: 0.92 },
];

const MI_FIELDERS: import("./types").FielderPosition[] = [
  { name: "I Kishan", positionName: "slip", angle: 340, distance: 0.2 },
  { name: "T David", positionName: "point", angle: 270, distance: 0.5 },
  { name: "S Yadav", positionName: "cover", angle: 250, distance: 0.55 },
  { name: "T Stubbs", positionName: "mid-off", angle: 200, distance: 0.45 },
  { name: "H Pandya", positionName: "mid-on", angle: 160, distance: 0.5 },
  { name: "R Sharma", positionName: "midwicket", angle: 125, distance: 0.55 },
  { name: "G Coetzee", positionName: "deep square leg", angle: 90, distance: 0.92 },
  { name: "P Mishra", positionName: "fine leg", angle: 30, distance: 0.92 },
  { name: "K Yadav", positionName: "third man", angle: 325, distance: 0.92 },
];

// ============================================================================
// Build the second innings — KKR chasing 175, mid-innings, tense
// We script a vivid sequence so the live experience is interesting
// ============================================================================

function buildInnings2(): Innings {
  const balls: Ball[] = [];

  // Over 1 — Iyer + V Iyer
  [
    ["S Iyer", "J Bumrah", 0],
    ["S Iyer", "J Bumrah", 1],
    ["V Iyer", "J Bumrah", 4, { isBoundary4: true }],
    ["V Iyer", "J Bumrah", 0],
    ["V Iyer", "J Bumrah", 2],
    ["V Iyer", "J Bumrah", 0],
  ].forEach((e, i) => balls.push(mkBall(2, 1, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Over 2 — Krishna
  [
    ["S Iyer", "P Krishna", 4, { isBoundary4: true }],
    ["S Iyer", "P Krishna", 1],
    ["V Iyer", "P Krishna", 6, { isBoundary6: true, oneLiner: "P Krishna to V Iyer, SIX! Pulled flat over deep midwicket." }],
    ["V Iyer", "P Krishna", 0],
    ["V Iyer", "P Krishna", 1],
    ["S Iyer", "P Krishna", 4, { isBoundary4: true }],
  ].forEach((e, i) => balls.push(mkBall(2, 2, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Over 3 — Coetzee
  [
    ["S Iyer", "G Coetzee", 1],
    ["V Iyer", "G Coetzee", 0],
    ["V Iyer", "G Coetzee", 2],
    ["V Iyer", "G Coetzee", 1],
    ["S Iyer", "G Coetzee", 0],
    ["S Iyer", "G Coetzee", 4, { isBoundary4: true }],
  ].forEach((e, i) => balls.push(mkBall(2, 3, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Over 4 — Bumrah, S Iyer out
  [
    ["S Iyer", "J Bumrah", 1],
    ["V Iyer", "J Bumrah", 0],
    ["V Iyer", "J Bumrah", 2],
    ["V Iyer", "J Bumrah", 1],
    ["S Iyer", "J Bumrah", 0, { isWicket: true, dismissalType: "bowled", oneLiner: "J Bumrah to S Iyer, OUT! Bowled through the gate, big wicket!" }],
    ["R Singh", "J Bumrah", 0],
  ].forEach((e, i) => balls.push(mkBall(2, 4, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Overs 5–13: simulated with a reasonable distribution
  const filler: Array<[number, number, string, string, number, Partial<Ball>?]> = [
    // Over 5
    [5, 0, "V Iyer", "P Mishra", 1], [5, 1, "R Singh", "P Mishra", 0], [5, 2, "R Singh", "P Mishra", 4, { isBoundary4: true }],
    [5, 3, "R Singh", "P Mishra", 1], [5, 4, "V Iyer", "P Mishra", 6, { isBoundary6: true, oneLiner: "P Mishra to V Iyer, SIX! Slog-swept high over square leg." }], [5, 5, "V Iyer", "P Mishra", 1],
    // Over 6
    [6, 0, "R Singh", "K Yadav", 1], [6, 1, "V Iyer", "K Yadav", 0], [6, 2, "V Iyer", "K Yadav", 2],
    [6, 3, "V Iyer", "K Yadav", 1], [6, 4, "R Singh", "K Yadav", 0], [6, 5, "R Singh", "K Yadav", 4, { isBoundary4: true }],
    // Over 7 — V Iyer out
    [7, 0, "V Iyer", "H Pandya", 1], [7, 1, "R Singh", "H Pandya", 2], [7, 2, "R Singh", "H Pandya", 0],
    [7, 3, "R Singh", "H Pandya", 1], [7, 4, "V Iyer", "H Pandya", 0, { isWicket: true, dismissalType: "caught", oneLiner: "H Pandya to V Iyer, OUT! Caught at long on, KKR in trouble." }], [7, 5, "A Russell", "H Pandya", 4, { isBoundary4: true }],
    // Over 8
    [8, 0, "R Singh", "P Krishna", 0], [8, 1, "R Singh", "P Krishna", 1], [8, 2, "A Russell", "P Krishna", 6, { isBoundary6: true, oneLiner: "P Krishna to A Russell, SIX! Massive, into the second tier." }],
    [8, 3, "A Russell", "P Krishna", 1], [8, 4, "R Singh", "P Krishna", 0], [8, 5, "R Singh", "P Krishna", 4, { isBoundary4: true }],
    // Over 9
    [9, 0, "A Russell", "P Mishra", 6, { isBoundary6: true, oneLiner: "P Mishra to A Russell, SIX! Down the ground." }], [9, 1, "A Russell", "P Mishra", 1], [9, 2, "R Singh", "P Mishra", 2],
    [9, 3, "R Singh", "P Mishra", 1], [9, 4, "A Russell", "P Mishra", 0], [9, 5, "A Russell", "P Mishra", 4, { isBoundary4: true }],
    // Over 10
    [10, 0, "R Singh", "K Yadav", 1], [10, 1, "A Russell", "K Yadav", 0], [10, 2, "A Russell", "K Yadav", 4, { isBoundary4: true }],
    [10, 3, "A Russell", "K Yadav", 1], [10, 4, "R Singh", "K Yadav", 2], [10, 5, "R Singh", "K Yadav", 1],
    // Over 11
    [11, 0, "A Russell", "J Bumrah", 1], [11, 1, "R Singh", "J Bumrah", 0], [11, 2, "R Singh", "J Bumrah", 1],
    [11, 3, "A Russell", "J Bumrah", 0], [11, 4, "A Russell", "J Bumrah", 4, { isBoundary4: true }], [11, 5, "A Russell", "J Bumrah", 1],
    // Over 12
    [12, 0, "R Singh", "G Coetzee", 6, { isBoundary6: true, oneLiner: "G Coetzee to R Singh, SIX! Pulled over fine leg." }], [12, 1, "R Singh", "G Coetzee", 1], [12, 2, "A Russell", "G Coetzee", 0],
    [12, 3, "A Russell", "G Coetzee", 1], [12, 4, "R Singh", "G Coetzee", 4, { isBoundary4: true }], [12, 5, "R Singh", "G Coetzee", 2],
    // Over 13
    [13, 0, "A Russell", "H Pandya", 1], [13, 1, "R Singh", "H Pandya", 0], [13, 2, "R Singh", "H Pandya", 2],
    [13, 3, "R Singh", "H Pandya", 1], [13, 4, "A Russell", "H Pandya", 1], [13, 5, "R Singh", "H Pandya", 0],
    // Over 14 — Russell c. Bumrah at over 14.3 (the famous moment we'll annotate)
    [14, 0, "A Russell", "J Bumrah", 1],
    [14, 1, "R Singh", "J Bumrah", 4, { isBoundary4: true }],
    [14, 2, "R Singh", "J Bumrah", 0],
    [14, 3, "A Russell", "J Bumrah", 0, { isWicket: true, dismissalType: "caught", oneLiner: "J Bumrah to A Russell, OUT! Caught at deep midwicket. Huge breakthrough for MI." }],
  ];
  filler.forEach(([o, b, batter, bowler, r, opt]) => balls.push(mkBall(2, o, b, batter as string, bowler as string, r, opt ?? {})));

  // Calculate current totals
  let runs = 0;
  let wickets = 0;
  balls.forEach(b => {
    runs += b.runs + b.extras;
    if (b.isWicket) wickets++;
  });
  const lastBall = balls[balls.length - 1];
  const overs = lastBall.over - 1 + (lastBall.ballInOver + 1) / 6;

  const battingCard: BattingEntry[] = [
    { playerId: "S Iyer", playerName: "Shreyas Iyer", runs: 14, ballsFaced: 13, fours: 2, sixes: 0, strikeRate: 107.69, out: true, dismissal: "b Bumrah" },
    { playerId: "V Iyer", playerName: "Venkatesh Iyer", runs: 26, ballsFaced: 18, fours: 1, sixes: 2, strikeRate: 144.44, out: true, dismissal: "c long-on b Pandya" },
    { playerId: "R Singh", playerName: "Rinku Singh", runs: 38, ballsFaced: 24, fours: 4, sixes: 1, strikeRate: 158.33, out: false, onStrike: true },
    { playerId: "A Russell", playerName: "Andre Russell", runs: 32, ballsFaced: 18, fours: 3, sixes: 2, strikeRate: 177.78, out: true, dismissal: "c Stubbs b Bumrah" },
    { playerId: "S Narine", playerName: "Sunil Narine", runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, out: false, onStrike: true },
  ];

  const bowlingCard: BowlingEntry[] = [
    { playerId: "J Bumrah", playerName: "Jasprit Bumrah", oversBowled: 3, maidens: 0, runsConceded: 18, wickets: 2, economy: 6.00 },
    { playerId: "P Krishna", playerName: "P. Krishna", oversBowled: 2, maidens: 0, runsConceded: 28, wickets: 0, economy: 14.00 },
    { playerId: "G Coetzee", playerName: "G. Coetzee", oversBowled: 2, maidens: 0, runsConceded: 16, wickets: 0, economy: 8.00 },
    { playerId: "P Mishra", playerName: "P. Mishra", oversBowled: 2, maidens: 0, runsConceded: 19, wickets: 0, economy: 9.50 },
    { playerId: "K Yadav", playerName: "K. Yadav", oversBowled: 2, maidens: 0, runsConceded: 8, wickets: 0, economy: 4.00 },
    { playerId: "H Pandya", playerName: "Hardik Pandya", oversBowled: 2, maidens: 0, runsConceded: 9, wickets: 1, economy: 4.50 },
  ];

  return {
    number: 2,
    battingTeam: "KKR",
    bowlingTeam: "MI",
    runs,
    wickets,
    overs: Math.round(overs * 10) / 10,
    balls,
    battingCard,
    bowlingCard,
    fieldingPositions: MI_FIELDERS,
  };
}

// ============================================================================
// The featured live match
// ============================================================================

export const FEATURED_MATCH: Match = {
  id: "ipl2026-m37-kkrvmi",
  competition: COMPETITIONS.ipl2026,
  format: "T20",
  startTimeIso: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  status: "live",
  venue: VENUES.eden,
  teamA: TEAMS.MI, // batting first
  teamB: TEAMS.KKR, // chasing
  toss: { winner: "MI", elected: "bat" },
  innings: [buildInnings1(), buildInnings2()],
  result: { winner: "KKR", margin: "by 4 wickets", teamARuns: 174, teamAWickets: 9, teamBRuns: 175, teamBWickets: 6, manOfMatch: "Andre Russell", manOfTournament: "Virat Kohli" },
};

// ============================================================================
// Other matches for the home page list (last 1 completed + next 5 upcoming)
// ============================================================================

function hourFromNow(h: number): string {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}

// ============================================================================
// Past matches — last ~7 days of results, with summaries + excitement scores
// ============================================================================

export const PAST_MATCHES: Match[] = [
  {
    id: "ipl2026-m36-cskvrcb",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-22),
    status: "post-match",
    venue: VENUES.chinnaswamy,
    teamA: TEAMS.RCB,
    teamB: TEAMS.CSK,
    toss: { winner: "CSK", elected: "bowl" },
    innings: [],
    result: { winner: "CSK", margin: "by 4 wickets", teamARuns: 182, teamAWickets: 7, teamBRuns: 183, teamBWickets: 6 },
    summary: "Jadeja 47* off 24 — boundary count flipped in 19th over.",
    excitement: 9,
    highlightBadge: "Instant classic",
  },
  {
    id: "ipl2026-m35-givsmi",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-46),
    status: "post-match",
    venue: VENUES.motera,
    teamA: TEAMS.GT,
    teamB: TEAMS.MI,
    toss: { winner: "MI", elected: "bowl" },
    innings: [],
    result: { winner: "GT", margin: "by 3 runs", teamARuns: 205, teamAWickets: 4, teamBRuns: 202, teamBWickets: 8 },
    summary: "Bumrah hat-trick over saved 206 vs Surya's 78.",
    excitement: 10,
    highlightBadge: "Last-over thriller",
  },
  {
    id: "ipl2026-m34-lsgvpbks",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-70),
    status: "post-match",
    venue: VENUES.wankhede,
    teamA: TEAMS.LSG,
    teamB: TEAMS.PBKS,
    innings: [],
    result: { winner: "PBKS", margin: "by 38 runs", teamARuns: 167, teamAWickets: 10, teamBRuns: 205, teamBWickets: 6 },
    summary: "Iyer 75 + Arshdeep 4-fer overwhelmed LSG.",
    excitement: 5,
  },
  {
    id: "ipl2026-m33-kkrvrr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-94),
    status: "post-match",
    venue: VENUES.eden,
    teamA: TEAMS.KKR,
    teamB: TEAMS.RR,
    innings: [],
    result: { winner: "KKR", margin: "by 7 wickets", teamARuns: 154, teamAWickets: 8, teamBRuns: 155, teamBWickets: 3 },
    summary: "Narine 4/22 on a turning Eden — RR all out 154.",
    excitement: 6,
  },
  {
    id: "ipl2026-m32-dcvsrh",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-118),
    status: "post-match",
    venue: VENUES.chepauk,
    teamA: TEAMS.DC,
    teamB: TEAMS.SRH,
    innings: [],
    result: { winner: "SRH", margin: "by 6 wickets", teamARuns: 134, teamAWickets: 9, teamBRuns: 135, teamBWickets: 4 },
    summary: "Bowlers' day at Chepauk — neither side topped 7 RPO.",
    excitement: 4,
  },
  {
    id: "ipl2026-m31-rrvkkr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-142),
    status: "post-match",
    venue: VENUES.eden,
    teamA: TEAMS.RR,
    teamB: TEAMS.KKR,
    innings: [],
    result: { winner: "RR", margin: "by 25 runs", teamARuns: 198, teamAWickets: 5, teamBRuns: 173, teamBWickets: 10 },
    summary: "Buttler 92(48) set a total KKR couldn't pace.",
    excitement: 7,
  },
  {
    id: "ipl2026-m30-mivcsk",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-166),
    status: "post-match",
    venue: VENUES.wankhede,
    teamA: TEAMS.MI,
    teamB: TEAMS.CSK,
    innings: [],
    result: { winner: "MI", margin: "by 14 runs", teamARuns: 217, teamAWickets: 6, teamBRuns: 203, teamBWickets: 9 },
    summary: "Surya 102*, Hardik 4-fer — MI win the Clásico.",
    excitement: 9,
    highlightBadge: "Marquee win",
  },
];

// ============================================================================
// Upcoming matches — next ~7 days, with anticipation summaries
// ============================================================================

export const UPCOMING_MATCHES: Match[] = [
  {
    id: "ipl2026-m38-rrvgt",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(20),
    status: "upcoming",
    venue: VENUES.motera,
    teamA: TEAMS.RR,
    teamB: TEAMS.GT,
    innings: [],
    summary: "Top-two clash · playoff bye on the line. Buttler vs Bumrah is the duel of the season.",
    excitement: 10,
    highlightBadge: "Top of table",
  },
  {
    id: "ipl2026-m39-pbksvlsg",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(44),
    status: "upcoming",
    venue: VENUES.wankhede,
    teamA: TEAMS.PBKS,
    teamB: TEAMS.LSG,
    innings: [],
    summary: "Wooden-spoon scrap. Both sides need a miracle to make the playoffs.",
    excitement: 4,
  },
  {
    id: "ipl2026-m40-mivsrh",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(68),
    status: "upcoming",
    venue: VENUES.wankhede,
    teamA: TEAMS.MI,
    teamB: TEAMS.SRH,
    innings: [],
    summary: "Bumrah vs Cummins. 145+ kph express on a Wankhede pitch made for pace.",
    excitement: 8,
    highlightBadge: "Pace battle",
  },
  {
    id: "ipl2026-m41-cskvkkr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(92),
    status: "upcoming",
    venue: VENUES.chepauk,
    teamA: TEAMS.CSK,
    teamB: TEAMS.KKR,
    innings: [],
    summary: "Two-time champs collide on a turning Chepauk. Spinners decide it.",
    excitement: 8,
    highlightBadge: "Rivalry",
  },
  {
    id: "ipl2026-m42-rcbvdc",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(116),
    status: "upcoming",
    venue: VENUES.chinnaswamy,
    teamA: TEAMS.RCB,
    teamB: TEAMS.DC,
    innings: [],
    summary: "Kohli needs 41 for IPL's first 9000-run milestone.",
    excitement: 9,
    highlightBadge: "Milestone watch",
  },
  {
    id: "ipl2026-m43-gtvsrh",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(140),
    status: "upcoming",
    venue: VENUES.motera,
    teamA: TEAMS.GT,
    teamB: TEAMS.SRH,
    innings: [],
    summary: "GT one win from No.1 finish. SRH still mathematically in.",
    excitement: 6,
  },
];

// Backward-compat alias
export const RECENT_MATCH = PAST_MATCHES[0];

// ============================================================================
// Live matches — Sarthak v0.7: home carousel needs MULTIPLE live matches.
// FEATURED_MATCH has full ball-by-ball; the others have minimal scoring data
// and override status + win-prob (they exist for the carousel visual).
// ============================================================================

// ============================================================================
// League standings — IPL 2026 mid-tournament
// ============================================================================

export const STANDINGS: StandingsRow[] = [
  { teamCode: "GT",   played: 12, won: 9, lost: 3, noResult: 0, netRunRate: +1.45, points: 18, qualified: "playoff" },
  { teamCode: "RR",   played: 12, won: 8, lost: 4, noResult: 0, netRunRate: +0.98, points: 16, qualified: "playoff" },
  { teamCode: "CSK",  played: 12, won: 7, lost: 5, noResult: 0, netRunRate: +0.32, points: 14 },
  { teamCode: "KKR",  played: 12, won: 7, lost: 5, noResult: 0, netRunRate: +0.18, points: 14 },
  { teamCode: "RCB",  played: 12, won: 6, lost: 6, noResult: 0, netRunRate: +0.05, points: 12 },
  { teamCode: "MI",   played: 12, won: 5, lost: 7, noResult: 0, netRunRate: -0.04, points: 10 },
  { teamCode: "SRH",  played: 12, won: 5, lost: 7, noResult: 0, netRunRate: -0.28, points: 10 },
  { teamCode: "DC",   played: 12, won: 4, lost: 8, noResult: 0, netRunRate: -0.45, points:  8, qualified: "eliminated" },
  { teamCode: "PBKS", played: 12, won: 3, lost: 9, noResult: 0, netRunRate: -0.91, points:  6, qualified: "eliminated" },
  { teamCode: "LSG",  played: 12, won: 2, lost:10, noResult: 0, netRunRate: -1.12, points:  4, qualified: "eliminated" },
];

export const LIVE_MATCHES: Match[] = [
  FEATURED_MATCH,
  {
    id: "ipl2026-l2-rcbvcsk",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    status: "live",
    venue: VENUES.chinnaswamy,
    teamA: TEAMS.RCB,
    teamB: TEAMS.CSK,
    toss: { winner: "CSK", elected: "bowl" },
    innings: [
      {
        number: 1,
        battingTeam: "RCB",
        bowlingTeam: "CSK",
        runs: 148,
        wickets: 5,
        overs: 16.4,
        balls: [],
        battingCard: [],
        bowlingCard: [],
      },
    ],
    liveStatusOverride: "RCB 148/5 in 16.4 · on pace for 178",
    liveWinProbOverride: { teamCode: "CSK", pct: 0.56 },
  },
  {
    id: "ipl2026-l3-gtvrr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: "live",
    venue: VENUES.motera,
    teamA: TEAMS.GT,
    teamB: TEAMS.RR,
    toss: { winner: "GT", elected: "bat" },
    innings: [
      {
        number: 1,
        battingTeam: "GT",
        bowlingTeam: "RR",
        runs: 92,
        wickets: 2,
        overs: 8.2,
        balls: [],
        battingCard: [],
        bowlingCard: [],
      },
    ],
    liveStatusOverride: "GT cruising at 11.2 RPO in the powerplay",
    liveWinProbOverride: { teamCode: "GT", pct: 0.72 },
  },
];

// ============================================================================
// Mock insight feed — scraped-from-Twitter/Cricbuzz feel
// ============================================================================

// ============================================================================
// V2 insights — number-driven, stats vs opinions separated
// ============================================================================

import type { InsightV2, PitchReport } from "./types";

export const MOCK_INSIGHTS_V2: InsightV2[] = [
  {
    id: "v2-1",
    category: "stat",
    text: "Russell's strike rate of 177.8 is the highest by any KKR finisher this season; he fell after facing 18 balls.",
    numericHighlights: ["177.8", "18 balls"],
    relatedBallId: "2-14.3",
    timestampIso: new Date(Date.now() - 30 * 1000).toISOString(),
    tags: ["death-overs", "fallen"],
  },
  {
    id: "v2-2",
    category: "stat",
    text: "Bumrah figures: 2/18 in 3 overs · economy 6.0 · 0 boundaries in his last 12 balls.",
    numericHighlights: ["2/18", "3", "6.0", "0", "12 balls"],
    relatedBallId: "2-14.3",
    timestampIso: new Date(Date.now() - 45 * 1000).toISOString(),
    tags: ["bowling-spell"],
  },
  {
    id: "v2-3",
    category: "stat",
    text: "KKR have lost 4 of last 5 fixtures at Eden Gardens when chasing 170+.",
    numericHighlights: ["4 of last 5", "170+"],
    timestampIso: new Date(Date.now() - 90 * 1000).toISOString(),
    tags: ["venue-stat"],
  },
  {
    id: "v2-4",
    category: "stat",
    text: "Rinku Singh vs pace in death overs this IPL: SR 138 · vs spin: 192. MI bowling 5 of next 6 pace.",
    numericHighlights: ["138", "192", "5 of next 6"],
    timestampIso: new Date(Date.now() - 120 * 1000).toISOString(),
    tags: ["matchup"],
  },
  {
    id: "v2-5",
    category: "stat",
    text: "Suryakumar 56(32) — his 12th 50+ score at Eden Gardens, most by any visiting batter.",
    numericHighlights: ["56(32)", "12th"],
    timestampIso: new Date(Date.now() - 180 * 1000).toISOString(),
    tags: ["milestone"],
  },
  {
    id: "v2-6",
    category: "stat",
    text: "Required RPO: 12.55. KKR have chased 12+ RPO in death only 1 of 9 attempts this season.",
    numericHighlights: ["12.55", "1 of 9"],
    timestampIso: new Date(Date.now() - 15 * 1000).toISOString(),
    tags: ["required-rate"],
  },
  {
    id: "v2-7",
    category: "opinion",
    text: "Bumrah's pattern of returning to remove the set finisher is paying off — third such dismissal in 5 matches.",
    attribution: { handle: "@hypocaust", sourceTier: "analyst" },
    timestampIso: new Date(Date.now() - 60 * 1000).toISOString(),
    tags: ["analysis"],
  },
  {
    id: "v2-8",
    category: "opinion",
    text: "Eden Gardens dew should start kicking in around over 16 — KKR's lower order needs to survive till then.",
    attribution: { handle: "@JatinSapru", sourceTier: "analyst" },
    timestampIso: new Date(Date.now() - 200 * 1000).toISOString(),
    tags: ["conditions"],
  },
];

// ============================================================================
// Pitch reports per venue — for the Info tab
// ============================================================================

export const PITCH_REPORTS: Record<string, PitchReport> = {
  eden: {
    venueId: "eden",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 155, mid: 171, high: 188 },
    dewFactor: "high",
    bullets: [
      "True bounce in the first 8 overs — pace bowlers find swing under the lights early on.",
      "Square turn emerges around overs 10–14 if the pitch hasn't been rolled; spinners can grip.",
      "Dew arrives from over 14 onward in night matches, making the ball skid on. Chasing gets easier.",
      "Boundaries on the leg side are slightly shorter than the off — favours the pull shot.",
      "Bat-first wins ~54% historically; the dew penalty for batting second is real but not decisive.",
    ],
  },
  wankhede: {
    venueId: "wankhede",
    surfaceType: "red-soil",
    paceFriendly: 7,
    spinFriendly: 4,
    bounceConsistency: 8,
    expectedFirstInningsScore: { low: 170, mid: 184, high: 205 },
    dewFactor: "moderate",
    bullets: [
      "Red-soil surface offers consistent bounce — front-foot drives flow.",
      "Sea-breeze swing early; bowlers who can hit the seam at 140+ km/h get rewards.",
      "Short straight boundaries (~62m) make miss-hit sixes possible.",
      "Spinners struggle unless they can land the cross-seam; expect ~7+ RPO against spin.",
      "Highest IPL score (~235) was made here — par moves with the wind direction.",
    ],
  },
  chinnaswamy: {
    venueId: "chinnaswamy",
    surfaceType: "balanced",
    paceFriendly: 5,
    spinFriendly: 5,
    bounceConsistency: 6,
    expectedFirstInningsScore: { low: 180, mid: 192, high: 215 },
    bullets: [
      "Shortest boundaries on the IPL circuit — straight is just ~60m.",
      "Altitude (920m) means the ball carries further; sixes are 8-10% longer than at sea level.",
      "Dew effect is moderate; toss winners often choose to chase.",
      "Wrist-spinners enjoy slightly more turn here than seamers do swing.",
    ],
  },
  chepauk: {
    venueId: "chepauk",
    surfaceType: "dry",
    paceFriendly: 4,
    spinFriendly: 8,
    bounceConsistency: 5,
    expectedFirstInningsScore: { low: 145, mid: 165, high: 180 },
    bullets: [
      "Black-soil surface that holds together but grips for spin from over 1.",
      "Two-paced bounce in the second innings — sweeps risky after over 12.",
      "Pace off the ball is the bowling equalizer — cutters and slower bouncers thrive.",
      "Bat-first heavily favoured (58%); chasing here demands a fast start.",
    ],
  },
  motera: {
    venueId: "motera",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 165, mid: 178, high: 195 },
    bullets: [
      "Largest stadium in the world by capacity; straight boundaries are 80m+.",
      "Even bounce, slight movement under lights for the first 6 overs.",
      "Spinners get drift more than turn; settled batters can dominate over 8-15.",
      "Dew is rare here — toss decisions are usually condition-driven, not dew-driven.",
    ],
  },
};

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: "ins-1",
    sourceTier: "analyst",
    sourceHandle: "@mufaddal_vohra",
    text: "Andre Russell's dismissal — only the 3rd time this season a KKR finisher has fallen with 30+ runs needed off final 6 overs.",
    timestampIso: new Date(Date.now() - 30 * 1000).toISOString(),
    relatedBallId: "2-14.3",
    tags: ["wicket", "milestone"],
  },
  {
    id: "ins-2",
    sourceTier: "cricbuzz",
    sourceHandle: "Cricbuzz",
    text: "Bumrah now has 2/18 in 3 overs. He's been brought back specifically for the Russell over.",
    timestampIso: new Date(Date.now() - 45 * 1000).toISOString(),
    relatedBallId: "2-14.3",
    tags: ["bowling-spell"],
  },
  {
    id: "ins-3",
    sourceTier: "analyst",
    sourceHandle: "@CricCrazyJohns",
    text: "KKR have now lost the equivalent fixture at Eden Gardens in 4 of last 5 seasons when chasing 170+.",
    timestampIso: new Date(Date.now() - 90 * 1000).toISOString(),
    tags: ["venue-stat"],
  },
  {
    id: "ins-4",
    sourceTier: "analyst",
    sourceHandle: "@IPLT20stats",
    text: "Rinku Singh strike rate vs spin in death overs this IPL: 192. Vs pace: 138. MI need to keep him on pace.",
    timestampIso: new Date(Date.now() - 120 * 1000).toISOString(),
    tags: ["matchup", "death-overs"],
  },
  {
    id: "ins-5",
    sourceTier: "espn",
    sourceHandle: "ESPNcricinfo",
    text: "Suryakumar Yadav top-scored with 56(32). His 12th 50+ score at Eden Gardens — most by any visiting batter.",
    timestampIso: new Date(Date.now() - 180 * 1000).toISOString(),
    tags: ["milestone", "venue-record"],
  },
  {
    id: "ins-6",
    sourceTier: "analyst",
    sourceHandle: "@StatNoise",
    text: "Required run rate now 12.55. KKR have chased 12+ RPO in death only once this season.",
    timestampIso: new Date(Date.now() - 15 * 1000).toISOString(),
    tags: ["required-rate", "death-overs"],
  },
  {
    id: "ins-7",
    sourceTier: "analyst",
    sourceHandle: "@hypocaust",
    text: "Bumrah's last 2 wickets in death overs at Eden Gardens have both been off-stump deliveries to right-handers. Pattern setup.",
    timestampIso: new Date(Date.now() - 60 * 1000).toISOString(),
    tags: ["bowling-analysis"],
  },
];


// ============================================================================
// Global matches — international, bilateral, and league fixtures
// Non-IPL matches for home page diversity
// ============================================================================

export const LIVE_INTERNATIONAL: Match[] = [
  {
    id: "ind-aus-t20i-2026-m2-live",
    format: "T20I",
    competition: COMPETITIONS.indAusT20i2026,
    matchNumber: "2nd T20I",
    startTimeIso: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    status: "live",
    venue: { id: "scg", name: "Sydney Cricket Ground", city: "Sydney", country: "AUS", parScore: 168, battingFirstWinPct: 0.51 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.IND,
    toss: { winner: "AUS", elected: "bat" },
    innings: [],
    liveStatusOverride: "IND 142/3 (16.2) · need 34 off 22",
    liveWinProbOverride: { teamCode: "IND", pct: 68 },
    excitement: 8,
    highlightBadge: "Series decider",
    summary: "Kohli 61* hunting the series with India needing 34 off 22 balls.",
  },
  {
    id: "eng-sa-test-2026-d3-live",
    format: "Test",
    competition: COMPETITIONS.indEngTest2026,
    matchNumber: "2nd Test · Day 3",
    startTimeIso: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: "live",
    venue: { id: "lords", name: "Lord's Cricket Ground", city: "London", country: "ENG", parScore: 310, battingFirstWinPct: 0.55 },
    teamA: NATIONAL_TEAMS.ENG,
    teamB: NATIONAL_TEAMS.IND,
    toss: { winner: "IND", elected: "bat" },
    innings: [],
    liveStatusOverride: "ENG 2nd inn: 88/4 · trail by 163",
    liveWinProbOverride: { teamCode: "IND", pct: 74 },
    excitement: 9,
    highlightBadge: "Test · Day 3",
    summary: "India lead by 163 with England 4 down — Bazball under scrutiny.",
  },
  {
    id: "psl-2026-lah-kar-live",
    format: "T20",
    competition: COMPETITIONS.psl2026,
    matchNumber: "Match 18",
    startTimeIso: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    status: "live",
    venue: { id: "gaddafi", name: "Gaddafi Stadium", city: "Lahore", country: "PAK", parScore: 162, battingFirstWinPct: 0.52 },
    teamA: LEAGUE_TEAMS.LAH,
    teamB: LEAGUE_TEAMS.KAR,
    toss: { winner: "KAR", elected: "bowl" },
    innings: [],
    liveStatusOverride: "LAH 138/5 (17.0) · 28 needed off 18",
    liveWinProbOverride: { teamCode: "LAH", pct: 55 },
    excitement: 7,
    summary: "Clash of rivals — Lahore and Karachi neck and neck in a low-scoring thriller.",
  },
];

export const PAST_INTERNATIONAL: Match[] = [
  {
    id: "t20wc-2026-ind-pak",
    format: "T20I",
    competition: COMPETITIONS.t20wc2026,
    matchNumber: "Super 8 · Match 3",
    startTimeIso: new Date(Date.now() - 60 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "nassau", name: "Nassau County International Cricket Stadium", city: "New York", country: "USA", parScore: 148 },
    teamA: NATIONAL_TEAMS.IND,
    teamB: NATIONAL_TEAMS.PAK,
    toss: { winner: "PAK", elected: "bowl" },
    innings: [],
    result: { winner: "IND", margin: "by 6 wickets", teamARuns: 152, teamBRuns: 149 },
    excitement: 10,
    highlightBadge: "India won",
    summary: "Rohit's 52 off 29 set up the chase as India overcame a tense Pakistan total in the last over.",
  },
  {
    id: "ct-2025-aus-nz-final",
    format: "ODI",
    competition: COMPETITIONS.ct2025,
    matchNumber: "Final",
    startTimeIso: new Date(Date.now() - 96 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "lahore-gaddafi", name: "Gaddafi Stadium", city: "Lahore", country: "PAK", parScore: 260 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.NZ,
    toss: { winner: "AUS", elected: "bat" },
    innings: [],
    result: { winner: "AUS", margin: "by 43 runs", teamARuns: 312, teamBRuns: 269 },
    excitement: 8,
    highlightBadge: "AUS Champions",
    summary: "Smith's 118 laid the foundation as Australia clinched their third Champions Trophy title.",
  },
  {
    id: "ashes-2526-3rd-test",
    format: "Test",
    competition: COMPETITIONS.ashes2526,
    matchNumber: "3rd Test",
    startTimeIso: new Date(Date.now() - 120 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "mcg", name: "Melbourne Cricket Ground", city: "Melbourne", country: "AUS", parScore: 330 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.ENG,
    toss: { winner: "ENG", elected: "bat" },
    innings: [],
    result: { winner: "AUS", margin: "by an innings and 27 runs", teamARuns: 512, teamBRuns: 210 },
    excitement: 7,
    summary: "Warner's farewell ton and a hostile McGrath-like spell from Hazlewood buried England in three days.",
  },
  {
    id: "bbl-2526-scorchers-sixers",
    format: "T20",
    competition: COMPETITIONS.bbl2526,
    matchNumber: "Final",
    startTimeIso: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "optus", name: "Optus Stadium", city: "Perth", country: "AUS", parScore: 166 },
    teamA: LEAGUE_TEAMS.SCORCHERS,
    teamB: LEAGUE_TEAMS.SIXERS,
    toss: { winner: "SIXERS", elected: "bowl" },
    innings: [],
    result: { winner: "SCORCHERS", margin: "by 8 runs", teamARuns: 177, teamBRuns: 169 },
    excitement: 8,
    highlightBadge: "BBL Final",
    summary: "Lawrence smashed 3 sixes in the final over to help Scorchers defend 177 in a BBL classic.",
  },
];

export const UPCOMING_INTERNATIONAL: Match[] = [
  {
    id: "ind-aus-t20i-2026-m3",
    format: "T20I",
    competition: COMPETITIONS.indAusT20i2026,
    matchNumber: "3rd T20I",
    startTimeIso: new Date(Date.now() + 26 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "mcg", name: "Melbourne Cricket Ground", city: "Melbourne", country: "AUS", parScore: 171 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.IND,
    innings: [],
    excitement: 9,
    summary: "Series decider with the T20 World Cup six weeks away — every player fighting for their spot.",
  },
  {
    id: "eng-sa-odi-2026-m2",
    format: "ODI",
    competition: COMPETITIONS.engSaOdi2026,
    matchNumber: "2nd ODI",
    startTimeIso: new Date(Date.now() + 14 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "headingley", name: "Headingley", city: "Leeds", country: "ENG", parScore: 268 },
    teamA: NATIONAL_TEAMS.ENG,
    teamB: NATIONAL_TEAMS.SA,
    innings: [],
    excitement: 6,
    summary: "England look to level after SA's comprehensive win at The Oval.",
  },
  {
    id: "psl-2026-mul-pes",
    format: "T20",
    competition: COMPETITIONS.psl2026,
    matchNumber: "Match 19",
    startTimeIso: new Date(Date.now() + 6 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "national", name: "National Stadium", city: "Karachi", country: "PAK", parScore: 158 },
    teamA: LEAGUE_TEAMS.MUL,
    teamB: LEAGUE_TEAMS.PES,
    innings: [],
    excitement: 6,
    summary: "Multan Sultans defending PSL title against a Peshawar Zalmi side that's hit form late.",
  },
  {
    id: "hundred-2026-ovi-lsp",
    format: "T20",
    competition: COMPETITIONS.hundred2026,
    matchNumber: "Match 11",
    startTimeIso: new Date(Date.now() + 32 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "oval", name: "The Kia Oval", city: "London", country: "ENG", parScore: 152 },
    teamA: LEAGUE_TEAMS.OVI,
    teamB: LEAGUE_TEAMS.LSP,
    innings: [],
    excitement: 7,
    summary: "London derby with Stokes leading London Spirit in a must-win against the table-toppers.",
  },
  {
    id: "mlc-2026-lakr-tsk",
    format: "T20",
    competition: COMPETITIONS.mlc2026,
    matchNumber: "Match 8",
    startTimeIso: new Date(Date.now() + 18 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "gs", name: "Grand Prairie Stadium", city: "Dallas", country: "USA", parScore: 155 },
    teamA: LEAGUE_TEAMS.LAKR,
    teamB: LEAGUE_TEAMS.TSK,
    innings: [],
    excitement: 5,
    summary: "KKR vs CSK brands meet in Texas — MLC's marquee rivalry drawing huge US viewership.",
  },
];

// ============================================================================
// Combined all-cricket exports for the home page
// ============================================================================

export const ALL_LIVE_MATCHES: Match[] = [
  ...LIVE_MATCHES,
  ...LIVE_INTERNATIONAL,
];

export const ALL_PAST_MATCHES: Match[] = [
  ...PAST_MATCHES,
  ...PAST_INTERNATIONAL,
].sort((a, b) => b.startTimeIso.localeCompare(a.startTimeIso));

export const ALL_UPCOMING_MATCHES: Match[] = [
  ...UPCOMING_MATCHES,
  ...UPCOMING_INTERNATIONAL,
].sort((a, b) => a.startTimeIso.localeCompare(b.startTimeIso));

// All competition short-names for filter dropdown
export const ALL_COMPETITION_NAMES: string[] = [
  ...new Set(
    [...ALL_LIVE_MATCHES, ...ALL_PAST_MATCHES, ...ALL_UPCOMING_MATCHES]
      .map(m => m.competition.shortName)
  ),
].sort();
