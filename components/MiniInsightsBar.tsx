"use client";
import { memo } from "react";

import type { Match, InsightV2 } from "@/lib/types";
import { formatPlayerName } from "@/lib/playerName";
// v1.0.164: samePlayer() is the same id-or-name union predicate used
// platform-wide for ball-to-card joins (deriveBattingCardFromBalls /
// deriveBowlingCardFromBalls in this file's import). deriveBowlingCardFromBalls
// is reused directly for the bowler-chip fallback below rather than
// reimplementing wicket/runs/overs math a second time -- see the fallback's
// comment for the bug this fixes.
import { samePlayer, deriveBowlingCardFromBalls } from "@/lib/matchStatus";

interface MiniInsightsBarProps {
  match: Match;
  insights: InsightV2[];
}

/**
 * Top-of-screen mini-insights — concise chips that sit immediately
 * below the chase-context line in the ScoreBar.
 *
 * Each chip is at-a-glance: a short label + a punchy number. Every chip
 * (currently: striker, non-striker, current bowler) shares the same fixed
 * max-width + ellipsis truncation so a long player name or deep-innings
 * score string can never overflow or wrap the row.
 *
 * v1.0.121: the win-probability chip that used to live here was removed —
 * that figure now renders with real visual weight inside MatchupCard's
 * matchup row instead of as a small pill duplicated in two places.
 */
function MiniInsightsBar({ match, insights }: MiniInsightsBarProps) {
  const chips = deriveMiniInsights(match, insights);
  if (chips.length === 0) return null;
  return (
    <div className="px-4 py-2 bg-bg/85 backdrop-blur border-b border-line flex items-center gap-2 overflow-x-auto scrollbar-thin">
      {chips.map((c, i) => (
        <Chip key={i} chip={c} />
      ))}
    </div>
  );
}

function Chip({ chip }: { chip: MiniChip }) {
  // `onClick` is now vestigial (no remaining chip sets it, since the
  // win-prob chip that used it was removed in v1.0.121 — see below) but is
  // left in place rather than stripped, since a future chip may legitimately
  // want a tap target and the click-handling branch below is still correct.
  const Tag = chip.onClick ? "button" : "div";

  return (
    <Tag
      onClick={chip.onClick}
      aria-label={chip.onClick ? `${chip.label} ${chip.value}` : undefined}
      className={`shrink-0 flex items-baseline gap-1 px-2 py-1 rounded-md border border-line bg-bg-surface max-w-[118px] overflow-hidden ${
        chip.onClick ? "active:scale-95 transition-transform" : ""
      }`}
    >
      <span className={`text-[10px] font-extrabold num shrink-0 truncate max-w-[52px] ${chip.valueColor}`}>{chip.value}</span>
      <span className="text-[9px] text-text-secondary truncate min-w-0">{chip.label}</span>
      {chip.onClick && (
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-dim ml-0.5">
          <path d="M3 5L8 11L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </Tag>
  );
}

interface MiniChip {
  value: string;
  valueColor: string;
  label: string;
  onClick?: () => void;
}

function deriveMiniInsights(
  match: Match,
  _insights: InsightV2[]
): MiniChip[] {
  const chips: MiniChip[] = [];
  const live = match.innings[match.innings.length - 1];

  if (live) {
    // Chips 1 & 2: derive current batters from ball data (ground truth for who's at crease)
    const strikerName = live.balls[live.balls.length - 1]?.batterName;
    const nonStrikerName = [...live.balls].reverse().find(b => b.batterName && b.batterName !== strikerName)?.batterName;

    // Helper: get runs/balls from battingCard; fallback to computing from ball data
    // (guards against battingCard being incomplete in real-data scenarios)
    const batterStats = (name: string) => {
      const card = live.battingCard.find(r => r.playerName === name);
      if (card) return { runs: card.runs, balls: card.ballsFaced };
      const faced = live.balls.filter(b => b.batterName === name);
      return { runs: faced.reduce((s, b) => s + (b.runs ?? 0), 0), balls: faced.length };
    };

    if (strikerName) {
      const s = batterStats(strikerName);
      chips.push({
        value: `${s.runs}(${s.balls})`,
        // v1.0.191: always plain white in this row, regardless of
        // milestones -- was `s.runs >= 50 ? "text-boundary" :
        // "text-text-primary"`. The milestone check itself (`s.runs >=
        // 50`) is intentionally still computed nowhere near here; this
        // row simply no longer reads that state for its own color. The
        // moment-detection logic that drives the Moments strip's own
        // milestone events is untouched and lives entirely elsewhere
        // (see lib/matchStatus.ts / event derivation) -- this chip just
        // stopped rendering a second, redundant color cue for the same
        // fact. See DECISIONS-LOG.md.
        valueColor: "text-text-primary",
        label: formatPlayerName(strikerName) + "*",
      });
    }
    if (nonStrikerName) {
      const s = batterStats(nonStrikerName);
      chips.push({
        value: `${s.runs}(${s.balls})`,
        // v1.0.191: same fixed plain-white rule as the striker chip above.
        valueColor: "text-text-primary",
        label: formatPlayerName(nonStrikerName),
      });
    }

    // Chip 3: current bowler match figures
    //
    // v1.0.164: this chip used to silently disappear whenever a match's
    // bowlingCard used a different name format than its ball data (e.g.
    // ipl2026-m37-kkrvmi's bowlingCard has "Jasprit Bumrah"/"P. Krishna"
    // while its balls say "J Bumrah"/"P Krishna" -- neither is a literal
    // substring of the other, so the old `.includes()` lookup below always
    // missed and the chip was just dropped with no error). Two independent
    // fixes, both required:
    //
    // 1. Matching is now via samePlayer() (id === entryId || name ===
    //    entryName) -- the same union predicate deriveBattingCardFromBalls/
    //    deriveBowlingCardFromBalls use for every other ball-to-card join
    //    in the app (see lib/matchStatus.ts) -- instead of fragile
    //    substring inclusion. Still not foolproof against every possible
    //    naming divergence, which is exactly why fix 2 exists.
    // 2. If the lookup still misses (stale/malformed/differently-formatted
    //    card), this now falls back to computing the bowler's live figures
    //    straight from `live.balls` via deriveBowlingCardFromBalls() --
    //    mirroring the batter chips' own balls-derived fallback above,
    //    which is exactly why THEIR chips never went missing under the
    //    same kind of name mismatch. The chip must never again depend
    //    entirely on a name lookup succeeding.
    const lastBall = live.balls[live.balls.length - 1];
    const currentBowlerId = lastBall?.bowlerId;
    const currentBowlerName = lastBall?.bowlerName;
    if (currentBowlerName) {
      let bowlerStats = live.bowlingCard.find(
        b => samePlayer(currentBowlerId ?? "", currentBowlerName, b.playerId, b.playerName)
      );
      if (!bowlerStats) {
        const derived = deriveBowlingCardFromBalls(live.balls, [], match.format);
        bowlerStats = derived.find(
          b => samePlayer(currentBowlerId ?? "", currentBowlerName, b.playerId, b.playerName)
        );
      }
      if (bowlerStats) {
        chips.push({
          value: `${bowlerStats.wickets}/${bowlerStats.runsConceded}`,
          // v1.0.191: always plain white -- was `bowlerStats.wickets >= 2
          // ? "text-cyan" : "text-text-primary"`. Same rule as the two
          // batter chips above: this row's own color styling is now fixed,
          // independent of wicket count. `bowlerStats.wickets` itself is
          // still computed exactly as before and still available to
          // anything else that needs it (e.g. the Moments strip's own
          // wicket events) -- only this chip's color reaction to it is
          // gone. See DECISIONS-LOG.md.
          valueColor: "text-text-primary",
          label: formatPlayerName(currentBowlerName),
        });
      }
    }
  }

  // Win-probability chip removed (v1.0.121) — the leading-team win-prob
  // figure now lives with real visual weight in MatchupCard's matchup row
  // (see MatchupCard.tsx) instead of duplicating it here as a small pill.
  // See DECISIONS-LOG.md v1.0.121 for the reasoning.

  return chips;
}
export default memo(MiniInsightsBar);
