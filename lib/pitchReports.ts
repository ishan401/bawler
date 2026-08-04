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
};
