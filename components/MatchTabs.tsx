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
}

function MatchTabs({ active, onChange, badge, showTable, showDigest }: MatchTabsProps) {
  const TABS: { key: TabKey; label: string }[] = [
    { key: "live", label: "Live" },
    { key: "scorecard", label: "Scorecard" },
    ...(showDigest ? [{ key: "digest" as TabKey, label: "Digest" }] : []),
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
