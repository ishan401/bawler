import type { Team } from "./types";
import { CYAN } from "./tokens";

// ============================================================================
// Batting-team accent color resolution — v1.0.104, corrected v1.0.105/106/107/108
// ============================================================================
// Resolves the color used to theme the not-out highlight, the sparkline's
// live line, and the two team-selector pills (TeamToggle, TestInningsChips
// in components/Scorecard.tsx) to the batting team's own identity, instead
// of the platform's fixed cyan accent all four previously shared.
//
// v1.0.105 correction: the contrast check now runs for every team's real
// `primaryColor` against the card background (`#141B2D`), not just teams
// with a literal `#000000` primary, and the minimum was raised from 3.0 to
// 7.0 (WCAG AAA "enhanced contrast"). `resolveTeamColorTier()` below is that
// per-team-only check, unaware of who the other team in the match is. This
// part of the system is UNCHANGED by v1.0.106/107 -- it's a legibility
// check (does this color survive as a 1-2px stroke against a fixed dark
// background), which is a different question from the one those two
// corrections address below, and WCAG luminance contrast is the right tool
// for it.
//
// v1.0.106 introduced a second check: two teams in the same match could each
// independently clear the background check and still land on colors too
// close to EACH OTHER. `resolveMatchAccentColors(teamA, teamB)` runs both
// teams' colors through `resolveTeamColorTier` first, then compares the two
// FINAL colors against each other.
//
// v1.0.107 correction -- READ THIS BEFORE CHANGING THE COLLISION METRIC:
// v1.0.106 compared the two teams' colors using the same WCAG contrast-
// ratio formula as the background check. That formula only measures
// LUMINANCE (brightness) -- it has no concept of hue or saturation. That's
// why New Zealand's grey secondary (`#A8A9AD`) got flagged as "colliding"
// with Australia's gold primary (`#FFB81C`): they're similarly bright, so
// WCAG contrast between them is low (1.36:1), even though a human looking
// at grey and gold would never call them the same color.
//
// The cross-team check now uses CIEDE2000 (`ciede2000()` below) instead --
// the standard perceptual color-difference formula (a "Delta E"), which
// converts both colors to CIE Lab space and accounts for lightness, hue,
// AND saturation together, the way human color perception actually works.
// The WCAG-based background check above is left untouched: that one is
// genuinely a brightness question (can a stroke this thin be read against
// a fixed dark background), where luminance-only contrast is the correct
// tool. The cross-team question is a "do these two specific colors look
// the same to a person" question, where CIEDE2000 is the correct tool.
//
// THRESHOLD CALIBRATION: `COLLISION_MIN_DELTA_E = 10.0`. Chosen against two
// known answers, not a default textbook number:
//   - India's gold secondary (`#F9A825`) vs Australia's gold primary
//     (`#FFB81C`) MUST collide -- dE00 = 5.42.
//   - New Zealand's grey secondary (`#A8A9AD`) vs Australia's gold primary
//     (`#FFB81C`) MUST NOT collide -- dE00 = 31.71.
//   - Every other real v1.0.106 gold-on-gold collision (Mumbai Indians vs
//     Kolkata Knight Riders/Gujarat Titans/Chennai Super Kings, Kolkata
//     Knight Riders vs Chennai Super Kings, Multan Sultans vs Peshawar
//     Zalmi, LA Knight Riders vs Texas Super Kings) falls in the 5.4-9.2
//     range -- clustered tightly with the India/Australia case, nowhere
//     near the New Zealand/Australia case.
// 10.0 sits with ~1 point of headroom above the highest confirmed real
// collision (9.21) and ~15 points of headroom below the lowest confirmed
// non-collision (25.66) -- not a knife-edge choice. It also lines up with
// the commonly cited CIEDE2000 perceptibility bands (roughly 2-10 =
// "perceptible at a glance," 11-49 = "more similar than opposite"), so it's
// not just curve-fit to these two cases -- it's a real, citable boundary
// that happens to land exactly where the calibration cases need it to.
//
// Every real call site (TeamToggle, TestInningsChips, InningsCard, all in
// components/Scorecard.tsx) always has both teams in scope, so
// `resolveMatchAccentColors` is what they should call -- there's no
// single-team-only entry point exported from this module.
//
// No exception exists for the wicket-red teams (Zimbabwe, Perth Scorchers,
// Punjab Kings) at any step -- the same math applies to them as to anyone
// else, at the background-contrast, tier-resolution, and collision steps.
//
// v1.0.108 -- real-data-readiness pass (see ARCHITECTURE.md's
// "real-data-readiness: the interface-first pattern"). Two gaps closed:
//   1. `resolveMatchAccentColors` now returns a Promise -- async from day
//      one, matching lib/teamData.ts's `getTeamMembershipStatus`/
//      `getTeamRanking` -- so a future swap from mock `Team` objects to a
//      real color-data source (a brand-kit API, say) is a one-file change
//      here, not a call-site migration.
//   2. `sanitizeHexColor` (below) guards the boundary where genuinely
//      untrusted data can reach this module: `Team.primaryColor`/
//      `secondaryColor` are typed as required `string` fields, but that's
//      compile-time-only (see lib/dataValidation.ts's header comment on
//      this exact gap) -- a real provider can send `null`, `undefined`, a
//      non-string, an empty string, a CSS color name, an `rgb()` string,
//      or a bare hex with no `#`. Every one of those now degrades to
//      exactly the same fallback path as a team with no usable color at
//      all -- never a crash, never a silently-wrong computed value.
// ============================================================================

const CARD_BG = "#141B2D"; // bg-surface -- the real .card background these elements render on

// WCAG 2.x AAA "enhanced contrast" level. See the module comment above for
// why a hairline-stroke check borrows this number instead of the 3.0 minimum
// meant for solid, normal-size non-text UI components. Only used for the
// per-team background check -- NOT the cross-team collision check below.
const MIN_CONTRAST = 7.0;

// Minimum perceptual color difference (CIEDE2000 "Delta E") the two teams'
// FINAL resolved colors must have from EACH OTHER to count as visually
// distinguishable. See the module comment above for how this number was
// calibrated against known collision/non-collision cases.
const COLLISION_MIN_DELTA_E = 10.0;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const chan = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

/** WCAG contrast ratio between two hex colors -- 1 (no contrast) to 21 (max).
 * Luminance-only -- used for the per-team background-legibility check, NOT
 * the cross-team collision check (see `ciede2000` for that). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** "r, g, b" -- for building an rgba() string from a hex color at runtime
 * (e.g. a faint team-colored row tint), since Tailwind's arbitrary-opacity
 * classes only work for colors known at build time. */
export function hexToRgbTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

// ----------------------------------------------------------------------------
// CIEDE2000 -- perceptual color difference ("Delta E"). Converts sRGB -> CIE
// Lab (D65 illuminant) and applies the standard CIEDE2000 formula (Sharma,
// Wu & Dalal 2005), which is what "do these two colors look the same to a
// human eye" actually means in color science -- it accounts for lightness,
// chroma (saturation), and hue together, unlike a WCAG contrast ratio,
// which is lightness-only.
// ----------------------------------------------------------------------------

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

const D65_XN = 95.0489;
const D65_YN = 100.0;
const D65_ZN = 108.884;

function hexToLab(hex: string): [number, number, number] {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = srgbToLinear(r8);
  const g = srgbToLinear(g8);
  const b = srgbToLinear(b8);

  // sRGB (D65) -> XYZ
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) * 100;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) * 100;

  const xr = x / D65_XN;
  const yr = y / D65_YN;
  const zr = z / D65_ZN;

  const eps = Math.pow(6 / 29, 3);
  const kappaTerm = 1 / (3 * Math.pow(6 / 29, 2));
  const f = (t: number) => (t > eps ? Math.pow(t, 1 / 3) : t * kappaTerm + 4 / 29);

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);
  return [L, a, bLab];
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** CIEDE2000 Delta E between two Lab colors. ~0 = identical, higher = more
 * different. Roughly: <1 not perceptible, 1-2 perceptible on close
 * inspection, 2-10 perceptible at a glance, 11-49 "more similar than
 * opposite," 100 = polar opposites. */
function ciede2000(lab1: [number, number, number], lab2: [number, number, number]): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const CBar = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(CBar, 7) / (Math.pow(CBar, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const hp = (ap: number, b: number): number => {
    if (ap === 0 && b === 0) return 0;
    const h = radToDeg(Math.atan2(b, ap));
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(a1p, b1);
  const h2p = hp(a2p, b2);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else {
    let dh = h2p - h1p;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
    dhp = dh;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(degToRad(dhp) / 2);

  const LBarp = (L1 + L2) / 2;
  const CBarp = (C1p + C2p) / 2;

  let hBarp: number;
  if (C1p * C2p === 0) {
    hBarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) > 180) {
    hBarp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  } else {
    hBarp = (h1p + h2p) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(degToRad(hBarp - 30)) +
    0.24 * Math.cos(degToRad(2 * hBarp)) +
    0.32 * Math.cos(degToRad(3 * hBarp + 6)) -
    0.2 * Math.cos(degToRad(4 * hBarp - 63));

  const dTheta = 30 * Math.exp(-Math.pow((hBarp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(CBarp, 7) / (Math.pow(CBarp, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(LBarp - 50, 2)) / Math.sqrt(20 + Math.pow(LBarp - 50, 2));
  const Sc = 1 + 0.045 * CBarp;
  const Sh = 1 + 0.015 * CBarp * T;
  const Rt = -Math.sin(degToRad(2 * dTheta)) * Rc;

  const dE = Math.sqrt(
    Math.pow(dLp / Sl, 2) +
      Math.pow(dCp / Sc, 2) +
      Math.pow(dHp / Sh, 2) +
      Rt * (dCp / Sc) * (dHp / Sh)
  );
  return dE;
}

/** Perceptual color difference between two hex colors (CIEDE2000 Delta E). */
export function deltaE00(hexA: string, hexB: string): number {
  return ciede2000(hexToLab(hexA), hexToLab(hexB));
}

type Tier = 0 | 1 | 2; // 0 = real primary, 1 = secondary fallback, 2 = platform cyan

interface ResolvedTeamColor {
  color: string;
  tier: Tier;
}

/**
 * Validates and normalizes a candidate color into a strict 6-digit
 * uppercase hex string (`#RRGGBB`), or returns `undefined` if it isn't
 * one -- treated identically to a MISSING color by every caller here.
 *
 * This guards the one real boundary where this module can receive
 * genuinely untrusted data: `Team.primaryColor`/`secondaryColor` are
 * typed as required `string` fields, but that's a compile-time-only
 * guarantee (see lib/dataValidation.ts's header comment on exactly this
 * gap) -- a real provider can still send `null`, `undefined`, a
 * non-string value, an empty string, a CSS color name ("blue"), an
 * `rgb()`/`rgba()` string, a bare hex with no `#`, or accidental
 * whitespace. `lib/dataValidation.ts`'s `requireString` catches missing/
 * null/empty values at the match-normalization boundary, but it only
 * checks that the value IS a string -- it has no opinion on whether that
 * string is a valid hex color, so a malformed-but-string value like
 * "blue" or "rgb(0,0,0)" passes that check today and would otherwise
 * reach this module's contrast/Delta E math unvalidated.
 *
 * Without this guard, a missing/null/non-string color crashes outright
 * (the lower-level hex parsing calls `.replace()` on it), and some
 * malformed-but-string values silently compute a meaningless contrast or
 * Delta E value from garbage input rather than being recognized as
 * invalid. Every color that reaches `contrastRatio`/`deltaE00` in this
 * module's resolution pipeline goes through this first, so a bad value
 * degrades to the exact same fallback path as a team with no usable
 * color at all -- never a crash, never a silently-wrong color.
 *
 * Shorthand 3-digit hex (`#FFF`) is expanded to 6-digit (`#FFFFFF`) --
 * valid, common CSS shorthand, cheap to support properly rather than
 * letting it fall through to the NaN-driven fallback the way it used to.
 */
function sanitizeHexColor(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  const shortHex = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(trimmed);
  if (shortHex) {
    const [, r, g, b] = shortHex;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const longHex = /^#[0-9a-fA-F]{6}$/.exec(trimmed);
  if (longHex) {
    return trimmed.toUpperCase();
  }
  return undefined; // named colors, rgb()/rgba(), missing "#", 8-digit alpha hex, etc.
}

/** Per-team-only resolution (v1.0.105): real `primaryColor` if it clears the
 * hairline-stroke minimum against the card background, else `secondaryColor`
 * if THAT clears it, else the platform cyan. Deliberately not exported --
 * see the module comment above for why every real caller needs the
 * match-aware `resolveMatchAccentColors` instead. */
function resolveTeamColorTier(team: Team): ResolvedTeamColor {
  const primary = sanitizeHexColor(team.primaryColor);
  if (primary && contrastRatio(primary, CARD_BG) >= MIN_CONTRAST) {
    return { color: primary, tier: 0 };
  }
  const secondary = sanitizeHexColor(team.secondaryColor);
  if (secondary && contrastRatio(secondary, CARD_BG) >= MIN_CONTRAST) {
    return { color: secondary, tier: 1 };
  }
  return { color: CYAN, tier: 2 };
}

/** Cross-team "do these look the same" check -- CIEDE2000, not WCAG
 * contrast. See the module comment above (v1.0.107) for why. */
function collides(colorX: string, colorY: string): boolean {
  return deltaE00(colorX, colorY) < COLLISION_MIN_DELTA_E;
}

/** Drops `resolved` one tier for `team`, given the OTHER team's (unchanged)
 * final color. Only ever called on the lower-priority side of a same-match
 * collision. A real primary can drop to its secondary IF that secondary
 * both clears its own background-contrast minimum AND doesn't also collide
 * (perceptually) with the other team's color; any other case (no safe
 * secondary, or already on secondary/cyan with nothing softer below it)
 * drops straight to the platform cyan. */
function dropOneTier(resolved: ResolvedTeamColor, team: Team, otherColor: string): string {
  if (resolved.tier === 0) {
    const sec = sanitizeHexColor(team.secondaryColor);
    if (sec && contrastRatio(sec, CARD_BG) >= MIN_CONTRAST && !collides(sec, otherColor)) {
      return sec;
    }
    return CYAN;
  }
  return CYAN; // tier 1 has nowhere left but cyan; tier 2 is already cyan
}

/**
 * Resolves BOTH teams' batting-accent colors for a single match at once.
 * Each team's color is resolved independently first (real primary, else
 * secondary, else cyan -- see `resolveTeamColorTier`), then the two FINAL
 * colors are checked against each other using CIEDE2000 perceptual color
 * difference (NOT WCAG contrast -- see the module comment above for why).
 * If they're too close to tell apart (below a Delta E of 10.0), the
 * lower-priority team -- real primary outranks a secondary fallback, which
 * outranks cyan -- drops one tier; a same-tier tie drops whichever team's
 * full name sorts second alphabetically straight to cyan. See
 * DECISIONS-LOG.md FY36/FY37 for the audited results across every match in
 * the mock dataset.
 *
 * This is the ONLY sanctioned entry point for this data -- there is no
 * single-team equivalent exported from this module, and every real caller
 * (TeamToggle, TestInningsChips, InningsCard in components/Scorecard.tsx)
 * goes through this function instead of reading `team.primaryColor` /
 * `team.secondaryColor` directly, the same way `getTeamMembershipStatus`/
 * `getTeamRanking` in lib/teamData.ts are the only sanctioned reads of
 * membership/ranking data (see ARCHITECTURE.md's real-data-readiness
 * pattern).
 *
 * v1.0.108: returns a Promise -- async from day one, per that same
 * pattern -- even though today it still resolves synchronously from
 * in-memory mock `Team` objects. A real integration (colors from a live
 * brand-kit API, say) is a network call, which is unavoidably async, so
 * every call site is already written against that shape. The three call
 * sites in components/Scorecard.tsx consume this via a shared
 * `useMatchAccentColors` hook using the same hydration-safe
 * useState(placeholder)+useEffect pattern already established for
 * `getTeamRanking()` (see MatchCard.tsx's `NationalRankBadge`): render the
 * platform default (cyan for both teams) on the first pass, matching what
 * the server renders, then fill in the real resolved colors after mount.
 * This means swapping the mock implementation for a real fetch later is a
 * one-file change inside this module -- no call site needs to change.
 */
export async function resolveMatchAccentColors(teamA: Team, teamB: Team): Promise<Record<string, string>> {
  const a = resolveTeamColorTier(teamA);
  const b = resolveTeamColorTier(teamB);

  if (!collides(a.color, b.color)) {
    return { [teamA.code]: a.color, [teamB.code]: b.color };
  }

  if (a.tier !== b.tier) {
    if (a.tier < b.tier) {
      return { [teamA.code]: a.color, [teamB.code]: dropOneTier(b, teamB, a.color) };
    }
    return { [teamA.code]: dropOneTier(a, teamA, b.color), [teamB.code]: b.color };
  }

  // Same tier -- deterministic alphabetical tiebreak, straight to cyan.
  // Sorted independently of teamA/teamB argument order or batting/home
  // status, so the same pair of teams always resolves the same way.
  const second = [teamA, teamB].sort((x, y) => x.fullName.localeCompare(y.fullName))[1];
  if (second.code === teamA.code) {
    return { [teamA.code]: CYAN, [teamB.code]: b.color };
  }
  return { [teamA.code]: a.color, [teamB.code]: CYAN };
}
