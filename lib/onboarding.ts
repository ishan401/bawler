// ============================================================================
// First-run onboarding — completion gate (v1.0.165)
// ============================================================================
// Trigger contract (see DECISIONS-LOG.md v1.0.165 for the full writeup):
//   Show onboarding once, and only once, to a genuinely brand-new user --
//   someone with ZERO saved follow preferences. An existing user (anyone
//   who used the app before this feature shipped, or who already
//   followed something) must never see it, and a brand-new user who
//   skips every single step of onboarding (ending up with zero follows
//   anyway) must also never see it again on their next open.
//
// That second requirement is why this can't be "show onboarding whenever
// hasAnyFollow(prefs) is false" alone -- that would repeat forever for a
// skip-everything user, since skipping never gives them any follows to
// suppress it. A separate, explicit completion flag is required
// alongside the existing hasAnyFollow() check:
//
//   shouldShowOnboarding() = !isOnboardingComplete() && !hasAnyFollow(getFollowPrefs())
//
// An existing pre-feature user is excluded by hasAnyFollow() alone (they
// already have follows) -- isOnboardingComplete() defaults to false for
// them and is simply never consulted meaningfully, since the hasAnyFollow
// half of the AND already blocks the flow. A brand-new user who
// completes OR skips onboarding gets markOnboardingComplete() called
// unconditionally at the end of the flow (see components/onboarding/
// OnboardingFlow.tsx), regardless of whether they end up with any follows
// -- that's what stops onboarding from reappearing for the skip-
// everything case.
// ============================================================================

import { getFollowPrefs, hasAnyFollow } from "./followPrefs";

const STORAGE_KEY = "bawler:onboardingComplete";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // localStorage unavailable -- the flag just won't persist. Onboarding
    // would then show again next open, which is the safe failure
    // direction (re-showing a skippable flow) rather than the unsafe one
    // (silently never letting a real new user onboard).
  }
}

/**
 * The one function anything that might redirect to /onboarding should
 * call. Deliberately re-derives from the two underlying signals every
 * time rather than caching -- this is a cheap synchronous localStorage
 * read, called once per app/page.tsx mount, not a hot path.
 */
export function shouldShowOnboarding(): boolean {
  if (isOnboardingComplete()) return false;
  return !hasAnyFollow(getFollowPrefs());
}
