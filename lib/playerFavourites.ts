import { PLAYERS } from "./mockData";
import { getFollowPrefs, setFollowPrefs } from "./followPrefs";

// ============================================================================
// Favourite players — v1.0.125
// ============================================================================
// A second, independent localStorage store, deliberately NOT folded into
// FollowPrefs.players: "favourited" and "followed" are related but distinct
// concepts. Followed (FollowPrefs.players) answers "should this player's
// matches surface in For You / the Players filter". Favourited answers "is
// this someone the user has specifically starred", which additionally:
//   - earns a star badge/ring on their homepage "Your Players" chip
//   - outranks a merely-followed player in that chip strip's sort order
// Same localStorage + CHANGE_EVENT shape as lib/followPrefs.ts (see that
// file's header comment) so a favourite toggled on the player profile page
// (BottomNav/FollowSheet's sibling problem all over again -- the homepage
// isn't a parent of the player profile route) is picked up by the homepage
// without a prop chain or a page reload.
//
// One-way linkage, exactly per spec: favouriting ALWAYS adds the player to
// FollowPrefs.players if they aren't already there (so a user can never
// favourite someone from their profile and then not see them in the
// homepage strip because they forgot to separately check them in the
// Filter sheet). Un-favouriting deliberately does NOT remove them from
// FollowPrefs.players -- the two are not symmetric. See toggleFavouritePlayer.
// ============================================================================

const STORAGE_KEY = "bawler:favouritePlayers";
const CHANGE_EVENT = "bawler:favourite-players-changed";

function validPlayerIds(): Set<string> {
  return new Set(Object.keys(PLAYERS));
}

/** Same self-healing sanitize-on-read pattern as sanitizeFollowPrefs --
 * a stored favourite ID that no longer resolves to a real PLAYERS entry
 * (e.g. mock data was pruned/renamed) is dropped rather than left as a
 * phantom that can never be un-favourited from any UI. */
function sanitizeFavourites(ids: string[]): string[] {
  const valid = validPlayerIds();
  return ids.filter(id => valid.has(id));
}

export function getFavouritePlayers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const clean = sanitizeFavourites(parsed);
    if (clean.length !== parsed.length || clean.some((id, i) => id !== parsed[i])) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch {
        // localStorage unavailable — repaired value just won't persist.
      }
    }
    return clean;
  } catch {
    return [];
  }
}

export function setFavouritePlayers(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — preference just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function isPlayerFavourited(playerId: string, favourites: string[]): boolean {
  return favourites.includes(playerId);
}

export function onFavouritesChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/**
 * The only sanctioned way to flip a player's favourite state. Toggling ON
 * also adds the player to FollowPrefs.players if absent (see file header --
 * this is the "favouriting auto-follows" contract from the spec). Toggling
 * OFF only removes the favourite flag; the follow selection is left exactly
 * as it was, since un-favouriting was never specified to imply
 * un-following, and silently un-following behind the user's back would be
 * a surprising side effect they didn't ask for.
 */
export function toggleFavouritePlayer(playerId: string): boolean {
  const current = getFavouritePlayers();
  const alreadyFavourited = current.includes(playerId);

  if (alreadyFavourited) {
    setFavouritePlayers(current.filter(id => id !== playerId));
    return false;
  }

  setFavouritePlayers([...current, playerId]);

  const prefs = getFollowPrefs();
  if (!prefs.players.includes(playerId)) {
    setFollowPrefs({ ...prefs, players: [...prefs.players, playerId] });
  }
  return true;
}
