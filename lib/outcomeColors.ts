// ============================================================================
// Unified ball-outcome colour palette — Sarthak v0.9 #2
// Used by BallGIF, DeliveryCard, MiniBallGIF, OverSummary.
//
// Palette designed so a row of 6 balls in an over reads as good/bad at-a-glance:
//   wicket = vivid red       (deep negative)
//   dot    = muted slate     (cold, low impact)
//   1      = pale mint       (mild positive)
//   2      = mint             (positive)
//   3      = gold yellow      (rare, positive)
//   4      = bright cyan      (strong positive)
//   6      = vivid purple     (dramatic positive)
//   extra  = light slate     (neutral; wides/no-balls)
//
// A row of dots+wickets feels muted/red. A row of 4s+6s feels electric.
// ============================================================================

export type OutcomeKind = "wicket" | "dot" | "single" | "two" | "three" | "four" | "six" | "extra";

export function outcomeKindOf(ball: {
  runs: number;
  isWicket?: boolean;
  isBoundary4?: boolean;
  isBoundary6?: boolean;
  extras?: number;
}): OutcomeKind {
  if (ball.isWicket) return "wicket";
  if (ball.isBoundary6) return "six";
  if (ball.isBoundary4) return "four";
  if (ball.runs === 3) return "three";
  if (ball.runs === 2) return "two";
  if (ball.runs === 1) return "single";
  if ((ball.extras ?? 0) > 0 && (ball.runs ?? 0) === 0) return "extra";
  return "dot";
}

export interface OutcomePalette {
  /** Primary hex (badge fill, line accent). */
  primary: string;
  /** Foreground hex for text printed on top of `primary`. */
  badgeFg: string;
  /** Outer card background colour — used with low alpha. */
  tint: string;
  /** Single-character label rendered inside the badge (W, 6, 4, •, etc.). */
  badgeText: string;
}

export const OUTCOME: Record<OutcomeKind, OutcomePalette> = {
  wicket: { primary: "#EF4444", badgeFg: "#FFFFFF", tint: "#EF4444", badgeText: "W" },
  dot:    { primary: "#64748B", badgeFg: "#FFFFFF", tint: "#475569", badgeText: "•" },
  single: { primary: "#64748B", badgeFg: "#FFFFFF", tint: "#475569", badgeText: "1" }, // same as dot
  two:    { primary: "#4ADE80", badgeFg: "#0A0E1A", tint: "#22C55E", badgeText: "2" },
  three:  { primary: "#FBBF24", badgeFg: "#0A0E1A", tint: "#F59E0B", badgeText: "3" },
  four:   { primary: "#06B6D4", badgeFg: "#0A0E1A", tint: "#0EA5E9", badgeText: "4" },
  six:    { primary: "#2DD4BF", badgeFg: "#0A0E1A", tint: "#2DD4BF", badgeText: "6" }, // turquoise green
  extra:  { primary: "#94A3B8", badgeFg: "#0A0E1A", tint: "#94A3B8", badgeText: "+" },
};

/** Card-style gradient background — fades the outcome tint into the surface. */
export function cardBackgroundFor(kind: OutcomeKind): React.CSSProperties {
  const c = OUTCOME[kind];
  return {
    backgroundColor: c.tint + "1A", // ~10% alpha
    backgroundImage: `linear-gradient(135deg, ${c.tint}40 0%, ${c.tint}14 40%, #141B2D 100%)`,
    borderColor: c.tint + "55",
  };
}

/** Compact dot for OverSummary 6-ball strip — high-contrast, no gradient. */
export function dotColorFor(kind: OutcomeKind): string {
  return OUTCOME[kind].primary;
}
