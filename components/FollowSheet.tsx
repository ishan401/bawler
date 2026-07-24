"use client";

import React, { useEffect, useMemo, useState } from "react";
import BottomSheet from "./BottomSheet";
import { NATIONAL_TEAMS, ALL_TEAMS, COMPETITIONS, PLAYERS } from "@/lib/mockData";
import type { MatchFormat } from "@/lib/types";
import { getTeamMembershipStatus, type MembershipStatus } from "@/lib/teamData";
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

// No color field -- format never had a real color to carry (every entry
// rendered the same fallback gray dot before Swatch was scoped to
// nations/teams only, conveying no information).
const FORMAT_OPTIONS: Option[] = [
  { id: "T20", label: "T20" },
  { id: "T20I", label: "T20I" },
  { id: "ODI", label: "ODI" },
  { id: "Test", label: "Test" },
  { id: "Hundred", label: "The Hundred" },
];

// Order matches how people actually think about following cricket: country
// first, then the tournament/league context, then the specific bilateral
// series (a related but distinct concept -- see the "series" case below),
// then the specific club, then individual players, then format as the
// catch-all last option.
const CATEGORY_META: { key: FollowCategory; label: string }[] = [
  { key: "nations", label: "Nations" },
  { key: "tournaments", label: "Tournaments" },
  { key: "series", label: "Series" },
  { key: "teams", label: "Teams" },
  { key: "players", label: "Players" },
  { key: "formats", label: "Formats" },
];

// ============================================================================
// Nations sort: full ICC members first, associates after -- v1.0.116
// ============================================================================
// Membership tier comes ONLY from the sanctioned getTeamMembershipStatus()
// adapter (lib/teamData.ts) -- the same one Spotlight's international-match
// gate already uses (see lib/spotlight.ts's buildFullMemberLookup). Nothing
// here reads `team.membershipStatus` directly, and no nation names are
// hardcoded as "the full members" -- when real ICC membership data
// eventually flows through that adapter instead of the mock field, this
// list re-sorts correctly with no code changes here.
//
// getTeamMembershipStatus() is async (by design -- see teamData.ts), so it's
// resolved once per sheet-open via `nationMembership` state (built in the
// component below, the same "resolve once upfront into a synchronous
// lookup" shape buildFullMemberLookup() already established), not awaited
// inline inside this sort.
//
// Fail-safe placement for a nation with no resolved status (missing from
// the underlying data, or -- despite the type -- some other malformed
// value slipping through at runtime): it's placed in its OWN trailing
// group, after both full members and associates, rather than folded into
// "associate". Folding it into associate would assert a specific tier for
// a nation whose tier is actually unknown, which is a stronger (and
// possibly wrong) claim than "we don't know" -- and dropping it from the
// list entirely would make a followable nation disappear outright. Ending
// up last, on its own, is the honest middle ground: still followable,
// still visible, just not asserted into a tier the data doesn't support.
export function membershipRank(status: MembershipStatus | undefined): number {
  if (status === "full") return 0;
  if (status === "associate") return 1;
  return 2; // missing or malformed -- see comment above
}

function buildOptions(
  category: FollowCategory,
  nationMembership: Map<string, MembershipStatus | undefined>
): Option[] {
  switch (category) {
    case "nations":
      return Object.values(NATIONAL_TEAMS)
        .map(t => ({ id: t.country ?? t.code, label: t.fullName, color: t.primaryColor, flagIso: FLAG_ISO[t.code] }))
        .sort((a, b) => {
          const rankDiff = membershipRank(nationMembership.get(a.id)) - membershipRank(nationMembership.get(b.id));
          if (rankDiff !== 0) return rankDiff;
          return a.label.localeCompare(b.label);
        });
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
      // Genuine multi-team competitions only. Bilateral/tour-style series
      // (Competition.type === "bilateral", e.g. "India tour of Australia
      // 2026") are a related but distinct concept -- a series is two
      // nations playing a fixed set of matches, not a structured
      // multi-team competition -- and live under the separate "series"
      // case below instead (SC1, v1.0.88).
      //
      // No color swatch here (see Swatch-rendering note below) -- every
      // tournament used to inherit `logoColor`, but that field is shared
      // with unrelated competitions (Big Bash and T20 World Cup both read
      // the same cyan), so it never actually distinguished one row from
      // another. Not carried into the Option here since nothing renders it.
      return Object.values(COMPETITIONS)
        .filter(c => c.type !== "bilateral")
        .map(c => ({ id: c.id, label: c.name, sublabel: c.shortName }))
        .sort((a, b) => a.label.localeCompare(b.label));
    case "series":
      // Bilateral/tour-style series only -- see the "tournaments" case
      // above for why these were split out. Same no-swatch reasoning:
      // logoColor doesn't uniquely identify a row either.
      return Object.values(COMPETITIONS)
        .filter(c => c.type === "bilateral")
        .map(c => ({ id: c.id, label: c.name, sublabel: c.shortName }))
        .sort((a, b) => a.label.localeCompare(b.label));
    case "players":
      // No color swatch here either -- a player's team color duplicated
      // the nationality text already shown as the sublabel, and was
      // inconsistent besides (only some players resolve a team at all).
      return Object.values(PLAYERS)
        .map(p => ({ id: p.id, label: p.name, sublabel: p.nationality }))
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

// ============================================================================
// Selection accent: cyan, not purple -- v1.0.115
// ============================================================================
// Every selection-state element inside this sheet (a checked
// `CheckIndicator`, each category's "N selected" count badge, the
// "Update (N)" submit button) used a dedicated purple (`#7C3AED`, the
// `follow` design token) as its own accent, distinct from the platform's
// one cyan active/selected accent used everywhere else. Unified to cyan
// (`#00E5FF`, matching `tailwind.config.ts`'s `cyan` token) here so this
// sheet reads as the same platform, not a visually separate feature.
//
// SCOPED TO THIS FILE ONLY -- the `follow` token itself (`tailwind.config.
// ts`) is UNCHANGED, and so is its other consumer: `components/
// BottomNav.tsx`'s Filter tab still turns violet while this sheet is open
// (`text-follow`/`bg-follow`). That's a deliberate, separate decision this
// change does not touch -- see DECISIONS-LOG.md. Purple itself is also
// unchanged everywhere else in the app: it's the intentional outcome-coded
// color for a six (the `six` token, `#A855F7` -- a different hex from the
// `follow` token this file used, they were never the same color, just the
// same family), and stays exactly as-is on the batting card, sparkline
// dots, BallGIF, etc.
// ============================================================================

function CheckIndicator({ selected }: { selected: boolean }) {
  // v1.0.115: cyan, not purple -- see the module comment above the
  // component for why (unifying with the platform's single active/
  // selected accent, scoped to this sheet only). The checkmark itself
  // switched from white to the dark `bg` token to stay legible against
  // the brighter cyan fill, matching the "bg-cyan + dark text/icon"
  // contrast convention already used everywhere else a cyan fill carries
  // a mark on top of it (e.g. MatchCard's `bg-cyan text-bg` badges) --
  // white-on-cyan is the one combination this codebase never uses for
  // exactly that contrast reason.
  return (
    <span
      className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-colors"
      style={{
        background: selected ? "#00E5FF" : "transparent",
        borderColor: selected ? "#00E5FF" : "var(--line)",
      }}
    >
      {selected && (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8.5L6.2 12L13 4" stroke="#0A0E1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  // Resolved once per sheet-open, via the sanctioned getTeamMembershipStatus()
  // adapter -- see the module comment above buildOptions for why this can't
  // be an inline per-row await (that function must stay synchronous so the
  // nations case can run inside a plain Array.sort). Starts empty each open,
  // same "recompute fresh, don't reuse a stale cache" discipline the other
  // adapter-backed features in this app already follow (useScheduleTab,
  // useMatchAccentColors) -- while empty, membershipRank() treats every
  // nation as unclassified, which safely degrades to a plain alphabetical
  // list for the one render before this resolves.
  const [nationMembership, setNationMembership] = useState<Map<string, MembershipStatus | undefined>>(new Map());

  useEffect(() => {
    if (open) {
      setDraft(getFollowPrefs());
      setActiveCategory("nations");
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const teams = Object.values(NATIONAL_TEAMS);
      const resolved = await Promise.all(
        teams.map(async t => [t.country ?? t.code, await getTeamMembershipStatus(t)] as const)
      );
      if (!cancelled) setNationMembership(new Map(resolved));
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const options = useMemo(() => buildOptions(activeCategory, nationMembership), [activeCategory, nationMembership]);
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q));
  }, [options, search]);

  const totalSelected =
    draft.nations.length + draft.teams.length + draft.tournaments.length + draft.series.length + draft.players.length + draft.formats.length;

  function toggle(id: string) {
    setDraft(prev => {
      const list = prev[activeCategory] as string[];
      const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
      return { ...prev, [activeCategory]: next };
    });
  }

  // Named for what the button now says, not what it used to say -- see
  // the button below (v1.0.64): the commit mechanic is unchanged, only
  // the label changed, since a saved change here can just as easily be
  // a removal as an addition.
  function handleUpdate() {
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
          onClick={handleUpdate}
          className="w-full py-3.5 text-sm font-extrabold uppercase tracking-widest text-bg"
          style={{ background: "#00E5FF" }}
        >
          {/* "Update" rather than "Follow" -- this button commits
              additions AND removals, so a label that only reads
              correctly for adding is a semantic mismatch when the
              pending change is an unfollow. Count is kept as a neutral
              "how many total selections after this save" indicator,
              not framed as "how many things you're following now". */}
          Update{totalSelected > 0 ? ` (${totalSelected})` : ""}
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
                style={{ borderLeftColor: active ? "#00E5FF" : "transparent" }}
              >
                <span className={`text-[11px] font-bold leading-tight ${active ? "text-text-primary" : "text-text-secondary"}`}>
                  {cat.label}
                </span>
                {count > 0 && (
                  <span
                    className="text-[9px] font-extrabold num px-1.5 py-0.5 rounded-full leading-none text-bg"
                    style={{ background: "#00E5FF" }}
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
                className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-bg-elevated border border-line text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-cyan"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <p className="text-center text-text-dim text-xs py-8">No matches for "{search}"</p>
            ) : (
              filteredOptions.map(opt => {
                const selected = (draft[activeCategory] as string[]).includes(opt.id);
                // Swatch (color dot / flag) only carries real signal for
                // Nation (flag) and Team (real brand color) -- Tournament,
                // Player, and Format rows render without one rather than a
                // decorative dot that means nothing (see buildOptions above).
                const showSwatch = activeCategory === "nations" || activeCategory === "teams";
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-line/50 hover:bg-bg-elevated/40 transition-colors text-left"
                  >
                    {showSwatch && <Swatch color={opt.color} flagIso={opt.flagIso} />}
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
