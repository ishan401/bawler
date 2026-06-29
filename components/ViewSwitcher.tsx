"use client";

export type GIFViewMode = "perspective" | "topdown" | "side";

interface ViewSwitcherProps {
  active: GIFViewMode;
  onChange: (mode: GIFViewMode) => void;
}

const MODES: { key: GIFViewMode; label: string; icon: React.ReactNode }[] = [
  {
    key: "perspective",
    label: "3D",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 12L8 3L13 12L8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "topdown",
    label: "Top",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "side",
    label: "Side",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 11C5 7 8 5 13 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
];

/**
 * View-mode switcher beside the GIF.
 *
 * Per Sarthak v0.3 — the user can experiment with different render styles
 * to optimize the GIF. Only 3D-perspective is implemented in v1 (others
 * are stubbed; they fall back to perspective if selected).
 */
export default function ViewSwitcher({ active, onChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-bg-surface border border-line p-1">
      {MODES.map(mode => {
        const isActive = mode.key === active;
        return (
          <button
            key={mode.key}
            onClick={() => onChange(mode.key)}
            className={`px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
              isActive ? "bg-cyan text-bg" : "text-text-dim hover:text-text-primary"
            }`}
            aria-label={`Switch to ${mode.label} view`}
          >
            {mode.icon}
            <span className="text-[9px] font-bold uppercase tracking-widest">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
