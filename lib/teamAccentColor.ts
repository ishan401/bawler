import type { Team } from "./types";
import { CYAN } from "./tokens";

// ============================================================================
// Batting-team accent color resolution — v1.0.104, corrected v1.0.105
// ============================================================================
// Resolves the color used to theme the not-out highlight, the sparkline's
// live line, and the two team-selector pills (TeamToggle, TestInningsChips
// in components/Scorecard.tsx) to the batting team's own identity, instead
// of the platform's fixed cyan accent all four previously shared.
//
// v1.0.105 correction -- READ THIS BEFORE CHANGING THE THRESHOLD OR SCOPE:
// v1.0.104 only ever contrast-checked a team's `primaryColor` if it was
// literally `#000000` (the "colorless team" case). Every other team's real
// primaryColor was passed straight through with no check at all. That's
// exactly why England's not-out box and sparkline line went nearly invisible
// on a live match: England's primary (`#1D244E`, a dark navy) was never
// checked, and its contrast against the real card background is ~1.16:1 --
// nowhere near enough to survive as a 1-2px stroke, but the old code had no
// way to catch it because dark-but-not-literally-black primaries skipped the
// check entirely.
//
// Two changes here fix that:
//   1. SCOPE: the contrast check now runs for every team's primaryColor, not
//      just the four with a literal `#000000`. There is no longer a special
//      "colorless team" code path -- it's one uniform check for all ~72
//      teams (national + league), primary first, then secondary, then cyan.
//   2. THRESHOLD: the old 3.0 minimum is WCAG's floor for a solid, normal-
//      weight non-text UI component -- e.g. a filled pill background. It is
//      NOT calibrated for a 1-2px SVG stroke or a 1px box-shadow ring, which
//      read as much fainter than a solid fill at the same contrast ratio
//      (less area, thinner edges, more anti-aliasing). There's no official
//      WCAG number for graphical strokes this thin, so this borrows the
//      closest published reference point that IS calibrated for a case with
//      similarly little margin for error: WCAG 2.x's AAA "enhanced contrast"
//      level, 7:1 (the tier normally reserved for small/thin text). Treating
//      a hairline stroke as at least as demanding as small text is a
//      deliberate, conservative calibration choice -- not a physical model of
//      exact pixel rendering -- and it's the single threshold used to gate
//      all four themed components (the not-out box's ~1px ring and the
//      sparkline's 2px line are both gated by the same check, since a color
//      that survives the thinner of the two will always survive the other;
///     the two pill components use the same resolved color as a solid fill,
//      which is strictly more forgiving than either stroke case).
//
// Net effect: most teams' real primaryColor no longer clears the bar on a
// dark card background and now resolve to secondaryColor or, failing that,
// the platform's default cyan. This is expected and intentional -- legibility
// on a 1-2px stroke was the whole point of this correction. See
// DECISIONS-LOG.md FY35 for the full per-team audit results.
//
// No exception exists for the wicket-red teams (Zimbabwe, Perth Scorchers,
// Punjab Kings) -- they run through this exact same math as every other
// team. If their real primary happens to fail (as Zimbabwe's and Perth
// Scorchers' do) they fall back exactly like anyone else would, not because
// of any red-collision carve-out.
// ============================================================================

const CARD_BG = "#141B2D"; // bg-surface -- the real .card background these elements render on

// WCAG 2.x AAA "enhanced contrast" level. See the module comment above for
// why a hairline-stroke check borrows this number instead of the 3.0 minimum
// meant for solid, normal-size non-text UI components.
const MIN_CONTRAST = 7.0;

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

/**
 * The color to theme a batting team's not-out box, sparkline line, and
 * selector pills with. Every team runs through the same chain: real
 * `primaryColor` if it clears the hairline-stroke contrast minimum against
 * the card background, else `secondaryColor` if THAT clears it, else the
 * platform's default cyan. See the module comment above for why the bar is
 * set where it is and why there's no per-team special-casing.
 */
export function getBattingTeamAccentColor(team: Team): string {
  if (contrastRatio(team.primaryColor, CARD_BG) >= MIN_CONTRAST) {
    return team.primaryColor;
  }
  if (team.secondaryColor && contrastRatio(team.secondaryColor, CARD_BG) >= MIN_CONTRAST) {
    return team.secondaryColor;
  }
  return CYAN;
}
