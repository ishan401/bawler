"use client";
import { useState, useMemo } from "react";
import type { Team, PlayerProfile } from "@/lib/types";
import { getRelevantPlayers, searchAllPlayers, getPlayerMoment, roleLabel, type PlayerMoment } from "@/lib/onboardingPlayers";
import { getFollowPrefs, setFollowPrefs } from "@/lib/followPrefs";
import { ALL_LIVE_MATCHES } from "@/lib/mockData";
import LockedPreview from "./LockedPreview";
import PlayerMomentCard from "./PlayerMomentCard";

interface Row {
  player: PlayerProfile;
  affiliations: string[];
}

function isFollowed(playerId: string): boolean {
  return getFollowPrefs().players.includes(playerId);
}

function toggleFollowPlayer(playerId: string, follow: boolean) {
  const prefs = getFollowPrefs();
  if (follow) {
    if (!prefs.players.includes(playerId)) prefs.players = [...prefs.players, playerId];
  } else {
    prefs.players = prefs.players.filter(id => id !== playerId);
  }
  setFollowPrefs(prefs);
}

export default function PlayerPickStep({
  followedTeams,
  onComplete,
  lockedPreviewShown,
  markLockedPreviewShown,
}: {
  followedTeams: Team[];
  onComplete: () => void;
  lockedPreviewShown: boolean;
  markLockedPreviewShown: () => void;
}) {
  const relevant = useMemo(() => getRelevantPlayers(followedTeams), [followedTeams]);
  const [query, setQuery] = useState("");
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => new Set(getFollowPrefs().players));
  const [activeMoment, setActiveMoment] = useState<{ playerId: string; moment: PlayerMoment } | null>(null);
  const [showLockedPreview, setShowLockedPreview] = useState(false);

  const rows: Row[] = useMemo(() => {
    const byId = new Map<string, Row>();
    for (const r of relevant) byId.set(r.player.id, { player: r.player, affiliations: r.affiliations });
    if (query.trim().length > 0) {
      for (const p of searchAllPlayers(query)) {
        if (!byId.has(p.id)) byId.set(p.id, { player: p, affiliations: [] });
      }
      // While searching, only show rows that actually match the query OR
      // were already relevant -- otherwise the whole relevant list stays
      // visible underneath every keystroke, which reads as "search is
      // broken" even though it technically still deduplicates correctly.
      const q = query.trim().toLowerCase();
      for (const [id, row] of [...byId.entries()]) {
        const matches = row.player.name.toLowerCase().includes(q) || row.player.shortName.toLowerCase().includes(q);
        if (!matches) byId.delete(id);
      }
    }
    return [...byId.values()];
  }, [relevant, query]);

  async function handleToggle(row: Row) {
    const nowFollowed = !followedIds.has(row.player.id);
    toggleFollowPlayer(row.player.id, nowFollowed);
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (nowFollowed) next.add(row.player.id);
      else next.delete(row.player.id);
      return next;
    });
    if (nowFollowed) {
      const moment = await getPlayerMoment(row.player, ALL_LIVE_MATCHES);
      if (moment) setActiveMoment({ playerId: row.player.id, moment });
    }
  }

  function requestFinish() {
    const anyoneFollowedAtAll = followedTeams.length > 0 || followedIds.size > 0;
    if (!anyoneFollowedAtAll && !lockedPreviewShown) {
      setShowLockedPreview(true);
      markLockedPreviewShown();
    } else {
      onComplete();
    }
  }

  if (showLockedPreview) {
    return <LockedPreview onGoBack={() => setShowLockedPreview(false)} onSkipAnyway={onComplete} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-text-dim">Pick your players</div>
        <button onClick={requestFinish} className="text-xs font-bold text-text-dim">
          {followedIds.size > 0 ? "Continue" : "Skip"}
        </button>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search any player..."
        className="w-full rounded-full bg-white/[0.06] px-4 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none"
      />

      <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto scrollbar-thin">
        {rows.length === 0 && (
          <div className="text-xs text-text-dim text-center py-6">
            {query ? "No players match your search." : "Follow a team in the previous step to see suggestions here, or search for anyone."}
          </div>
        )}
        {rows.map(row => {
          const followed = followedIds.has(row.player.id);
          const tagLine = [...row.affiliations, roleLabel(row.player)].join(" · ");
          return (
            <div key={row.player.id} className="card flex items-center justify-between p-3">
              <div className="flex flex-col">
                <div className="text-sm font-bold text-text-primary">{row.player.shortName}</div>
                <div className="text-[10px] text-text-dim">{tagLine}</div>
              </div>
              <button
                onClick={() => handleToggle(row)}
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
