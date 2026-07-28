"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { getFollowPrefs, onFollowPrefsChanged, emptyFollowPrefs, type FollowPrefs } from "@/lib/followPrefs";
import { getFavouritePlayers, onFavouritesChanged, isPlayerFavourited } from "@/lib/playerFavourites";
import { liveActivitySignature } from "@/lib/playerActivity";
import { getYourPlayers, type YourPlayerEntry } from "@/lib/yourPlayers";
import { formatPlayerName } from "@/lib/playerName";
import PlayerAvatar from "./PlayerAvatar";

// ============================================================================
// "Your Players" homepage strip — v1.0.125
// ============================================================================
// Placed on the homepage directly below Spotlight, above Past/Coming Up.
// Renders NOTHING (not even a heading) when the user has zero players
// selected in the Filter sheet's Players tab -- no empty-state placeholder,
// per spec.
//
// `useYourPlayers` is exported (not just the default component) for the
// same reason usePlayerFormState/useScheduleTab/useMatchAccentColors are:
// it's directly mountable with react-test-renderer for recomputation tests
// without needing to render the whole page or mock next/navigation. See
// DECISIONS-LOG.md v1.0.125 for the "player starts/stops being live mid-
// session, without a page reload" test built against this hook.
//
// Reactive on THREE independent inputs, each subscribed the same
// sibling-component way FollowPrefs already is elsewhere on this page
// (BottomNav's FollowSheet, and the player profile page's favourite
// toggle, are both siblings of this component, not parents):
//   1. FollowPrefs.players (Filter sheet Players tab)
//   2. the favourite-players store (player profile page's star toggle)
//   3. `liveMatches` (passed in by the caller, e.g. ALL_LIVE_MATCHES) --
//      memoized via liveActivitySignature, a field-based signature, NOT
//      the array/object reference, per the replace-not-mutate contract
//      (ARCHITECTURE.md / DECISIONS-LOG.md v1.0.104-109). This is what
//      makes the sort recompute the instant a player's live status
//      changes, rather than only on next mount.
// ============================================================================

export function useYourPlayers(liveMatches: Match[]): YourPlayerEntry[] {
  const [followPrefs, setFollowPrefsState] = useState<FollowPrefs>(emptyFollowPrefs());
  useEffect(() => {
    setFollowPrefsState(getFollowPrefs());
    return onFollowPrefsChanged(() => setFollowPrefsState(getFollowPrefs()));
  }, []);

  const [favourites, setFavourites] = useState<string[]>([]);
  useEffect(() => {
    setFavourites(getFavouritePlayers());
    return onFavouritesChanged(() => setFavourites(getFavouritePlayers()));
  }, []);

  const followedKey = followPrefs.players.join(",");
  const favouritesKey = favourites.join(",");
  const liveKey = liveActivitySignature(liveMatches);

  return useMemo(
    () => getYourPlayers(followPrefs.players, favourites, liveMatches),
    // Deliberately keyed on primitive, field-derived strings rather than
    // the followPrefs/favourites/liveMatches array references themselves --
    // each of those gets a brand-new array on every change notification
    // regardless of whether the actual IDs/live-status differ, which is
    // exactly the object-identity trap useMatchAccentColors originally fell
    // into (see DECISIONS-LOG.md v1.0.104-109).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followedKey, favouritesKey, liveKey]
  );
}

function PlayerChip({ entry }: { entry: YourPlayerEntry }) {
  const { player, isFavourited } = entry;
  // v1.0.129: the photo/initials fallback itself now lives in the shared
  // <PlayerAvatar>, reused (not re-implemented) by the Digest tab's MOM
  // card and the player profile page header -- this component only owns
  // the favourited-ring styling on top of it, via ringColor/textColor.
  return (
    <Link
      href={`/player/${player.id}`}
      className="tap-scale flex flex-col items-center gap-1 shrink-0 w-16"
    >
      <div className="relative">
        <PlayerAvatar
          name={player.name}
          imageUrl={player.imageUrl}
          sizePx={48}
          ringColor={isFavourited ? "#FBBF24" : "var(--line)"}
          textColor={isFavourited ? "#FBBF24" : "var(--text-dim)"}
          borderWidthPx={isFavourited ? 2 : 1.5}
        />
        {isFavourited && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] bg-bg-base"
            style={{ border: "1px solid #FBBF24" }}
            aria-label="Favourited"
          >
            ⭐
          </span>
        )}
      </div>
      <span className="text-[10px] font-semibold text-text-primary text-center leading-tight truncate w-full">
        {formatPlayerName(player.name)}
      </span>
    </Link>
  );
}

export default function YourPlayersStrip({ liveMatches }: { liveMatches: Match[] }) {
  const entries = useYourPlayers(liveMatches);

  if (entries.length === 0) return null;

  return (
    <section className="mt-3">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5 px-3">
        Your Players
      </h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-3 pb-1">
        {entries.map(entry => (
          <PlayerChip key={entry.player.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
