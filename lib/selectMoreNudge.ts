// ============================================================================
// "Select more" one-time Home coachmark — v1.0.187
// ============================================================================
// Fires exactly once, ever, per browser/device -- the very first time Home
// is reached after onboarding, regardless of whether onboarding was
// completed in full, partially answered then skipped, or skipped entirely
// from the very first screen. Deliberately a SEPARATE flag from
// bawler:onboardingComplete (lib/onboarding.ts): that flag only tracks
// whether the onboarding FLOW itself is done, not whether this nudge has
// ever been shown, and the two must be able to vary independently (e.g. a
// future reset of one should never accidentally reset the other).
// ============================================================================

const STORAGE_KEY = "bawler_seen_select_more_nudge";

export function hasSeenSelectMoreNudge(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // localStorage unavailable -- fail toward "already seen" rather than
    // risk showing a supposedly-one-time nudge on every visit.
    return true;
  }
}

/** Called the MOMENT the nudge appears on screen, not on dismiss -- per
 * the build spec, so a page refresh mid-display can never cause it to
 * reappear. */
export function markSelectMoreNudgeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // no-op -- the flag just won't persist.
  }
}
