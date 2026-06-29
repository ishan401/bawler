"use client";

interface PressureGaugeProps {
  level: number; // 0..10
  trend: "rising" | "falling" | "steady";
}

export default function PressureGauge({ level, trend }: PressureGaugeProps) {
  const pct = Math.min(100, level * 10);
  const color =
    level > 7.5 ? "#EF4444" : level > 5.5 ? "#FF6B35" : level > 3 ? "#FBBF24" : "#10B981";
  const label =
    level > 7.5 ? "Doomed" : level > 5.5 ? "Tense" : level > 3 ? "Even" : "Comfortable";

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim">Pressure</h3>
        <TrendIcon trend={trend} />
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-extrabold num" style={{ color }}>{level.toFixed(1)}</span>
        <span className="text-text-dim text-xs num">/ 10</span>
      </div>
      <div className="text-sm font-semibold mb-3" style={{ color }}>{label}</div>
      <div className="relative h-2 bg-line rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #10B981 0%, #FBBF24 50%, #EF4444 100%)` }}
        />
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: "rising" | "falling" | "steady" }) {
  if (trend === "rising") {
    return (
      <span className="text-wicket text-xs font-semibold flex items-center gap-0.5">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="2" />
        </svg>
        rising
      </span>
    );
  }
  if (trend === "falling") {
    return (
      <span className="text-boundary text-xs font-semibold flex items-center gap-0.5">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" />
        </svg>
        falling
      </span>
    );
  }
  return <span className="text-text-dim text-xs">steady</span>;
}
