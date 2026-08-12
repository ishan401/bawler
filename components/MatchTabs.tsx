"use client";
import { memo } from "react";

export type TabKey = "live" | "scorecard" | "digest" | "info" | "table";

export interface TabBadge {
  tab: TabKey;
  type: "wicket" | "six";
}

// v1.0.193 -- tab labels, keyed by TabKey. Previously this component derived
// its own tab SET independently from a `showTable`/`showDigest`/`firstTab`
// trio of booleans/enums, computed a second time (differently!) from
// MatchView.tsx's own TABS_ORDER, which is the actual single source of truth
// for which tabs a given match's CURRENT state (live/upcoming/finished)
// should show -- MatchView.tsx already needs that exact ordered list for its
// swipe-gesture direction lookup, so this component duplicating a slightly
// different derivation of the same thing was the root cause of the LIVE tab
// (and, for the wrong reason, the Score tab) staying visible on upcoming
// matches. Now this component renders exactly whatever ordered `tabs` array
// its caller passes -- no independent derivation left to drift out of sync.
const TAB_LABELS: Record<TabKey, string> = {
  live: "Live",
  // Label shortened to "Score" (v1.0.79) -- at equal tab width (needed to
  // fix the uneven-width bug in v1.0.78), "Scorecard" doesn't fit even at
  // zero letter-spacing (measured ~75px vs. the ~56px available inside an
  // 80px-wide tab), so it was truncating to "SCOR...". "Score" fits
  // comfortably (~47px) at the tab bar's normal tracking-widest. The tab's
  // `key` stays "scorecard" -- this only changes the visible label, not the
  // tab identity or the Scorecard component itself.
  scorecard: "Score",
  digest: "Digest",
  info: "Info",
  table: "Table",
};

interface MatchTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  badge?: TabBadge | null;
  /** Exactly which tabs to render, in display order -- computed once by the
   *  caller (MatchView.tsx's TABS_ORDER) per the match's current state, and
   *  simply mapped to labels here. See the module comment above. */
  tabs: TabKey[];
}

function MatchTabs({ active, onChange, badge, tabs }: MatchTabsProps) {
  return (
    <div className="bg-bg/95 backdrop-blur border-b border-line">
      <div className="px-4 flex items-stretch">
        {tabs.map(key => {
          const isActive = key === active;
          const hasBadge = badge?.tab === key && !isActive;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex-1 min-w-0 px-3 py-3 text-xs font-bold uppercase tracking-widest relative transition-colors text-center truncate ${
                isActive ? "text-cyan" : "text-text-dim hover:text-text-secondary"
              }`}
            >
              {TAB_LABELS[key]}
              {isActive && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-cyan rounded-full" />
              )}
              {hasBadge && badge && (
                <span
                  className={`absolute top-2 right-3 w-2 h-2 rounded-full animate-pulse-slow ${
                    badge.type === "wicket" ? "bg-wicket" : "bg-six"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default memo(MatchTabs);
