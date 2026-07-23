import type { Team } from "./types";
import { CYAN } from "./tokens";

// ============================================================================
// Batting-team accent color resolution — v1.0.104
// ============================================================================
// Resolves the color used to theme the not-out highlight, the sparkline's
// live line, and the two team-selector pills (TeamToggle, TestInningsChips
// in components/Scorecard.tsx) to the batting team's own identity, instead
// of the platform's fixed cyan accent all four previously shared.
//
// Real `primaryColor` is used for almost every team, including ones that
// score poorly on contrast against the card background (Zimbabwe, Royal
// Challengers Bengaluru, Punjab Kings, etc.) -- that's a deliberate product
// decision, not an oversight: the not-out label always carries its own text,
// so there's no risk of it being mistaken for something else the way an
// unlabeled dot would be.
//
// The ONE exception is a team with a literally colorless `primaryColor`
// (`#000000` -- New Zealand, Uganda, Papua New Guinea, London Spirit as of
// this mock dataset): there's no hue there to theme with at all, so this
// falls back to `secondaryColor` if it clears WCAG contrast against the
// real card background (`#141B2D`, `bg-surface` -- see DESIGN-SYSTEM.md),
// or to the platform's default cyan if the team has no secondary color, or
// its secondary also fails contrast. This is narrow and explicit -- it is
// NOT a general low-contrast-avoidance system, and must not be extended to
// any other team without a separate product decision.
// ============================================================================

const CARD_BG = "#141B2D"; // bg-surface -- the real .card background these elements render on
const MIN_CONTRAST = 3.0; // WCAG 2.x minimum for non-text/UI-component contrast

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
 * selector pills with. See the module comment above for the colorless-team
 * exception -- every other team just passes its real `primaryColor` through.
 */
export function getBattingTeamAccentColor(team: Team): string {
  if (team.primaryColor !== "#000000") return team.primaryColor;
  if (team.secondaryColor && contrastRatio(team.secondaryColor, CARD_BG) >= MIN_CONTRAST) {
    return team.secondaryColor;
  }
  return CYAN;
}
