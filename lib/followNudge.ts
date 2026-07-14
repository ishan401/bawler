// ============================================================================
// Empty-state "follow a team" nudge — v1.0.52
// ============================================================================
// Shown on Home only while ALL of these hold: the user has never followed
// anything, they haven't dismissed it, and they're still within their first
// few sessions. No permanent reserved space — once the window passes (or
// it's dismissed, or anything gets followed), it stops appearing for good.
// The Filter button in the bottom nav is the permanent entry point either
// way; this nudge is just a one-time nudge toward discovering it.
// ============================================================================

const VISIT_COUNT_KEY = "bawler:homeVisitCount";
const DISMISSED_KEY = "bawler:followNudgeDismissed";

export const NUDGE_MAX_SESSIONS = 3;

/** Call once per Home mount. Returns the running visit count (1-indexed). */
export function registerHomeVisit(): number {
  if (typeof window === "undefined") return NUDGE_MAX_SESSIONS + 1;
  try {
    const n = parseInt(window.localStorage.getItem(VISIT_COUNT_KEY) ?? "0", 10) + 1;
    window.localStorage.setItem(VISIT_COUNT_KEY, String(n));
    return n;
  } catch {
    return NUDGE_MAX_SESSIONS + 1;
  }
}

export function isNudgeDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissNudge(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // no-op
  }
}
