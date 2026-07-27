"use client";

import React from "react";
import type { AchievementLine } from "@/lib/playerForm";

/**
 * Achievements callout on the player profile page -- one line per recent
 * achievement that genuinely applies for the currently selected format
 * tab (Man of the Match count within the last-10-match window, each
 * qualifying Man of the Series award), stacking as many as apply rather
 * than showing only the single most impressive one.
 *
 * Renders nothing at all -- no placeholder, no "no achievements" empty
 * state -- when `lines` is empty. That's the correct, expected state for
 * most player/format combinations, not an error: see
 * lib/playerForm.ts's getPlayerAchievements() for where the empty-array
 * case comes from.
 *
 * Uses the `special` design token -- DESIGN-SYSTEM.md already reserves
 * this exact color for premium/achievement recognition (Man of the
 * Series highlight in Scorecard, a batter's "Never dismissed" chip in
 * MatchupCard, a bowler's five-for milestone chip) -- so this callout
 * reads as the same kind of "this is a real accolade" signal those
 * already use, not a new arbitrary color.
 */
export default function PlayerAchievements({ lines }: { lines: AchievementLine[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="card p-3 space-y-2">
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-special shrink-0 mt-0.5" aria-hidden="true">
            <path
              d="M8 4H16V9C16 11.7614 13.7614 14 11 14H13C10.2386 14 8 11.7614 8 9V4Z"
              stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
            />
            <path d="M8 5H5.5C5.5 7 6.5 8.5 8 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M16 5H18.5C18.5 7 17.5 8.5 16 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 14V17M9 20H15M12 17C12 18.5 10.5 18.5 10.5 20M12 17C12 18.5 13.5 18.5 13.5 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs font-semibold text-text-primary leading-snug">{line.text}</p>
        </div>
      ))}
    </div>
  );
}
