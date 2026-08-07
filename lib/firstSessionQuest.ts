// ============================================================================
// First-session quest — floating checklist state (v1.0.165)
// ============================================================================
// Backs the small floating checklist shown on the home screen immediately
// after onboarding's reveal step. Exactly three items, fixed set, no
// provider for more later -- see components/FirstSessionQuest.tsx for the
// rendering side. State lives in localStorage (same convention as
// lib/followPrefs.ts/lib/onboarding.ts) so it survives the app being
// closed mid-checklist, per the explicit test requirement for this
// feature.
//
// "followTeam" is evaluated from the REAL follow-prefs state at the
// moment the quest is first initialized (see initFirstSessionQuest(),
// called once at the end of onboarding's reveal step) rather than being
// unconditionally hardcoded to `true` -- the spec's own example assumes
// the common case (a user who actually followed a team in step 1), but a
// user who skipped every step of onboarding entirely must not see a
// pre-checked item that doesn't reflect anything they actually did.
//
// "openLiveMatch" / "readPitchReport" are marked by real app actions,
// wherever they occur (see markQuestItem() call sites in
// components/MatchView.tsx and components/InfoTab.tsx) -- deliberately
// loose triggers: any visit to a live match's page counts as "open a
// live match" regardless of which tab it lands on, and any render of a
// match's pitch report card counts as "read a pitch report," no
// dwell-time/scroll requirement. See DECISIONS-LOG.md v1.0.165 for why
// this looser bar was chosen over a stricter engagement-based one.
//
// v1.0.173 -- per-item "has its completion animation played yet" tracking
// (followTeamAnimated/openLiveMatchAnimated/readPitchReportAnimated).
// Added because the checklist widget only ever mounts on the home screen
// (components/FirstSessionQuest.tsx), but two of the three items above
// are marked complete from OTHER pages entirely -- by the time the user
// navigates back home, the item already reads as checked and the
// checklist's live "just transitioned" detection (which only compares
// states observed while it stays mounted) never gets a chance to see the
// unchecked -> checked moment at all. These three flags are what let a
// freshly-mounted checklist tell "this item finished before I ever
// mounted, and I've already shown its celebration" apart from "this item
// finished before I ever mounted, and I owe it a catch-up celebration
// right now." Each starts false and flips permanently true the moment
// its item's animation actually plays (live or catch-up), never reset.
// ============================================================================

export interface FirstSessionQuestState {
  followTeam: boolean;
  openLiveMatch: boolean;
  readPitchReport: boolean;
  /** Per-item "has this item's own draw-in + ring-pulse celebration
   * already played?" -- see the v1.0.173 header comment above. Distinct
   * from `completionAnimated` below, which is a single whole-quest
   * ("all three done") celebration flag, not per-item. */
  followTeamAnimated: boolean;
  openLiveMatchAnimated: boolean;
  readPitchReportAnimated: boolean;
  /** User closed the card via its own close icon before completing it. */
  dismissed: boolean;
  /** The card has already shown its "all three done" celebration once --
   * once true, the card never renders again even though isQuestComplete()
   * would still be true, so re-opening the app after finishing doesn't
   * re-surface a checklist that has nothing left to do. */
  completionAnimated: boolean;
  /** Whether initFirstSessionQuest() has ever run -- distinguishes "this
   * user never went through onboarding at all" (quest should never
   * appear) from "this user went through onboarding and every item is
   * still legitimately false" (quest should appear, all unchecked). */
  initialized: boolean;
}

export type FirstSessionQuestItem = "followTeam" | "openLiveMatch" | "readPitchReport";

/** Maps each quest item to the state key tracking whether ITS OWN
 * completion animation has already played. Kept as a lookup table rather
 * than three separate switch statements at each call site. */
const ANIMATED_KEY_FOR: Record<FirstSessionQuestItem, "followTeamAnimated" | "openLiveMatchAnimated" | "readPitchReportAnimated"> = {
  followTeam: "followTeamAnimated",
  openLiveMatch: "openLiveMatchAnimated",
  readPitchReport: "readPitchReportAnimated",
};

const STORAGE_KEY = "bawler:firstSessionQuest";
const CHANGE_EVENT = "bawler:first-session-quest-changed";

function emptyState(): FirstSessionQuestState {
  return {
    followTeam: false,
    openLiveMatch: false,
    readPitchReport: false,
    followTeamAnimated: false,
    openLiveMatchAnimated: false,
    readPitchReportAnimated: false,
    dismissed: false,
    completionAnimated: false,
    initialized: false,
  };
}

export function getFirstSessionQuest(): FirstSessionQuestState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const merged: FirstSessionQuestState = { ...emptyState(), ...parsed };
    // Migration (v1.0.173): the three `*Animated` flags are new -- state
    // persisted before this version won't have them in `parsed` at all.
    // For an item that was already true under the old shape, treat it as
    // already-animated rather than a fresh catch-up candidate, so a
    // returning user doesn't get a backdated celebration for something
    // they finished in a session before this per-item tracking existed.
    // An item that's still false is unaffected either way -- nothing to
    // animate yet regardless of this flag's value.
    (Object.keys(ANIMATED_KEY_FOR) as FirstSessionQuestItem[]).forEach(item => {
      const animatedKey = ANIMATED_KEY_FOR[item];
      if (!(animatedKey in parsed) && merged[item]) {
        merged[animatedKey] = true;
      }
    });
    return merged;
  } catch {
    return emptyState();
  }
}

function persist(state: FirstSessionQuestState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable -- progress just won't persist this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onFirstSessionQuestChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/**
 * Called exactly once, at the end of onboarding's reveal step (whether
 * the user completed every step or skipped everything). `followedAnyTeam`
 * should be the REAL outcome of step 1 -- true only if at least one team
 * was actually followed -- never hardcoded.
 */
export function initFirstSessionQuest(followedAnyTeam: boolean): void {
  const state: FirstSessionQuestState = {
    ...emptyState(),
    followTeam: followedAnyTeam,
    initialized: true,
  };
  persist(state);
}

export function markQuestItem(item: FirstSessionQuestItem): void {
  const current = getFirstSessionQuest();
  if (!current.initialized || current.dismissed || current[item]) return; // nothing to do
  persist({ ...current, [item]: true });
}

export function dismissFirstSessionQuest(): void {
  const current = getFirstSessionQuest();
  if (current.dismissed) return;
  persist({ ...current, dismissed: true });
}

export function markCompletionAnimated(): void {
  const current = getFirstSessionQuest();
  if (current.completionAnimated) return;
  persist({ ...current, completionAnimated: true });
}

/** Whether `item`'s OWN completion animation has already played -- see
 * the v1.0.173 header comment. Used by the checklist component both for
 * its live-transition path and its on-mount catch-up path, so an item
 * never animates twice regardless of which path caught it. */
export function isItemAnimated(state: FirstSessionQuestState, item: FirstSessionQuestItem): boolean {
  return state[ANIMATED_KEY_FOR[item]];
}

/** Call the moment `item`'s completion animation actually starts playing
 * (live or catch-up) -- persists immediately so even a fast subsequent
 * remount (or the same mount re-rendering) can't replay it. */
export function markItemAnimated(item: FirstSessionQuestItem): void {
  const current = getFirstSessionQuest();
  const animatedKey = ANIMATED_KEY_FOR[item];
  if (current[animatedKey]) return;
  persist({ ...current, [animatedKey]: true });
}

export function isQuestComplete(state: FirstSessionQuestState): boolean {
  return state.followTeam && state.openLiveMatch && state.readPitchReport;
}

/** Whether the floating card should render at all right now. */
export function shouldShowFirstSessionQuest(state: FirstSessionQuestState): boolean {
  if (!state.initialized) return false;
  if (state.dismissed) return false;
  if (isQuestComplete(state) && state.completionAnimated) return false;
  return true;
}
