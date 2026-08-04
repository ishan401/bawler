// ============================================================================
// Pitch reports — extracted from lib/mockData.ts / lib/types.ts (v1.0.153),
// re-keyed from venue id to match id (v1.0.154)
// ============================================================================
// Pure move, byte-for-byte: the PitchReport interface (was lib/types.ts) and
// PITCH_REPORTS data (was lib/mockData.ts) now live together in their own
// dedicated file, isolated from the ~15,200-line mockData.ts object literal.
// See DECISIONS-LOG.md for why: a prior attempt to extend this exact feature
// (adding international-venue pitch reports) corrupted mockData.ts badly
// enough to truncate ~13,800 lines and take down the whole app, twice,
// each requiring a hard reset to recover. Editing pitch-report data here
// can no longer touch match/ball/player data at all, structurally.
//
// v1.0.154: PITCH_REPORTS is now keyed by Match.id, not Venue.id. A venue's
// actual pitch condition is genuinely a per-match fact -- a curated/relaid
// pitch, different weather, different dew that same night -- not a fixed
// property of the ground itself. One shared report per venue was a
// simplification that stops being true the moment two different matches at
// the same ground get independently-authored conditions. `venueId` stays on
// each entry as informational content (which ground this specific match's
// report describes) -- it is no longer the lookup key.
// ============================================================================

export interface PitchReport {
  venueId: string;
  surfaceType: "red-soil" | "black-soil" | "grass-heavy" | "dry" | "balanced";
  // v1.0.155: made optional (real-data-readiness) -- a real per-match pitch
  // report may only have some of these fields available (e.g. surface type
  // and a plain-language summary from a curator, but no numeric sliders
  // yet). `bullets` stays required -- see its own doc comment below.
  // PitchReportCard.tsx omits each corresponding section entirely when its
  // field is absent, rather than rendering a misleading 0/10 slider or a
  // "0-0-0" score range -- same "don't render a misleading default" pattern
  // already used elsewhere in this app (e.g. DeliveryCard.tsx's SpeedDot,
  // lib/playerForm.ts's empty-series handling).
  paceFriendly?: number;
  spinFriendly?: number;
  bounceConsistency?: number;
  expectedFirstInningsScore?: { low: number; mid: number; high: number };
  dewFactor?: "low" | "moderate" | "high";
  // Always required -- the plain-language summary is this card's whole
  // point (see PitchReportCard.tsx's own header comment quoting the
  // product ask: pitch info is "one of the most misunderstood,
  // under-discussed things in cricket"). A pitch report with every
  // structured field absent but real bullets is still worth showing;
  // one with bullets absent has nothing to show at all.
  bullets: string[];
}

// ============================================================================
// Pitch reports per match — for the Info tab. Keyed by Match.id.
// ============================================================================

export const PITCH_REPORTS: Record<string, PitchReport> = {
  // Eden Gardens, Kolkata -- FEATURED_MATCH (MI vs KKR), the permanently-live
  // showcase fixture.
  "ipl2026-m37-kkrvmi": {
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
  // Wankhede Stadium, Mumbai -- PBKS vs LSG (upcoming).
  "ipl2026-m39-pbksvlsg": {
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
  // M. Chinnaswamy Stadium, Bengaluru -- RCB vs CSK (live).
  "ipl2026-l2-rcbvcsk": {
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
  // M. A. Chidambaram Stadium, Chennai -- CSK vs KKR (upcoming).
  "ipl2026-m41-cskvkkr": {
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
  // Narendra Modi Stadium, Ahmedabad -- GT vs RR (live).
  "ipl2026-l3-gtvrr": {
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

  // Sydney Cricket Ground -- IND vs AUS T20I (live).
  "ind-aus-t20i-2026-m2-live": {
    venueId: "scg",
    surfaceType: "grass-heavy",
    paceFriendly: 7,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 150, mid: 168, high: 185 },
    dewFactor: "low",
    bullets: [
      "SCG's grass cover gives seamers genuine nip through the first 6 overs under lights.",
      "Traditionally a used, dry surface by night -- spinners get more purchase here than most Australian grounds.",
      "True, even bounce all innings; batters can trust the pace of the pitch once set.",
      "Square boundaries are longer than the straight -- mistimed pulls and cuts often don't carry.",
    ],
  },

  // Lord's -- IND vs ENG Test, day 3 (live).
  "ind-eng-test-2026-d3-live": {
    venueId: "lords",
    surfaceType: "grass-heavy",
    paceFriendly: 8,
    spinFriendly: 3,
    bounceConsistency: 6,
    // No expectedFirstInningsScore or dewFactor: a Test's conditions shift too
    // much across 5 days for a single first-innings score range to be
    // meaningful, and dew is a minor factor in a match played mostly in
    // daylight -- real-data-readiness in practice, not an oversight.
    bullets: [
      "The famous slope (2.5m across the square) genuinely affects seam angle -- bowlers from the Pavilion End get extra shape into right-handers.",
      "New Zealand-strain grass keeps this surface green and seam-friendly through the first two days; flattens out by day 3-4 for batting.",
      "Overhead conditions matter more here than pitch composition -- heavy cloud brings the slip cordon into the game all day.",
      "Historically a tough toss to lose: first-innings runs on a fresh surface are worth more than at most English grounds.",
    ],
  },

  // Gaddafi Stadium, Lahore -- PSL, live.
  "psl-2026-lah-kar-live": {
    venueId: "gaddafi",
    surfaceType: "dry",
    paceFriendly: 4,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 165, mid: 182, high: 200 },
    dewFactor: "moderate",
    bullets: [
      "Historically one of the flattest tracks on the circuit -- genuine batting paradise once the new-ball swing (if any) is negotiated.",
      "Low, slow bounce blunts short-ball plans; batters who get in rarely get out to the pitch itself.",
      "Evening dew picks up from the back half of the chase, easing stroke-play for the team batting second.",
      "Boundary hitting is a skill premium here -- straight sixes carry easily, business as usual for finishers.",
    ],
  },

  // M. Chinnaswamy Stadium, Bengaluru -- CSK vs RCB (post-match).
  "ipl2026-m36-cskvrcb": {
    venueId: "chinnaswamy",
    surfaceType: "balanced",
    paceFriendly: 5,
    spinFriendly: 5,
    bounceConsistency: 6,
    expectedFirstInningsScore: { low: 180, mid: 195, high: 220 },
    bullets: [
      "Same short boundaries and thin altitude air as every Chinnaswamy game -- 200+ is never really out of reach.",
      "Straight hitting carries best; genuine mishits over square often still clear the rope.",
      "Grippier for wrist-spin than for seam -- legspin and off-cutters get more out of this surface than out-and-out pace.",
      "Chasing has a slight historical edge here once the lights come on.",
    ],
  },

  // Eden Gardens, Kolkata -- KKR vs RR (post-match).
  "ipl2026-m33-kkrvrr": {
    venueId: "eden",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 158, mid: 174, high: 192 },
    dewFactor: "high",
    bullets: [
      "Same profile as every Eden Gardens night game -- true bounce early, turn creeping in from the middle overs.",
      "Kolkata's heavy evening dew is the great leveller; teams batting second get a skiddier ball to work with.",
      "Off-side boundary is marginally longer than leg side -- accumulation favours working the ball square and behind square on the leg side.",
      "A used surface (multiple matches across a season) tends to slow up and assist spin more as the tournament progresses.",
    ],
  },

  // Wankhede Stadium, Mumbai -- LSG vs PBKS (post-match).
  "ipl2026-m34-lsgvpbks": {
    venueId: "wankhede",
    surfaceType: "red-soil",
    paceFriendly: 7,
    spinFriendly: 4,
    bounceConsistency: 8,
    expectedFirstInningsScore: { low: 172, mid: 188, high: 210 },
    dewFactor: "moderate",
    bullets: [
      "Same red-soil consistency every Wankhede game gets -- true bounce, minimal variable turn.",
      "Sea breeze off the Arabian Sea adds a touch of extra carry through the covers in the evening.",
      "Short straight boundaries reward clean hitting over cross-batted risk.",
      "Spin is more containment than wicket-taking here; expect the ball to be milked rather than beaten.",
    ],
  },

  // Wankhede Stadium, Mumbai -- MI vs CSK (post-match).
  "ipl2026-m30-mivcsk": {
    venueId: "wankhede",
    surfaceType: "red-soil",
    paceFriendly: 7,
    spinFriendly: 4,
    bounceConsistency: 8,
    expectedFirstInningsScore: { low: 175, mid: 190, high: 212 },
    dewFactor: "moderate",
    bullets: [
      "Historically the highest average first-innings score on the IPL circuit -- this surface rewards positive intent from ball one.",
      "Fast bowlers who hit a hard length above 140 km/h get genuine carry through to the keeper.",
      "Boundary square of the wicket is a genuine six-hitting zone for both left- and right-handers.",
      "Chasing sides lean on the evening dew to counter any early swing with the new ball.",
    ],
  },

  // Wankhede Stadium, Mumbai -- MI vs SRH (upcoming).
  "ipl2026-m40-mivsrh": {
    venueId: "wankhede",
    surfaceType: "red-soil",
    paceFriendly: 7,
    spinFriendly: 4,
    bounceConsistency: 8,
    expectedFirstInningsScore: { low: 170, mid: 186, high: 208 },
    dewFactor: "moderate",
    bullets: [
      "Same reliable red-soil deck Wankhede always produces -- no surprises expected for either side's team sheet.",
      "New-ball swing is brief; by over 3-4 this becomes a stroke-maker's pitch.",
      "Historically a tough ground to defend a below-par total on -- dew and true bounce both favour the chase.",
      "Death bowling accuracy matters more here than variety; yorkers at the base of the stumps are the proven method.",
    ],
  },

  // M. A. Chidambaram Stadium, Chennai -- DC vs SRH (post-match).
  "ipl2026-m32-dcvsrh": {
    venueId: "chepauk",
    surfaceType: "dry",
    paceFriendly: 4,
    spinFriendly: 8,
    bounceConsistency: 5,
    expectedFirstInningsScore: { low: 150, mid: 168, high: 185 },
    bullets: [
      "Same black-soil surface every Chepauk game produces -- turn from over 1, more pronounced after the 10-over mark.",
      "Cutters and slower balls trouble batters here more than out-and-out pace.",
      "Sweeping becomes a genuine risk once the surface starts to break up in the second innings.",
      "Historically bat-first territory -- chasing under lights on a wearing Chepauk deck is a tough ask.",
    ],
  },

  // Narendra Modi Stadium, Ahmedabad -- GT vs MI (post-match).
  "ipl2026-m35-givsmi": {
    venueId: "motera",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 168, mid: 182, high: 200 },
    bullets: [
      "Same 80m+ straight boundaries as every Motera game -- mistimed shots down the ground rarely carry.",
      "Even bounce all innings; there's little here to trouble a well-set batter.",
      "Drift for the spinners, not sharp turn -- width is the currency they look to exploit.",
      "Rarely a dew-affected chase here relative to India's coastal grounds; the toss matters less than elsewhere.",
    ],
  },

  // Narendra Modi Stadium, Ahmedabad -- RR vs GT (upcoming).
  "ipl2026-m38-rrvgt": {
    venueId: "motera",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 170, mid: 184, high: 202 },
    bullets: [
      "Consistent Motera profile -- even bounce, honest carry for the quicks with the new ball.",
      "The world's largest stadium by capacity means true, still air in the middle overs; the ball carries further than the eye suggests.",
      "Settled batters historically dominate overs 8-15 once they've adjusted to the pace of the surface.",
      "A genuinely fair toss to lose -- no first-innings/second-innings disparity in the data here.",
    ],
  },

  // Narendra Modi Stadium, Ahmedabad -- GT vs SRH (upcoming).
  "ipl2026-m43-gtvsrh": {
    venueId: "motera",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 172, mid: 186, high: 205 },
    bullets: [
      "Same even, honest Motera surface -- nothing sinister for batters who put in the work early.",
      "Straight boundaries beyond 80m mean six-hitting down the ground is a genuine skill test, not a given.",
      "Spinners get more drift than turn; a well-set batter can play through the line with confidence.",
      "Historically a low-dew ground -- the toss decision here is about matchups, not conditions.",
    ],
  },

  // M. Chinnaswamy Stadium, Bengaluru -- RCB vs DC (upcoming).
  "ipl2026-m42-rcbvdc": {
    venueId: "chinnaswamy",
    surfaceType: "balanced",
    paceFriendly: 5,
    spinFriendly: 5,
    bounceConsistency: 6,
    expectedFirstInningsScore: { low: 182, mid: 198, high: 222 },
    dewFactor: "moderate",
    bullets: [
      "Same short boundaries and thin-air carry as every Chinnaswamy fixture -- few grounds punish a bowling side harder for a bad over.",
      "Altitude adds real distance to well-struck sixes, especially in the back third of the innings.",
      "Moderate dew most evenings -- sides batting second get a small but real advantage.",
      "Wrist-spin edges out finger-spin for wicket-taking; legspinners and mystery spinners have historically thrived here.",
    ],
  },

  // Eden Gardens, Kolkata -- RR vs KKR (post-match).
  "ipl2026-m31-rrvkkr": {
    venueId: "eden",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 160, mid: 176, high: 195 },
    dewFactor: "high",
    bullets: [
      "Same Eden Gardens profile -- true bounce for the seamers early, turn opening up from the middle overs onward.",
      "Heavy Kolkata dew from over 14 makes the ball skid on for whoever's chasing.",
      "Historically a fair balance between bat and ball -- neither discipline dominates the head-to-head record here.",
      "Leg-side boundary is marginally shorter than off-side; balanced attacks bowl a fuller, straighter line to counter it.",
    ],
  },

  // The Gabba, Brisbane -- IND vs AUS T20I (post-match).
  "ind-aus-t20i-2026-m1": {
    venueId: "gabba",
    surfaceType: "grass-heavy",
    paceFriendly: 8,
    spinFriendly: 3,
    bounceConsistency: 8,
    expectedFirstInningsScore: { low: 155, mid: 172, high: 190 },
    dewFactor: "low",
    bullets: [
      "The 'Gabbatoir' reputation is real -- historically the most pace-and-bounce-friendly surface in Australian white-ball cricket.",
      "Extra bounce troubles batters who like to go hard early; the cut and pull shots carry more risk than they look.",
      "Short leg-side boundary invites the pull shot for the brave, but width off a length is genuinely dangerous here for the fielding side.",
      "Spin is largely a containment option, not a wicket-taking one, on this surface.",
    ],
  },

  // Optus Stadium, Perth -- BBL, Perth Scorchers vs Sydney Sixers (post-match).
  "bbl-2526-scorchers-sixers": {
    venueId: "optus",
    surfaceType: "grass-heavy",
    paceFriendly: 9,
    spinFriendly: 2,
    bounceConsistency: 9,
    expectedFirstInningsScore: { low: 165, mid: 180, high: 200 },
    dewFactor: "low",
    bullets: [
      "Regarded as the fastest, bounciest pitch in Australian domestic cricket -- genuine pace bowlers who hit a hard length are rewarded most.",
      "True, even bounce all match; there's very little here for a batter to be genuinely worried about once set.",
      "The Fremantle Doctor's afternoon sea breeze can add carry for bowlers running in from the northern end.",
      "Spin is almost an afterthought on this surface -- most attacks lean on 4-5 seamers instead.",
    ],
  },

  // Nassau County International Cricket Stadium, New York -- T20 World Cup, IND vs PAK (post-match).
  "t20wc-2026-ind-pak": {
    venueId: "nassau",
    surfaceType: "dry",
    paceFriendly: 6,
    spinFriendly: 5,
    bounceConsistency: 4,
    expectedFirstInningsScore: { low: 115, mid: 135, high: 155 },
    dewFactor: "low",
    bullets: [
      "A drop-in pitch with genuinely two-paced bounce -- some deliveries hold up, others skid through low, making stroke-play a real gamble.",
      "Historically the lowest-scoring surface on the T20 World Cup circuit; totals in the 130s have been genuinely competitive here.",
      "New-ball seam movement is significant early -- top orders have struggled to survive the first 4 overs.",
      "Boundary-hitting is a low-percentage play until a batter has spent real time working out the pitch's pace.",
    ],
  },

  // Gaddafi Stadium, Lahore -- Champions Trophy Final, AUS vs NZ (post-match).
  "ct-2025-aus-nz-final": {
    venueId: "lahore-gaddafi",
    surfaceType: "dry",
    paceFriendly: 4,
    spinFriendly: 5,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 260, mid: 285, high: 310 },
    dewFactor: "moderate",
    bullets: [
      "A genuine belter for a 50-over final -- low, true bounce with minimal seam movement once the shine goes.",
      "Evening dew (this was a day-night fixture) historically eases conditions for the side chasing.",
      "Boundary hitting is low-risk here; there's little pace or turn to trouble a set batter going for the shot.",
      "History favours winning the toss and batting first at this ground in ICC knockout cricket.",
    ],
  },

  // Melbourne Cricket Ground -- Ashes, 3rd Test (post-match).
  "ashes-2526-3rd-test": {
    venueId: "mcg",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 4,
    bounceConsistency: 7,
    // No expectedFirstInningsScore or dewFactor -- same real-data-readiness
    // reasoning as the Lord's Test entry: a 5-day match's conditions shift
    // too much for a single score range, and dew is a minor daytime factor.
    bullets: [
      "The drop-in surface at the MCG has historically flattened out earlier than most Australian Test pitches -- day 1 movement rarely lasts past the second new ball.",
      "Boxing Day Test crowds and a huge square mean the ball can seem to carry further than it actually does -- straight hitting is the reliable method.",
      "Even bounce for all five days; genuine deterioration or turn for the spinners is rare compared to the subcontinent.",
      "Sessions here are usually decided by discipline, not by dramatic conditions -- patient, error-free cricket wins Boxing Day Tests.",
    ],
  },

  // Melbourne Cricket Ground -- IND vs AUS T20I (upcoming).
  "ind-aus-t20i-2026-m3": {
    venueId: "mcg",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 4,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 158, mid: 174, high: 192 },
    dewFactor: "low",
    bullets: [
      "The same drop-in MCG surface used across formats -- true, even bounce with only brief new-ball movement.",
      "The ground's sheer size means genuinely well-struck shots are needed to clear the rope, especially square of the wicket.",
      "Spin is a containment tool more than a wicket-taking threat on this pitch.",
      "Historically a fair, low-dew surface -- the toss matters less here than at most white-ball venues.",
    ],
  },
};
