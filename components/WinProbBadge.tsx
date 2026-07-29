"use client";

import React from "react";

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
 *
 * v1.0.130: visual-prominence pass, same neutral-color rule unchanged.
 * Three changes, all structural/shape, never color:
 *   1. Larger value text in both variants (bigger than the surrounding
 *      score digits it sits near in every call site, per this codebase's
 *      "real visual weight, not hue" answer to making this figure stand
 *      out -- see the file header above).
 *   2. The label + value (or value + caption, for `variant="large"`) are
 *      now wrapped in one soft, translucent, fixed-neutral pill
 *      (`bg-white/[0.06]` + a hairline `border-white/10`) so the readout
 *      reads as one distinct badge instead of plain inline text. This
 *      fill is a relative lightening over whatever background sits behind
 *      it -- never a team color, never a solid design-token fill that
 *      could itself start to look "team-colored" by coincidence.
 *   3. A brief (180ms) scale-only micro-pulse on the value whenever `pct`
 *      genuinely changes, via `key={pct}` remounting the value node so the
 *      CSS animation (`.winprob-pulse`, app/globals.css) retriggers only
 *      on a real update -- never a color pulse, so it cannot reintroduce
 *      the flicker risk already ruled out for team-coloring this figure.
 *
 * v1.0.136: added `variant="boxed"` for MatchupCard.tsx's dedicated,
 * independent win-prob box (split out of the old shared matchup/win-prob
 * row into two side-by-side boxes). This is a fourth structural shape,
 * not a fourth color rule -- same fixed-white value, same label, same
 * pulse-on-change animation as every other variant. Its own
 * `rounded-xl border border-line` + `#0B101C` background matches
 * MatchupCard's own box styling exactly, so the two boxes read as equal
 * siblings rather than one solid card next to one translucent pill.
 */

interface WinProbBadgeProps {
  /** Leading team's short code/name, e.g. "IND". */
  label: string;
  /** Leading team's win probability, 0-100. */
  pct: number;
  /**
   * "compact" — small label-above-value badge, sized for an inline card
   * (the MatchView.tsx no-ball-by-ball fallback card).
   * "large" — big centered number with a "TEAM lead" caption below,
   * sized for a standalone header (WinProbChart.tsx's full-screen modal).
   * "boxed" — fills its container edge-to-edge with its own border/
   * background (rather than a smaller pill floating inside a shared row),
   * for MatchupCard.tsx's dedicated win-prob box (v1.0.136) — that box is
   * now a fully independent sibling next to the matchup box, not sharing
   * a row with it, so it needs to look like a standalone box in its own
   * right rather than a compact end-aligned badge.
   * Structural only — all three variants render the same fixed white
   * value + label + pulse-on-change behavior.
   */
  variant?: "compact" | "large" | "boxed";
  /** When provided, renders as a tappable button (e.g. opens the full win-prob chart). Omit for a static, non-interactive display. */
  onClick?: () => void;
  className?: string;
}

export default function WinProbBadge({
  label, pct, variant = "compact", onClick, className = "",
}: WinProbBadgeProps) {
  const Tag = onClick ? "button" : "div";
  const ariaLabel = onClick ? `Win probability ${label} ${pct}% — open win probability chart` : undefined;

  // Neutral, fixed, translucent pill fill -- a relative lightening over
  // whatever sits behind it, never a solid token or team color. Shared by
  // both variants so the "one distinct badge" treatment can't drift apart
  // the way the color rule itself once did (see file header).
  const pillClasses = "rounded-xl bg-white/[0.06] border border-white/10";

  if (variant === "large") {
    return (
      <Tag
        onClick={onClick}
        className={`text-center shrink-0 ${pillClasses} px-3 py-2 ${className}`}
        aria-label={ariaLabel}
      >
        {/* key={pct} remounts this node only when the percentage itself
            genuinely changes, retriggering the scale-only micro-pulse --
            never on an unrelated re-render. */}
        <div key={pct} className="text-2xl font-extrabold num text-white winprob-pulse">{pct}%</div>
        <div className="text-[9px] text-text-dim uppercase tracking-widest">{label} lead</div>
      </Tag>
    );
  }

  if (variant === "boxed") {
    return (
      <Tag
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-xl border border-line px-2 py-2 ${className}`}
        style={{ background: "#0B101C" }}
        aria-label={ariaLabel}
      >
        <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim">Win Prob</span>
        <span key={pct} className="text-[15px] font-extrabold text-white num winprob-pulse">{label} {pct}%</span>
      </Tag>
    );
  }

  return (
    <Tag
      onClick={onClick}
      className={`shrink-0 flex flex-col items-end leading-none ${pillClasses} px-2 py-1 ${className}`}
      aria-label={ariaLabel}
    >
      <span className="text-[7px] font-bold uppercase tracking-widest text-text-dim">Win Prob</span>
      <span key={pct} className="text-[18px] font-extrabold text-white num winprob-pulse">{label} {pct}%</span>
    </Tag>
  );
}
