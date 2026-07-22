"use client";
import { memo } from "react";

export type TabKey = "live" | "scorecard" | "digest" | "info" | "table";

export interface TabBadge {
  tab: TabKey;
  type: "wicket" | "six";
}

interface MatchTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  badge?: TabBadge | null;
  showTable?: boolean;
  showDigest?: boolean;
  /** Which tab occupies slot 1. "live" (default) is today's behavior --
   *  unchanged for any match that's still status === "live" (or upcoming).
   *  "digest" is used once a match has finished: Live no longer makes
   *  sense as a tab (there's no live state left to show), so Digest takes
   *  its place in the same first position instead of being appended as an
   *  extra tab -- that's what keeps the total tab count from drifting
   *  between a finished match with ball data and one without. */
  firstTab?: "live" | "digest";
}

function MatchTabs({ active, onChange, badge, showTable, showDigest, firstTab = "live" }: MatchTabsProps) {
  const TABS: { key: TabKey; label: string }[] = [
    firstTab === "digest"
      ? { key: "digest" as TabKey, label: "Digest" }
      : { key: "live" as TabKey, label: "Live" },
    // Label shortened to "Score" (v1.0.79) -- at equal tab width (needed
    // to fix the uneven-width bug in v1.0.78), "Scorecard" doesn't fit
    // even at zero letter-spacing (measured ~75px vs. the ~56px available
    // inside an 80px-wide tab), so it was truncating to "SCOR...". "Score"
    // fits comfortably (~47px) at the tab bar's normal tracking-widest.
    // The tab's `key` stays "scorecard" -- this only changes the visible
    // label, not the tab identity or the Scorecard component itself.
    { key: "scorecard", label: "Score" },
    // When firstTab is already "digest", don't also append a second Digest
    // tab here -- that's the old standalone-Digest-tab behavior, now folded
    // into slot 1 for finished matches.
    ...(firstTab !== "digest" && showDigest ? [{ key: "digest" as TabKey, label: "Digest" }] : []),
    { key: "info", label: "Info" },
    ...(showTable ? [{ key: "table" as TabKey, label: "Table" }] : []),
  ];
  return (
    <div className="bg-bg/95 backdrop-blur border-b border-line">
      <div className="px-4 flex items-stretch">
        {TABS.map(tab => {
          const isActive = tab.key === active;
          const hasBadge = badge?.tab === tab.key && !isActive;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex-1 min-w-0 px-3 py-3 text-xs font-bold uppercase tracking-widest relative transition-colors text-center truncate ${
                isActive ? "text-cyan" : "text-text-dim hover:text-text-secondary"
              }`}
            >
              {tab.label}
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
