import type { Team } from "./types";
import { CYAN } from "./tokens";

// ============================================================================
// Batting-team accent color resolution — v1.0.104, corrected v1.0.105/106
// ============================================================================
// Resolves the color used to theme the not-out highlight, the sparkline's
// live line, and the two team-selector pills (TeamToggle, TestInningsChips
// in components/Scorecard.tsx) to the batting team's own identity, instead
// of the platform's fixed cyan accent all four previously shared.
//
// v1.0.105 correction: the contrast check now runs for every team's real
// `primaryColor` against the card background (`#141B2D`), not just teams
// with a literal `#000000` primary, and the minimum was raised from 3.0 to
// 7.0 (WCAG AAA "enhanced contrast") -- see the per-team audit in
// DECISIONS-LOG.md FY35 for why. `resolveTeamColorTier()` below is that
// per-team-only check, unaware of who the other team in the match is.
//
// v1.0.106 correction -- READ THIS BEFORE CHANGING THE COLLISION LOGIC:
// Checking each team's color against the background in isolation misses a
// second failure mode: two teams can each independently clear the bar and
// still land on colors too close to EACH OTHER to tell apart. Live example:
// India's real primary blue fails the hairline check and falls back to its
// gold secondary (`#F9A825`) -- which passes fine against the dark
// background on its own, but sits right on top of Australia's real gold
// primary (`#FFB81C`) in an India vs Australia match, so both batters'
// not-out boxes read as "Australia-colored" even when India is batting.
//
// `resolveMatchAccentColors(teamA, teamB)` is the fix: it resolves each
// team's color independently first (exactly as before), then checks the two
// FINAL colors against each other (not the background) at a separate,
// lower bar -- 1.5:1 -- since this step is about telling two colors apart
// from each other, not about a color surviving against a fixed dark
// background. Below that, the lower-priority team drops:
//   - real primary > secondary fallback > cyan, in that order;
//   - a team one tier below the other drops one tier (primary -> secondary,
//     but only if that secondary both clears its OWN background-contrast
//     check and doesn't ALSO collide with the other team's now-fixed color;
//     otherwise straight to cyan, since there's nowhere softer to land);
//   - two teams landing at the SAME tier is a deterministic tie: whichever
//     team's `fullName` sorts second alphabetically drops straight to cyan.
//     This is intentionally NOT based on which team is batting, home, or
//     listed as `teamA` -- it must give the same answer regardless of match
//     state, or two renders of the same match could disagree with each
//     other.
//
// Every real call site (TeamToggle, TestInningsChips, InningsCard, all in
// components/Scorecard.tsx) always has both teams in scope, so
// `resolveMatchAccentColors` is what they should call -- there's no longer
// a single-team-only entry point exported from this module, since a
// single-team resolution can't know about a same-match collision and would
// silently reintroduce this bug for any new caller that used it.
//
// No exception exists for the wicket-red teams (Zimbabwe, Perth Scorchers,
// Punjab Kings) here either -- the same math applies to them as to anyone
// else, at both the background-contrast and the cross-team-collision step.
// ============================================================================

const CARD_BG = "#141B2D"; // bg-surface -- the real .card background these elements render on

// WCAG 2.x AAA "enhanced contrast" level. See the module comment above for
// why a hairline-stroke check borrows this number instead of the 3.0 minimum
// meant for solid, normal-size non-text UI components.
const MIN_CONTRAST = 7.0;

// Minimum contrast the two teams' FINAL resolved colors must have against
// EACH OTHER (not the background) to count as visually distinguishable.
// Deliberately much lower than MIN_CONTRAST above -- this step isn't asking
// "does this color survive on a dark background," it's asking "can these
// two specific colors be told apart from each other," which is a lower bar.
const COLLISION_MIN_CONTRAST = 1.5;

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

/** WCAG contrast ratio between two hex colors -- 1 (no contrast) to 21 (max). */
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

type Tier = 0 | 1 | 2; // 0 = real primary, 1 = secondary fallback, 2 = platform cyan

interface ResolvedTeamColor {
  color: string;
  tier: Tier;
}

/** Per-team-only resolution (v1.0.105): real `primaryColor` if it clears the
 * hairline-stroke minimum against the card background, else `secondaryColor`
 * if THAT clears it, else the platform cyan. Deliberately not exported --
 * see the module comment above for why every real caller needs the
 * match-aware `resolveMatchAccentColors` instead. */
function resolveTeamColorTier(team: Team): ResolvedTeamColor {
  if (contrastRatio(team.primaryColor, CARD_BG) >= MIN_CONTRAST) {
    return { color: team.primaryColor, tier: 0 };
  }
  if (team.secondaryColor && contrastRatio(team.secondaryColor, CARD_BG) >= MIN_CONTRAST) {
    return { color: team.secondaryColor, tier: 1 };
  }
  return { color: CYAN, tier: 2 };
}

function collides(colorX: string, colorY: string): boolean {
  return contrastRatio(colorX, colorY) < COLLISION_MIN_CONTRAST;
}

/** Drops `resolved` one tier for `team`, given the OTHER team's (unchanged)
 * final color. Only ever called on the lower-priority side of a same-match
 * collision. A real primary can drop to its secondary IF that secondary
 * both clears its own background-contrast minimum AND doesn't also collide
 * with the other team's color; any other case (no safe secondary, or
 * already on secondary/cyan with nothing softer below it) drops straight to
 * the platform cyan. */
function dropOneTier(resolved: ResolvedTeamColor, team: Team, otherColor: string): string {
  if (resolved.tier === 0) {
    const sec = team.secondaryColor;
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
 * colors are checked against each other. If they're too close to tell
 * apart (below 1.5:1 contrast), the lower-priority team -- real primary
 * outranks a secondary fallback, which outranks cyan -- drops one tier; a
 * same-tier tie drops whichever team's full name sorts second
 * alphabetically straight to cyan. See the module comment above for the
 * full reasoning and DECISIONS-LOG.md FY36 for the audited results across
 * every match in the mock dataset.
 *
 * This is the only entry point real call sites should use -- there is no
 * single-team equivalent exported from this module.
 */
export function resolveMatchAccentColors(teamA: Team, teamB: Team): Record<string, string> {
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
