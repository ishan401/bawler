"use client";

interface DemoControlsProps {
  currentBallIdx: number;
  totalBalls: number;
  isPlaying: boolean;
  speedMs: number;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSpeedChange: (ms: number) => void;
  onJumpToLatest: () => void;
}

export default function DemoControls({
  currentBallIdx,
  totalBalls,
  isPlaying,
  speedMs,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onSpeedChange,
  onJumpToLatest,
}: DemoControlsProps) {
  const progress = totalBalls > 0 ? ((currentBallIdx + 1) / totalBalls) * 100 : 0;
  const speeds = [10000, 5000, 2000, 500];
  const speedLabel = speedMs >= 10000 ? "1×" : speedMs >= 5000 ? "2×" : speedMs >= 2000 ? "5×" : "20×";

  return (
    <div className="card-elevated p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-orange font-bold">Demo</span>
          <span className="text-xs text-text-secondary num">Ball {currentBallIdx + 1} / {totalBalls}</span>
        </div>
        <button
          onClick={onJumpToLatest}
          className="text-[10px] uppercase tracking-widest font-bold text-cyan hover:text-text-primary transition"
        >
          Jump to latest
        </button>
      </div>

      <div className="relative h-1 bg-line rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-cyan rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onStepBack}
            className="w-8 h-8 rounded-lg bg-bg border border-line hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition flex items-center justify-center"
            aria-label="Previous ball"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 17L6 12L11 7M18 17L13 12L18 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-lg bg-cyan text-bg hover:scale-105 transition flex items-center justify-center font-bold"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4l14 8-14 8V4z" />
              </svg>
            )}
          </button>
          <button
            onClick={onStepForward}
            className="w-8 h-8 rounded-lg bg-bg border border-line hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition flex items-center justify-center"
            aria-label="Next ball"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 17L11 12L6 7M13 17L18 12L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {speeds.map(s => {
            const label = s >= 10000 ? "1×" : s >= 5000 ? "2×" : s >= 2000 ? "5×" : "20×";
            const active = s === speedMs;
            return (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition ${
                  active ? "bg-cyan text-bg" : "bg-bg text-text-dim hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
