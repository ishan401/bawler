"use client";
import { memo } from "react";

export type TabKey = "live" | "scorecard" | "info";

export interface TabBadge {
  tab: TabKey;
  type: "wicket" | "six";
}

interface MatchTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  badge?: TabBadge | null;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "scorecard", label: "Scorecard" },
  { key: "info", label: "Info" },
];

function MatchTabs({ active, onChange, badge }: MatchTabsProps) {
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
              className={`flex-1 px-3 py-3 text-xs font-bold uppercase tracking-widest relative transition-colors ${
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
