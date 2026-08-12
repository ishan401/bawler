"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import type { Team, PlayerProfile } from "@/lib/types";
import {
  buildOnboardingPlayerDeck,
  searchAllPlayers,
  getPlayerMoment,
  roleLabel,
  type PlayerMoment,
} from "@/lib/onboardingPlayers";
import { getFollowPrefs, setFollowPrefs } from "@/lib/followPrefs";
import { ALL_LIVE_MATCHES, NATIONAL_TEAMS } from "@/lib/mockData";
import SwipeCard, { type SwipeCardHandle } from "./SwipeCard";
import PlayerCard from "./PlayerCard";
import PlayerMomentCard from "./PlayerMomentCard";

function toggleFollowPlayer(playerId: string, follow: boolean) {
  const prefs = getFollowPrefs();
  if (follow) {
    if (!prefs.players.includes(playerId)) prefs.players = [...prefs.players, playerId];
  } else {
    prefs.players = prefs.players.filter(id => id !== playerId);
  }
  setFollowPrefs(prefs);
}

// v1.0.200: step 2 rebuilt as a swipe-card deck, matching step 1
// (TeamPickerStep.tsx)'s exact interaction pattern -- same fanned
// card-stack constants/timing, same tap-button fallback for gesture-less
// follow/skip, same per-card entrance animation. See lib/onboardingPlayers.ts
// (buildOnboardingPlayerDeck) for how the up-to-5-player deck itself is
// chosen; this file is purely presentation + the follow/skip/advance wiring.
const STACK_SLOT_STYLE = [
  { rotate: 0, translateX: 0, scale: 1, opacity: 1 }, // front card -- handled by SwipeCard itself
  { rotate: 4, translateX: 7, scale: 0.96, opacity: 0.7 },
  { rotate: 8, translateX: 14, scale: 0.92, opacity: 0.5 },
] as const;
const FRONT_ENTER_MS = 200;

export default function PlayerPickStep({
  followedTeams,
  onComplete,
}: {
  followedTeams: Team[];
  onComplete: (followedPlayerIds: string[]) => void;
}) {
  const deck = useMemo(() => buildOnboardingPlayerDeck(followedTeams), [followedTeams]);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => new Set(getFollowPrefs().players));
  const [activeMoment, setActiveMoment] = useState<{ playerId: string; moment: PlayerMoment } | null>(null);
  const activeHandleRef = useRef<SwipeCardHandle | null>(null);

  const total = deck.length;
  const current = deck[index];

  // Same front-card "arrival" animation as TeamPickerStep.tsx -- skipped
  // on the very first render (nothing is being "promoted" yet).
  const isFirstIndexRender = useRef(true);
  const [frontEntering, setFrontEntering] = useState(false);
  useEffect(() => {
    if (isFirstIndexRender.current) {
      isFirstIndexRender.current = false;
      return;
    }
    setFrontEntering(true);
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFrontEntering(false));
    });
    return () => cancelAnimationFrame(raf1);
  }, [index]);

  function advanceOrFinish(nextFollowedIds: Set<string>) {
    if (index >= total - 1) {
      onComplete([...nextFollowedIds]);
    } else {
      setIndex(i => i + 1);
    }
  }

  function handleSkipCard(player: PlayerProfile) {
    void player; // left-swipe/X: no follow
    advanceOrFinish(followedIds);
  }

  function handleFollowCard(player: PlayerProfile) {
    toggleFollowPlayer(player.id, true);
    const next = new Set(followedIds);
    next.add(player.id);
    setFollowedIds(next);
    // Advance immediately -- the "is this player live/in recent form"
    // moment lookup is async and must not gate the card transition.
    advanceOrFinish(next);
    void (async () => {
      const moment = await getPlayerMoment(player, ALL_LIVE_MATCHES);
      if (moment) setActiveMoment({ playerId: player.id, moment });
    })();
  }

  /** Step-level "Skip" link -- always goes straight to the quiz. No
   * interstitial: the old "Follow a team to unlock this" nudge
   * (LockedPreview.tsx) has been removed platform-wide (see
   * TeamPickerStep.tsx / DECISIONS-LOG.md, v1.0.200). */
  function requestSkipStep() {
    onComplete([...followedIds]);
  }

  // Search bar stays independent of deck progress -- a user can find and
  // follow ANY player at any point, exactly as the old flat-list screen
  // let them. Rendered as its own results list, replacing the deck view
  // only while a query is active; clearing the query resumes the deck
  // exactly where it was (index/state untouched by searching).
  const searchResults = useMemo(() => {
    const q = query.trim();
    return q.length > 0 ? searchAllPlayers(q) : [];
  }, [query]);
  const searching = query.trim().length > 0;

  async function handleToggleSearchResult(player: PlayerProfile) {
    const nowFollowed = !followedIds.has(player.id);
    toggleFollowPlayer(player.id, nowFollowed);
    const next = new Set(followedIds);
    if (nowFollowed) next.add(player.id);
    else next.delete(player.id);
    setFollowedIds(next);
    if (nowFollowed) {
      const moment = await getPlayerMoment(player, ALL_LIVE_MATCHES);
      if (moment) setActiveMoment({ playerId: player.id, moment });
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-text-dim">
          {total > 0 ? `${index + 1} of ${total} players` : "Pick your players"}
        </div>
        <button onClick={requestSkipStep} className="onboarding-skip-pill text-xs font-bold text-text-dim">
          Skip
        </button>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search any player..."
        className="w-full rounded-full bg-white/[0.06] px-4 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none"
      />

      {searching ? (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-thin">
          {searchResults.length === 0 && (
            <div className="text-xs text-text-dim text-center py-6">No players match your search.</div>
          )}
          {searchResults.map(player => {
            const followed = followedIds.has(player.id);
            const nation = player.teamCode ? NATIONAL_TEAMS[player.teamCode] : undefined;
            const tagLine = [nation?.shortName, roleLabel(player)].filter(Boolean).join(" · ");
            return (
              <div key={player.id} className="onboarding-row flex items-center justify-between p-3">
                <div className="flex flex-col">
                  <div className="text-sm font-bold text-text-primary">{player.shortName}</div>
                  <div className="text-[10px] text-text-dim">{tagLine}</div>
                </div>
                <button
                  onClick={() => handleToggleSearchResult(player)}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors shrink-0"
                  style={{
                    background: followed ? "#00E5FF22" : "rgba(255,255,255,0.06)",
                    color: followed ? "#00E5FF" : "var(--text-secondary, #94A3B8)",
                  }}
                >
                  {followed ? "✓ Following" : "+ Follow"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-4">
          {current ? (
            <>
              <div className="relative h-[420px]">
                {[2, 1, 0].map(offset => {
                  const p = deck[index + offset];
                  if (!p) return null;
                  const isTop = offset === 0;
                  const slot = STACK_SLOT_STYLE[offset];

                  if (!isTop) {
                    // Background placeholder -- same purely-decorative,
                    // content-free treatment as TeamPickerStep.tsx.
                    return (
                      <div
                        key={`slot-${offset}`}
                        className="absolute inset-0 onboarding-card h-[420px]"
                        style={{
                          transform: `translateX(${slot.translateX}px) rotate(${slot.rotate}deg) scale(${slot.scale})`,
                          opacity: slot.opacity,
                          zIndex: 10 - offset,
                        }}
                      />
                    );
                  }

                  const enterStyle: React.CSSProperties = frontEntering
                    ? { transform: "scale(0.96) rotate(4deg)", opacity: 0, transition: "none" }
                    : { transform: "scale(1) rotate(0deg)", opacity: 1, transition: `transform ${FRONT_ENTER_MS}ms ease-out, opacity ${FRONT_ENTER_MS}ms ease-out` };

                  return (
                    <div key="slot-0" className="absolute inset-0" style={{ zIndex: 10, ...enterStyle }}>
                      {/* Keyed by player id (not the fixed "slot-0" position)
                          for the same reason TeamPickerStep.tsx's own comment
                          documents: without a per-player key, React would
                          reuse one SwipeCard instance across every player
                          that passes through the front slot, letting its
                          internal drag/exit state leak from the outgoing
                          card into the incoming one. */}
                      <SwipeCard
                        key={p.id}
                        active={isTop}
                        onSwipeRight={() => handleFollowCard(p)}
                        onSwipeLeft={() => handleSkipCard(p)}
                        registerHandle={isTop ? h => { activeHandleRef.current = h; } : undefined}
                      >
                        <PlayerCard player={p} />
                      </SwipeCard>
                    </div>
                  );
                })}
              </div>

              {/* Always-visible tap controls -- same reasoning as step 1:
                  works with zero dependency on swipe/drag gesture support. */}
              <div className="flex items-center justify-center gap-8 pt-2">
                <button
                  onClick={() => activeHandleRef.current?.swipeLeft()}
                  aria-label="Skip this player"
                  className="onboarding-icon-btn onboarding-icon-btn-negative text-negative tap-scale"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="5" x2="19" y2="19" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                  </svg>
                </button>
                <button
                  onClick={() => activeHandleRef.current?.swipeRight()}
                  aria-label="Follow this player"
                  className="onboarding-icon-btn onboarding-icon-btn-positive text-cyan tap-scale"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.2 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-text-dim text-center py-6">
              No players found for your followed teams -- search for anyone above, or tap Skip to continue.
            </div>
          )}
        </div>
      )}

      {activeMoment && (
        <div className="fixed inset-x-0 bottom-0 p-4 z-50 flex justify-center">
          <div className="w-full max-w-md">
            <PlayerMomentCard moment={activeMoment.moment} onContinue={() => setActiveMoment(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
