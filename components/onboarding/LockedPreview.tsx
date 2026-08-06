"use client";

// Shown when a user tries to skip step 1 (or step 2) having followed
// NOTHING at all yet -- makes the personalization trade-off visible
// rather than silently letting them through. Per build spec: only shown
// once per step, and never again once at least one follow already
// exists (see TeamPickerStep.tsx/PlayerPickStep.tsx's gating).
export default function LockedPreview({
  onSkipAnyway,
  onGoBack,
}: {
  onSkipAnyway: () => void;
  onGoBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-xl overflow-hidden">
        <div className="blur-md pointer-events-none select-none opacity-70 p-4 space-y-3">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="card p-3 h-20" />
          <div className="card p-3 h-20" />
          <div className="card p-3 h-20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-bg/40">
          <div className="text-sm font-bold text-text-primary text-center px-6">
            Follow a team to unlock this
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={onGoBack} className="text-xs font-bold px-4 py-2 rounded-full bg-cyan text-black">
          Pick a team
        </button>
        <button onClick={onSkipAnyway} className="text-xs font-bold px-4 py-2 rounded-full text-text-dim">
          Skip anyway
        </button>
      </div>
    </div>
  );
}
