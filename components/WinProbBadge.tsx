"use client";

/**
 * WinProbBadge — the ONE shared presentation for "leading team + win
 * probability %" anywhere on the platform (v1.0.123).
 *
 * Before this file existed, this exact readout was implemented twice:
 * once correctly (MatchupCard.tsx's matchup-row teaser, added v1.0.121 —
 * fixed white text, no team coloring, for the reasons in that file's
 * header comment: team color can misread as "losing," can flicker
 * distractingly in a close finish, and can collide across simultaneous
 * matches sharing a color fallback) and once incorrectly (the "ball-by-ball
 * data unavailable" fallback card in MatchView.tsx, and the full-screen
 * WinProbChart.tsx modal's own big center number — both still showed the
 * leading team's percentage in that team's own color, because the v1.0.121
 * decision was applied to the one component that prompted it and never
 * propagated anywhere else this same readout appeared).
 *
 * Extracting this into one component means there is now exactly one place
 * that decides "how does a leading-team win-prob number look" — every
 * caller passes in a label + percentage (already resolved via
 * `getLeadingTeamWinProb`/`getLeadingTeamFromOverride` in lib/winProb.ts,
 * never computed inline at the call site) and gets the identical fixed
 * white treatment back, regardless of which team is leading, how close
 * the match is, or whether the underlying data came from real ball-by-ball
 * points or a manual override for a data-incomplete match. Data
 * completeness and team identity must never change this component's
 * color — only `variant` (a purely structural/layout choice, not a
 * color one) varies by call site.
 *
 * Deliberately NOT used for dual-team side-by-side displays (the homepage
 * live-match cards' comparison sparkline, the shareable moment card's
 * before/after swing, Digest's turning-point "shift toward TEAM" line) —
 * those show both teams at once for comparison/narrative purposes, a
 * genuinely different display concept from "who's leading right now,"
 * and were confirmed out of scope for this consolidation.
 */

interface WinProbBadgeProps {
  /** Leading team's short code/name, e.g. "IND". */
  label: string;
  /** Leading team's win probability, 0-100. */
  pct: number;
  /**
   * "compact" — small label-above-value badge, sized for a matchup row or
   * an inline card (MatchupCard.tsx, the MatchView.tsx fallback card).
   * "large" — big centered number with a "TEAM lead" caption below,
   * sized for a standalone header (WinProbChart.tsx's full-screen modal).
   * Structural only — both variants render the same fixed white value.
   */
  variant?: "compact" | "large";
  /** When provided, renders as a tappable button (e.g. opens the full win-prob chart). Omit for a static, non-interactive display. */
  onClick?: () => void;
  className?: string;
}

export default function WinProbBadge({
  label, pct, variant = "compact", onClick, className = "",
}: WinProbBadgeProps) {
  const Tag = onClick ? "button" : "div";
  const ariaLabel = onClick ? `Win probability ${label} ${pct}% — open win probability chart` : undefined;

  if (variant === "large") {
    return (
      <Tag onClick={onClick} className={`text-center px-2 shrink-0 ${className}`} aria-label={ariaLabel}>
        <div className="text-xl font-extrabold num text-white">{pct}%</div>
        <div className="text-[9px] text-text-dim uppercase tracking-widest">{label} lead</div>
      </Tag>
    );
  }

  return (
    <Tag
      onClick={onClick}
      className={`shrink-0 flex flex-col items-end leading-none px-0.5 ${className}`}
      aria-label={ariaLabel}
    >
      <span className="text-[7px] font-bold uppercase tracking-widest text-text-dim">Win Prob</span>
      <span className="text-[13px] font-extrabold text-white num">{label} {pct}%</span>
    </Tag>
  );
}
