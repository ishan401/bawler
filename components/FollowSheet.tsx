"use client";

import React, { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import { NATIONAL_TEAMS, ALL_TEAMS, COMPETITIONS, PLAYERS } from "@/lib/mockData";
import type { MatchFormat } from "@/lib/types";
import {
  type FollowPrefs,
  type FollowCategory,
  emptyFollowPrefs,
  getFollowPrefs,
  setFollowPrefs,
} from "@/lib/followPrefs";

// Same ISO mapping used elsewhere (MatchCard/SplitTeamBg) — small enough
// that duplicating it per-file matches the existing repo convention.
const FLAG_ISO: Record<string, string> = {
  IND: "in", AUS: "au", ENG: "gb-eng", PAK: "pk", SA: "za",
  NZ: "nz", BAN: "bd", SL: "lk", AFG: "af", WI: "tt",
  IRE: "ie", ZIM: "zw", SCO: "gb-sct", NED: "nl", USA: "us",
  UAE: "ae", NAM: "na", PNG: "pg", OMA: "om", CAN: "ca",
  KEN: "ke", UGA: "ug",
};

interface Option {
  id: string;
  label: string;
  sublabel?: string;
  color?: string;
  flagIso?: string;
}

const FORMAT_OPTIONS: Option[] = [
  { id: "T20", label: "T20" },
  { id: "T20I", label: "T20I" },
  { id: "ODI", label: "ODI" },
  { id: "Test", label: "Test" },
  { id: "Hundred", label: "The Hundred" },
];

const CATEGORY_META: { key: FollowCategory; label: string }[] = [
  { key: "nations", label: "Nation" },
  { key: "teams", label: "Team" },
  { key: "tournaments", label: "Tournament" },
  { key: "players", label: "Player" },
  { key: "formats", label: "Format" },
];

function buildOptions(category: FollowCategory): Option[] {
  switch (category) {
    case "nations":
      return Object.values(NATIONAL_TEAMS)
        .map(t => ({ id: t.country ?? t.code, label: t.fullName, color: t.primaryColor, flagIso: FLAG_ISO[t.code] }))
        .sort((a, b) => a.label.localeCompare(b.label));
    case "teams":
      // Scoped to franchise/league teams only. National teams are
      // deliberately excluded here -- Nation is already the dedicated
      // place to follow a country, so listing e.g. Australia under both
      // Nation and Team ("National team") was pure duplication, not an
      // intentional second path to the same entity.
      return Object.values(ALL_TEAMS)
        .filter(t => t.type !== "national")
        .map(t => ({
          id: t.code,
          label: t.fullName,
          sublabel: "Franchise",
          color: t.primaryColor,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    case "tournaments":
      return Object.values(COMPETITIONS)
        .map(c => ({ id: c.id, label: c.name, sublabel: c.shortName, color: c.logoColor }))
        .sort((a, b) => a.label.localeCompare(b.label));
    case "players":
      return Object.values(PLAYERS)
        .map(p => {
          const teamCode = p.franchiseCode ?? p.teamCode;
          const color = teamCode ? ALL_TEAMS[teamCode]?.primaryColor : undefined;
          return { id: p.id, label: p.name, sublabel: p.nationality, color };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    case "formats":
      return FORMAT_OPTIONS;
  }
}

function Swatch({ color, flagIso }: { color?: string; flagIso?: string }) {
  if (flagIso) {
    return (
      <img
        src={`https://flagcdn.com/w40/${flagIso}.png`}
        alt=""
        width={20}
        height={15}
        className="rounded-[2px] shrink-0 shadow-sm"
        style={{ objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/10"
      style={{ background: color ?? "#334155" }}
    />
  );
}

function CheckIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-colors"
      style={{
        background: selected ? "#7C3AED" : "transparent",
        borderColor: selected ? "#7C3AED" : "var(--line)",
      }}
    >
      {selected && (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5L6.2 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export default function FollowSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Draft state — nothing here touches real storage until "Follow" is
  // tapped. Re-initialized from whatever's actually saved every time the
  // sheet opens, so re-opening shows current follows, and backing out
  // (backdrop/close/back-swipe) without confirming discards any edits.
  const [draft, setDraft] = useState<FollowPrefs>(emptyFollowPrefs());
  const [activeCategory, setActiveCategory] = useState<FollowCategory>("nations");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(getFollowPrefs());
      setActiveCategory("nations");
      setSearch("");
    }
  }, [open]);

  const options = useMemo(() => buildOptions(activeCategory), [activeCategory]);
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q));
  }, [options, search]);

  const totalSelected =
    draft.nations.length + draft.teams.length + draft.tournaments.length + draft.players.length + draft.formats.length;

  function toggle(id: string) {
    setDraft(prev => {
      const list = prev[activeCategory] as string[];
      const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
      return { ...prev, [activeCategory]: next };
    });
  }

  function handleFollow() {
    setFollowPrefs(draft);
    onClose();
  }

  if (!open) return null;

  return (
    <BottomSheet
      title="Follow your cricket"
      subtitle={`${totalSelected} selected`}
      onClose={onClose}
      footer={
        <button
          onClick={handleFollow}
          className="w-full py-3.5 text-sm font-extrabold uppercase tracking-widest text-white"
          style={{ background: "#7C3AED" }}
        >
          Follow{totalSelected > 0 ? ` (${totalSelected})` : ""}
        </button>
      }
    >
      <div className="flex" style={{ height: "100%" }}>
        {/* Left rail — categories, ~28% */}
        <div className="shrink-0 border-r border-line" style={{ width: "28%" }}>
          {CATEGORY_META.map(cat => {
            const count = (draft[cat.key] as string[]).length;
            const active = cat.key === activeCategory;
            return (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setSearch(""); }}
                className={`w-full flex flex-col items-start gap-1 px-2.5 py-3 text-left border-l-2 transition-colors ${
                  active ? "bg-bg-elevated" : "hover:bg-bg-elevated/50"
                }`}
                style={{ borderLeftColor: active ? "#7C3AED" : "transparent" }}
              >
                <span className={`text-[11px] font-bold leading-tight ${active ? "text-text-primary" : "text-text-secondary"}`}>
                  {cat.label}
                </span>
                {count > 0 && (
                  <span
                    className="text-[9px] font-extrabold num px-1.5 py-0.5 rounded-full leading-none text-white"
                    style={{ background: "#7C3AED" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right pane — search + scrollable options, ~72% */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="p-2.5 shrink-0 border-b border-line">
            <div className="relative">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${CATEGORY_META.find(c => c.key === activeCategory)?.label.toLowerCase()}…`}
                className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-bg-elevated border border-line text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-follow"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <p className="text-center text-text-dim text-xs py-8">No matches for "{search}"</p>
            ) : (
              filteredOptions.map(opt => {
                const selected = (draft[activeCategory] as string[]).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-line/50 hover:bg-bg-elevated/40 transition-colors text-left"
                  >
                    <Swatch color={opt.color} flagIso={opt.flagIso} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-text-primary truncate leading-tight">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[10px] text-text-dim truncate leading-tight">{opt.sublabel}</div>
                      )}
                    </div>
                    <CheckIndicator selected={selected} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
