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

// v1.0.188: registerHomeVisit() must only be called once app/page.tsx has
// confirmed this is a genuine, resolved Home visit -- i.e. AFTER its
// isBooting/redirectPending gates both clear, exactly like
// lib/selectMoreNudge.ts's own one-time flag is gated. A brand-new user
// visiting "/" for the first time causes app/page.tsx to mount, synchronously
// discover shouldShowOnboarding() === true, and call router.replace(
// "/onboarding") -- but that fleeting pre-redirect mount still runs every
// bare `useEffect(() => {...}, [])` in the component before the navigation
// actually completes, including (before this fix) this one. That meant a
// brand-new user's very first REAL Home visit (the one after finishing
// onboarding) was already being counted as visit #2, not #1, permanently
// off-by-one for their whole first-few-sessions window -- shortening the
// number of real sessions this nudge (and any future visit-count-gated
// feature) actually gets to appear by one. Calling this only once the
// caller has confirmed a resolved visit fixes it at the source, rather than
// papering over it by loosening NUDGE_MAX_SESSIONS or any comparison here.
/** Call once per RESOLVED Home visit (never on a fleeting pre-onboarding-
 * redirect mount). Returns the running visit count (1-indexed). */
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
