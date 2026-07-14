// ============================================================================
// Followed-team preference — v1.0.49
// ============================================================================
// No account system exists yet, so this is a deliberately simple
// localStorage-backed preference (client-only) rather than a real per-user
// setting. Defaults to India. Powers the homepage "For you" row.
// ============================================================================

const STORAGE_KEY = "bawler:followedTeam";
export const DEFAULT_FOLLOWED_TEAM = "IND";

// Curated shortlist for the inline picker — national teams with the deepest
// mock-data coverage (reuses the same codes as page.tsx's popularity table).
export const FOLLOWABLE_TEAMS: string[] = [
  "IND", "AUS", "ENG", "PAK", "SA", "NZ", "WI", "SL", "BAN", "AFG",
];

export function getFollowedTeamCode(): string {
  if (typeof window === "undefined") return DEFAULT_FOLLOWED_TEAM;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_FOLLOWED_TEAM;
  } catch {
    return DEFAULT_FOLLOWED_TEAM;
  }
}

export function setFollowedTeamCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // localStorage unavailable (private browsing, etc.) — preference just
    // won't persist across reloads; not worth surfacing an error for this.
  }
}
