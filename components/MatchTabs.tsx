"use client";

export type TabKey = "live" | "scorecard" | "info";

interface MatchTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "scorecard", label: "Scorecard" },
  { key: "info", label: "Info" },
];

export default function MatchTabs({ active, onChange }: MatchTabsProps) {
  return (
    <div className="bg-bg/95 backdrop-blur border-b border-line">
      <div className="px-4 flex items-stretch">
        {TABS.map(tab => {
          const isActive = tab.key === active;
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
