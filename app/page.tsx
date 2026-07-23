"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ALL_LIVE_MATCHES,
  ALL_PAST_MATCHES,
  ALL_UPCOMING_MATCHES,
} from "@/lib/mockData";
import { generatePastMatches, generateFutureMatches } from "@/lib/matchGenerator";
import type { Match } from "@/lib/types";
import LiveCarousel from "@/components/LiveCarousel";
import { PastMatchCard, FutureMatchCard, SpotlightMatchCard } from "@/components/MatchCard";
import {
  emptyFollowPrefs,
  getFollowPrefs,
  onFollowPrefsChanged,
  hasAnyFollow,
  qualifyMatch,
  isTier1Match,
  followedMatchSide,
  type FollowPrefs,
  type MatchQualification,
} from "@/lib/followPrefs";
import { registerHomeVisit, isNudgeDismissed, dismissNudge, NUDGE_MAX_SESSIONS } from "@/lib/followNudge";
import { isSpotlightMatch, buildFullMemberLookup, type FullMemberLookup } from "@/lib/spotlight";
import { selectHeroMatch } from "@/lib/heroSelection";
import { APP_VERSION_LABEL } from "@/lib/version";
import { useCarouselIndex } from "@/lib/useCarouselIndex";
import CarouselDots from "@/components/CarouselDots";

// ── Popularity sort ──────────────────────────────────────────────────────────
const COMP_POP: Record<string, number> = {
  "icc-t20wc-2026": 100, "icc-ct-2025": 95, "ashes-2025-26": 90, "ipl-2026": 88,
  "ind-eng-test-2026": 82, "ind-aus-t20i-2026": 80, "eng-sa-odi-2026": 68,
  "bbl-2025-26": 66, "psl-2026": 64, "hundred-2026": 58, "sa20-2026": 52,
  "cpl-2025": 46, "mlc-2026": 40,
};
const TEAM_POP: Record<string, number> = {
  IND: 20, AUS: 14, ENG: 12, PAK: 11, SA: 8, NZ: 7, WI: 7, SL: 6, BAN: 5, AFG: 4,
  MI: 10, CSK: 10, RCB: 9, KKR: 8, DC: 6, GT: 6, RR: 6, SRH: 5, LSG: 5, PBKS: 5,
};
function matchPop(m: Match): number {
  return (COMP_POP[m.competition.id] ?? 30) +
    (TEAM_POP[m.teamA.code] ?? 3) + (TEAM_POP[m.teamB.code] ?? 3);
}
function byPopularity(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => matchPop(b) - matchPop(a));
}

function fmtCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `in ${days}d ${hrs}h`;
  if (hrs > 0)  return `in ${hrs}h ${mins}m`;
  return `in ${mins}m`;
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { month: "short", day: "numeric" });
}
// "For you"'s upcoming-match line only (v1.0.89) -- the selection logic in
// forYouResult deliberately has NO lookahead cutoff (it always picks the
// soonest qualifying match, however far out that is), so a genuinely
// distant match can and does reach this card. A countdown stops being
// useful information past a week out ("in 84d 3h" reads as noise, not a
// signal), so the PRESENTATION switches to a plain date instead -- the
// selection itself is untouched. 7 days chosen as a reasonable "this is
// close enough that a countdown still means something" cutoff; note this
// is a NEW threshold, not mirroring an existing one -- FutureMatchCard
// (components/MatchCard.tsx) always renders the countdown format
// regardless of distance today, so this is presently the only place in
// the app that makes this distinction.
const FOR_YOU_COUNTDOWN_MAX_MS = 7 * 86400000;
function fmtForYouDistance(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff > FOR_YOU_COUNTDOWN_MAX_MS) return `Next match: ${fmtShortDate(iso)}`;
  return `${fmtCountdown(iso)} · ${fmtTime(iso)}`;
}

// Mouse click-drag scroll for the snap-x carousels (spotlight, for-you).
// Native `overflow-x-auto` already scrolls fine via touch swipe and via
// trackpad/wheel, but a plain mouse click-and-drag does nothing on a bare
// overflow div -- there's no built-in click-drag-to-pan behavior in CSS/
// HTML, only touch has that. On desktop, without a trackpad, that made a
// 2+ card carousel look exactly like a single static card with no visible
// second item and no way to reach it. This adds that missing interaction.
// Guards against click-through: a real drag (>6px total movement) swallows
// the click that would otherwise fire on mouseup and navigate the card.
function useDragToScroll<T extends HTMLDivElement>() {
  const ref = useRef<T>(null);
  const state = useRef({ down: false, startX: 0, startScroll: 0, moved: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    state.current = { down: true, startX: e.clientX, startScroll: ref.current.scrollLeft, moved: 0 };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const s = state.current;
    if (!s.down || !ref.current) return;
    e.preventDefault();
    const dx = e.clientX - s.startX;
    s.moved = Math.max(s.moved, Math.abs(dx));
    ref.current.scrollLeft = s.startScroll - dx;
  }, []);
  const endDrag = useCallback(() => { state.current.down = false; }, []);
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (state.current.moved > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
    state.current.moved = 0;
  }, []);

  return { ref, onMouseDown, onMouseMove, onMouseUp: endDrag, onMouseLeave: endDrag, onClickCapture };
}

// Spotlight uses a deliberately stricter, concrete-condition bar than the
// excitement-glow score elsewhere in the app — see lib/spotlight.ts for why.
const SPOTLIGHT_MAX = 3;

// Gap 1 (v1.0.91) — explicit priority order for when more than one followed
// category has a qualifying match at once. Live-before-upcoming is handled
// structurally elsewhere (forYouResult checks live first); this is the
// second half: "most specific follow type first" when multiple Tier 1
// categories are in play. Ranked most -> least specific:
//   1. team       — one exact side of one match, the narrowest signal there is
//   2. series     — one bilateral tour between two named sides
//   3. tournament — one named multi-team competition
//   4. nation     — every match either of a nation's sides plays, of any kind
//   5. format     — every match of a given format, across every nation/comp
// Player is intentionally excluded from this scale — it's Tier 2 (see
// isTier1Match/isAnyMatch in lib/followPrefs.ts) and only ever competes for
// a slot when NO Tier 1 category has anything at all, so it can't collide
// with this ranking. NOTE: the original request's example order ("nation >
// series > tournament > player > format") didn't mention team -- team is
// added here, ranked above nation, since "most specific first" requires it
// (one side of one match is more specific than an entire nation's schedule).
function bestFollowRank(q: MatchQualification): number {
  if (q.team) return 1;
  if (q.series) return 2;
  if (q.tournament) return 3;
  if (q.nation) return 4;
  if (q.format) return 5;
  return 6; // player-only (Tier 2) -- see comment above
}

type ExpandedCol = null | "past" | "future";

export default function Home() {
  // ---- Boot skeleton ----
  const [isBooting, setIsBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsBooting(false), 350);
    return () => clearTimeout(t);
  }, []);

  // ---- Pull-to-refresh ----
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const onPullTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 2) return;
    pullStartY.current = e.touches[0].clientY;
  }, []);
  const onPullTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 2) { setPullY(0); return; }
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) setPullY(Math.min(delta * 0.45, 65));
  }, []);
  const onPullTouchEnd = useCallback(() => {
    if (pullY >= 55) {
      setIsRefreshing(true);
      setPullY(0);
      setTimeout(() => setIsRefreshing(false), 1200);
    } else {
      setPullY(0);
    }
  }, [pullY]);

  // ---- Source lists (infinite scroll grows these) ----
  const [pastList, setPastList] = useState<Match[]>(ALL_PAST_MATCHES);
  const [futureList, setFutureList] = useState<Match[]>(byPopularity(ALL_UPCOMING_MATCHES));

  // ---- Scroll-listener infinite scroll ----
  const loadingRef = useRef(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timeout) return;
      timeout = setTimeout(() => {
        timeout = null;
        if (loadingRef.current) return;
        const scrollBottom = window.innerHeight + window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        if (scrollBottom > docHeight - 400) {
          loadingRef.current = true;
          setPastList(prev => {
            const earliest = prev.reduce((acc, m) => (m.startTimeIso < acc ? m.startTimeIso : acc), prev[0]?.startTimeIso ?? new Date().toISOString());
            return [...prev, ...generatePastMatches(earliest, 4)];
          });
          setFutureList(prev => {
            const latest = prev.reduce((acc, m) => (m.startTimeIso > acc ? m.startTimeIso : acc), prev[0]?.startTimeIso ?? new Date().toISOString());
            return [...prev, ...generateFutureMatches(latest, 4)];
          });
          setTimeout(() => { loadingRef.current = false; }, 300);
        }
      }, 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // ---- Column expand ----
  const [expanded, setExpanded] = useState<ExpandedCol>(null);
  const pastBasis = expanded === "past" ? "basis-full" : expanded === "future" ? "hidden" : "basis-[63%]";
  const futureBasis = expanded === "future" ? "basis-full" : expanded === "past" ? "hidden" : "basis-[37%]";

  // ---- Follow preferences (drive the "for you" row) — real multi-category
  // selections from the Filter sheet now, not a single placeholder team.
  // BottomNav's FollowSheet is a SIBLING component (mounted in layout.tsx,
  // not a child of this page), so prefs changes arrive via a DOM event
  // rather than props. ----
  const [followPrefs, setFollowPrefsState] = useState<FollowPrefs>(emptyFollowPrefs());
  useEffect(() => {
    setFollowPrefsState(getFollowPrefs());
    const unsubscribe = onFollowPrefsChanged(() => setFollowPrefsState(getFollowPrefs()));
    return unsubscribe;
  }, []);

  // ---- Empty-state nudge — only while nothing's ever been followed, not
  // dismissed, and still within the first few Home visits. ----
  const [showNudge, setShowNudge] = useState(false);
  useEffect(() => {
    const visitCount = registerHomeVisit();
    setShowNudge(visitCount <= NUDGE_MAX_SESSIONS && !isNudgeDismissed());
  }, []);
  const followsAnything = hasAnyFollow(followPrefs);

  // ---- Spotlight — excitement>=8 matches, pulled OUT of the quiet grid and
  // rendered full-width (or as a capped 3-card carousel) above it. Sourced
  // from the original mock arrays (not the infinite-scroll-grown lists) so
  // the spotlight slot doesn't shuffle as the user scrolls the grid below. ----
  //
  // isSpotlightMatch() now also gates international/bilateral matches on
  // both teams being full ICC members (lib/spotlight.ts), read through the
  // async getTeamMembershipStatus() adapter (lib/teamData.ts) -- never
  // directly. Since that's a Promise-returning call and isSpotlightMatch()
  // itself must stay synchronous to run inside .filter(), the lookup is
  // resolved ONCE upfront via buildFullMemberLookup() in a mount effect,
  // not per-match/per-render. Same hydration-safe shape used elsewhere in
  // this file (e.g. followPrefs above): a neutral default (null -- treated
  // as "nothing qualifies yet") on the first render, matching what the
  // server renders, then the real lookup fills in via useEffect post-mount.
  const [fullMemberLookup, setFullMemberLookup] = useState<FullMemberLookup | null>(null);
  useEffect(() => {
    buildFullMemberLookup([...ALL_PAST_MATCHES, ...ALL_UPCOMING_MATCHES]).then(setFullMemberLookup);
  }, []);

  const spotlightMatches = useMemo(() => {
    if (!fullMemberLookup) return [];
    // Most-recent-first for past (freshest result leads), soonest-first for
    // upcoming. Past matches lead the combined list since they're a settled,
    // immediate story; upcoming fills remaining slots if any are left.
    const past = ALL_PAST_MATCHES
      .filter(m => isSpotlightMatch(m, fullMemberLookup))
      .map(m => ({ m, isPast: true as const }))
      .sort((a, b) => b.m.startTimeIso.localeCompare(a.m.startTimeIso));
    const future = ALL_UPCOMING_MATCHES
      .filter(m => isSpotlightMatch(m, fullMemberLookup))
      .map(m => ({ m, isPast: false as const }))
      .sort((a, b) => a.m.startTimeIso.localeCompare(b.m.startTimeIso));
    return [...past, ...future].slice(0, SPOTLIGHT_MAX);
  }, [fullMemberLookup]);
  const spotlightIds = useMemo(() => new Set(spotlightMatches.map(s => s.m.id)), [spotlightMatches]);

  // ---- "For you" — union-pool of matches qualifying via ANY followed
  // nation, team, tournament, series, format, or player (lib/followPrefs.ts
  // qualifyMatch). Two-tier priority: Nation/Team/Tournament/Series/Format
  // is Tier 1; Player alone is Tier 2, used ONLY when Tier 1 is completely
  // empty — a match qualifying via both stays Tier 1, the demotion only
  // hits matches that qualify exclusively via a followed player. Never
  // surfaces past matches — this row is live-or-upcoming only. ----
  // Live carousel order: hero (lib/heroSelection.ts's single global pick)
  // always leads, since it's the card shown by default without swiping;
  // every other live match follows in the existing popularity order. Only
  // the hero position is governed by the new rule -- ranking the rest of
  // the swipeable strip isn't what was asked for here.
  const liveCarouselMatches = useMemo(() => {
    const hero = selectHeroMatch(ALL_LIVE_MATCHES);
    if (!hero) return byPopularity(ALL_LIVE_MATCHES);
    return [hero, ...byPopularity(ALL_LIVE_MATCHES.filter(m => m.id !== hero.id))];
  }, []);

  // v1.0.91 (Bug 2) — a qualifying LIVE match is, by construction, always
  // already visible somewhere: liveCarouselMatches (above) renders every
  // single live match unconditionally, there's no filtering. So a live
  // "for you" qualifier never needs (or gets) a standalone card anymore —
  // it gets an inline "for you" marker stamped on its existing live-
  // carousel card instead (the same dedup idea Spotlight already used for
  // FY5, extended here to the carousel). Only when there are ZERO
  // qualifying live matches does this fall through to a single upcoming
  // card below, which preserves FY3's fallback behavior exactly: if a
  // followed team's only live match is the hero, hero stays excluded here
  // (it's a global pick, not a personalization signal — see heroId below),
  // so liveIds comes back empty and "for you" still falls through to that
  // team's next upcoming match.
  const forYouResult = useMemo((): { liveIds: Set<string>; upcoming: Match | null } => {
    const empty = { liveIds: new Set<string>(), upcoming: null };
    if (!followsAnything) return empty;

    const pool = [...ALL_LIVE_MATCHES, ...ALL_UPCOMING_MATCHES];
    const tier1: { m: Match; rank: number }[] = [];
    const playerOnly: { m: Match; rank: number }[] = [];
    for (const m of pool) {
      const q = qualifyMatch(m, followPrefs);
      if (isTier1Match(q)) tier1.push({ m, rank: bestFollowRank(q) });
      else if (q.player) playerOnly.push({ m, rank: bestFollowRank(q) });
    }
    const active = tier1.length > 0 ? tier1 : playerOnly;
    if (active.length === 0) return empty;
    const activeIds = new Set(active.map(a => a.m.id));

    // Hero is a single GLOBAL selection (lib/heroSelection.ts) -- the same
    // for every visitor regardless of what they follow, never personalized.
    // "for you" pools separately and simply excludes whatever hero claims.
    const heroId = selectHeroMatch(ALL_LIVE_MATCHES)?.id;
    const liveIds = new Set(ALL_LIVE_MATCHES.filter(m => activeIds.has(m.id) && m.id !== heroId).map(m => m.id));
    if (liveIds.size > 0) return { liveIds, upcoming: null };

    // No live qualifiers -- fall back to the single soonest UPCOMING
    // qualifying match. Gap 1 (v1.0.91): when several different follow
    // categories each have a candidate, don't just take whichever happens
    // to be chronologically soonest -- prefer the most specific follow
    // type first (bestFollowRank, above), and only break ties between
    // equally-specific candidates by soonest start time.
    const upcomingIds = new Set(ALL_UPCOMING_MATCHES.map(m => m.id));
    const upcomingCandidates = active.filter(a => upcomingIds.has(a.m.id));
    if (upcomingCandidates.length === 0) return { liveIds, upcoming: null };
    const minRank = Math.min(...upcomingCandidates.map(a => a.rank));
    const upcoming = upcomingCandidates
      .filter(a => a.rank === minRank)
      .map(a => a.m)
      .sort((x, y) => x.startTimeIso.localeCompare(y.startTimeIso))[0] ?? null;
    return { liveIds, upcoming };
  }, [followPrefs, followsAnything]);

  const forYouLiveIds = forYouResult.liveIds;

  // Spotlight-dedup is a pure display-time filter — a qualifying upcoming
  // match already shown as a spotlight card gets the "for you" marker
  // there instead of appearing again in this slot. It does NOT re-trigger
  // the live/upcoming fallback: if absorbing spotlight empties the row, the
  // row just stays empty (the marker on the spotlight card already
  // preserves the information). (Live qualifiers never reach this — they're
  // handled entirely via forYouLiveIds/the live carousel above, and
  // Spotlight can never contain a live match — see lib/spotlight.ts.)
  const forYouVisible = useMemo(
    () => (forYouResult.upcoming && !spotlightIds.has(forYouResult.upcoming.id) ? forYouResult.upcoming : null),
    [forYouResult, spotlightIds]
  );
  const forYouSpotlightIds = useMemo(
    () => new Set(forYouResult.upcoming && spotlightIds.has(forYouResult.upcoming.id) ? [forYouResult.upcoming.id] : []),
    [forYouResult, spotlightIds]
  );

  // Coming Up's actually-rendered list (v1.0.94) -- same filter used for
  // both the header's "· N" count and the card grid below, so they can
  // never disagree. Previously the header read `futureList.length` (the
  // raw, unfiltered count) while the grid itself applied the spotlightIds/
  // forYouVisible exclusions -- harmless while both exclusions were rare,
  // but confirmed live to visibly drift (header said 11, grid rendered 10)
  // once the v1.0.93 "for you" dedup started routinely pulling a card.
  const futureVisible = useMemo(
    () => futureList.filter(m => !spotlightIds.has(m.id) && m.id !== forYouVisible?.id),
    [futureList, spotlightIds, forYouVisible]
  );

  // Mouse drag-to-scroll for the carousel that can hold 2+ cards here
  // (spotlight) -- see useDragToScroll's own comment for why. "For you" no
  // longer needs its own drag-to-scroll/dot-indicator pair as of v1.0.91 --
  // it renders at most a single card now (live qualifiers became inline
  // carousel markers instead, see forYouResult above), so it's never a
  // multi-item carousel.
  const spotlightDrag = useDragToScroll();
  // Shared with LiveCarousel's own dot indicator -- see lib/useCarouselIndex.ts.
  const spotlightActiveIdx = useCarouselIndex(spotlightDrag.ref, spotlightMatches.length);

  return (
    <main
      className="min-h-screen pb-24"
      onTouchStart={onPullTouchStart}
      onTouchMove={onPullTouchMove}
      onTouchEnd={onPullTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullY > 5 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: isRefreshing ? 48 : pullY }}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 border-cyan border-t-transparent ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: isRefreshing ? undefined : `rotate(${pullY * 4}deg)` }}
          />
        </div>
      )}

      {/* Header — logo + title only */}
      <header className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <Logo />
          <h1 className="text-base font-extrabold tracking-tight">Bawler</h1>
        </div>
      </header>

      {/* All of the sections below (live carousel, for-you, spotlight)
          read match data that\'s computed at module-load time from
          Date.now() (lib/mockData.ts) — which server prerender and client
          hydration evaluate at DIFFERENT real-world moments, so the two
          can genuinely disagree on which matches are live/upcoming/past.
          Rendering them only after the client has mounted (isBooting also
          gates the grid below, same reasoning) keeps the server-rendered
          HTML and the client's first render IDENTICAL (both show the
          skeleton), so React never has to reconcile a mismatched tree —
          that reconciliation is what was making the Filter button (and
          anything else on the page) unresponsive for the first click or
          two while React quietly repaired itself. */}
      {isBooting ? (
        <HeroSkeleton />
      ) : (
        <>
          <section className="mt-1">
            <LiveCarousel matches={liveCarouselMatches} nextMatch={byPopularity(ALL_UPCOMING_MATCHES)[0]} forYouIds={forYouLiveIds} />
          </section>

          {/* For you — surfaces the single best upcoming match matching any
              followed selection, once no qualifying match is already live
              (live qualifiers get an inline marker on their existing live-
              carousel card instead, per forYouLiveIds above -- v1.0.91).
              Hidden when that upcoming match is already shown as a
              spotlight card (that card gets the "for you" marker instead,
              so nothing is shown twice). */}
          {forYouVisible && (
            <section className="mt-3 px-3">
              <ForYouRow match={forYouVisible} isLive={false} followPrefs={followPrefs} />
            </section>
          )}

          {/* Empty-state nudge — only shown pre-first-follow, within the first
              few sessions, until dismissed. No permanent space: this section
              renders nothing once any of those conditions stop holding. The
              Filter button in the bottom nav is the permanent entry point. */}
          {!followsAnything && showNudge && (
            <section className="mt-3 px-3">
              <FollowNudge onDismiss={() => { dismissNudge(); setShowNudge(false); }} />
            </section>
          )}

          {/* Spotlight — matches clearing the concrete spotlight bar (see
              lib/spotlight.ts), standing apart from the quiet grid below. 2+
              qualifiers → swipeable carousel, capped at 3. */}
          {spotlightMatches.length > 0 && (
            <section className="mt-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5 px-3">Spotlight</h2>
              {spotlightMatches.length === 1 ? (
                <div className="px-3">
                  <SpotlightMatchCard
                    match={spotlightMatches[0].m}
                    isPast={spotlightMatches[0].isPast}
                    forYou={forYouSpotlightIds.has(spotlightMatches[0].m.id)}
                  />
                </div>
              ) : (
                <div className="px-3">
                  <div
                    ref={spotlightDrag.ref}
                    onMouseDown={spotlightDrag.onMouseDown}
                    onMouseMove={spotlightDrag.onMouseMove}
                    onMouseUp={spotlightDrag.onMouseUp}
                    onMouseLeave={spotlightDrag.onMouseLeave}
                    onClickCapture={spotlightDrag.onClickCapture}
                    className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3 px-3 cursor-grab active:cursor-grabbing select-none"
                  >
                    {spotlightMatches.map(({ m, isPast }) => (
                      <div key={m.id} className="shrink-0 snap-center" style={{ width: "calc(100vw - 24px)", maxWidth: "calc(430px - 24px)" }}>
                        <SpotlightMatchCard match={m} isPast={isPast} forYou={forYouSpotlightIds.has(m.id)} />
                      </div>
                    ))}
                  </div>
                  {/* Contained position indicator -- v1.0.65, replaces
                      the old full-width native scrollbar. Cyan to match
                      Spotlight's own excitement-glow accent. */}
                  <div className="mt-2">
                    <CarouselDots count={spotlightMatches.length} activeIndex={spotlightActiveIdx} activeColor="#00E5FF" />
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {isBooting ? (
        <SkeletonColumns />
      ) : (
        <section className="mt-4 px-3">
          <div className="flex gap-2 items-start">
            <div className={`${pastBasis} min-w-0`}>
              <ColumnHeader
                title="Past"
                count={pastList.length}
                expanded={expanded === "past"}
                onToggleExpand={() => setExpanded(e => (e === "past" ? null : "past"))}
              />
              <div className="space-y-2">
                {pastList.filter(m => !spotlightIds.has(m.id)).map(m => <PastMatchCard key={m.id} match={m} />)}
              </div>
            </div>
            <div className={`${futureBasis} min-w-0`}>
              <ColumnHeader
                title="Coming up"
                count={futureVisible.length}
                expanded={expanded === "future"}
                onToggleExpand={() => setExpanded(e => (e === "future" ? null : "future"))}
              />
              <div className="space-y-2">
                {/* futureVisible (defined above, alongside forYouVisible) --
                    excludes whichever single match is currently occupying
                    the "for you" slot above (v1.0.93) -- same mirrored
                    pattern as "for you"'s own `m.id !== heroId` exclusion,
                    just pointed the other way. Only ever one id, never every
                    qualifying match: forYouResult's selection logic (soonest
                    qualifying upcoming match) is untouched, so a follow with
                    several qualifying upcoming games still shows all-but-one
                    of them here -- only the one actually rendered in "for
                    you" is pulled. The header count above uses this exact
                    same array (v1.0.94), so it can never drift from what's
                    actually rendered. */}
                {futureVisible.map(m => <FutureMatchCard key={m.id} match={m} />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sourced from lib/version.ts, same as the match-page footer
          (components/MatchView.tsx) -- previously the homepage had no
          version string at all, which made live verification unreliable
          (no way to confirm which deploy you were actually looking at
          without navigating to a match page first). Added v1.0.90. */}
      <footer className="text-[10px] text-text-dim text-center pt-2 pb-8">
        Bawler {APP_VERSION_LABEL} · all data mocked
      </footer>
    </main>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * "For you" row (v1.0.49) — small personalization strip above the spotlight/
 * grid. Stale note removed (v1.0.95): this originally described the v1.0.49
 * single-team placeholder (`lib/followedTeam.ts`, deleted at v1.0.52) --
 * "tapping the label opens an inline team picker" and "default India" have
 * not been true since that rewrite. Selection now comes entirely from the
 * multi-category Filter sheet (`components/FollowSheet.tsx`, opened via the
 * bottom nav, not by tapping this row's label), backed by
 * `lib/followPrefs.ts`'s `bawler:followPrefs` localStorage key -- the one
 * and only source of truth for follow state; there is no default follow.
 */
function ForYouRow({ match, isLive, followPrefs }: { match: Match; isLive: boolean; followPrefs: FollowPrefs }) {
  // v1.0.58 -- this card only (Live/Spotlight/grid keep their own existing
  // team-order conventions): always put the followed team on the left, so
  // its color dot and name never end up disconnected from each other by
  // sitting on opposite sides. followedMatchSide returns null for matches
  // that only qualified via a followed tournament/format (nothing pins
  // those to a specific side), in which case teamA/teamB order is left as
  // the data already provides it.
  const side = followedMatchSide(match, followPrefs);
  const leftTeam = side === "B" ? match.teamB : match.teamA;
  const rightTeam = side === "B" ? match.teamA : match.teamB;

  return (
    // Shared visual language with SpotlightMatchCard (v1.0.61) -- same corner
    // radius (rounded-xl, overriding `.card`'s own 1rem via inline style so
    // the override wins regardless of Tailwind's compiled class order), same
    // edge padding + internal gap rhythm (px-2 py-1.5, flex-col gap-0.5), and
    // the "FOR YOU" label already shared Spotlight's own section-label
    // typography (text-[10px] font-bold uppercase tracking-widest) before
    // this change -- only the color differs (violet here, text-dim there),
    // deliberately, per spec. Height and background treatment are untouched:
    // this card stays auto-height and flat/quiet, Spotlight stays its own
    // fixed taller height with its gradient/glow -- structure matches,
    // sizing doesn't.
    //
    // 3px left border in the followed team's color -- same "colored side
    // accent" convention PastMatchCard/FutureMatchCard already use (winner's
    // color there, followed team's color here). Always leftTeam's color, so
    // border + dot + name are one consistent unit on the same side.
    <div className="card overflow-hidden" style={{ borderLeft: `3px solid ${leftTeam.primaryColor}`, borderRadius: "0.75rem" }}>
      <div className="px-2 py-1.5 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#7C3AED" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01z" />
            </svg>
            For you
          </span>
          {isLive && (
            <span className="text-[9px] font-extrabold text-live uppercase tracking-widest flex items-center gap-1">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-live inline-block" />Live
            </span>
          )}
        </div>

        <a href={`/match/${match.id}`} className="tap-scale flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: leftTeam.primaryColor }} />
            <span className="text-base font-extrabold truncate">{leftTeam.shortName}</span>
          </div>
          <span className="text-[10px] font-bold text-text-dim shrink-0">vs</span>
          <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: rightTeam.primaryColor }} />
            <span className="text-base font-extrabold truncate">{rightTeam.shortName}</span>
          </div>
        </a>
        <div className="text-[10px] text-text-dim text-center truncate">
          {isLive ? (match.liveStatusOverride ?? "Live now") : fmtForYouDistance(match.startTimeIso)}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty-state nudge (v1.0.52) — invites a first-time user to the Filter
 * sheet. Only ever rendered while nothing's been followed yet, within the
 * first NUDGE_MAX_SESSIONS Home visits, and not dismissed (see page-level
 * gating above) — this component itself just renders the card + dismiss.
 */
function FollowNudge({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="card px-3 py-3 flex items-start gap-2.5" style={{ borderColor: "#7C3AED44" }}>
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "#7C3AED22" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#7C3AED">
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01z" />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-text-primary leading-snug">
          Follow a team, player, or tournament
        </p>
        <p className="text-[11px] text-text-dim leading-snug mt-0.5">
          Tap <span className="font-bold" style={{ color: "#7C3AED" }}>Filter</span> below to get a "for you" row with the matches you care about.
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-text-dim hover:text-text-secondary p-0.5 shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function ColumnHeader({ title, count, expanded, onToggleExpand }: {
  title: string; count: number; expanded: boolean; onToggleExpand: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
        {title} <span className="text-text-secondary num">· {count}</span>
      </h2>
      <button
        onClick={onToggleExpand}
        aria-label={expanded ? "Collapse to split view" : "Expand to full width"}
        className="text-text-dim hover:text-cyan p-0.5"
      >
        {expanded ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 7H7V3M13 9H9V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 7V3H7M13 9V13H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Placeholder for the live-carousel/for-you/spotlight block while isBooting
// is true — see the long comment above where this is used for why: it keeps
// the server-rendered HTML and the client's first render pixel-identical
// (both show this skeleton) so hydration never has to reconcile a mismatched
// tree of match data computed at different real-world moments.
function HeroSkeleton() {
  return (
    <section className="mt-1 px-3">
      <div className="skeleton rounded-2xl" style={{ height: 168 }} />
    </section>
  );
}

function SkeletonColumns() {
  return (
    <section className="mt-4 px-3">
      <div className="flex gap-2 items-start">
        <div className="basis-[63%] space-y-2">
          <div className="skeleton rounded-xl" style={{ height: 14, width: "60%", marginBottom: 8 }} />
          {[148, 148, 130, 120].map((h, i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: h }} />
          ))}
        </div>
        <div className="basis-[37%] space-y-2">
          <div className="skeleton rounded-xl" style={{ height: 14, width: "70%", marginBottom: 8 }} />
          {[148, 148, 130, 120].map((h, i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: h }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="shrink-0">
      <circle cx="16" cy="16" r="14" stroke="#00E5FF" strokeWidth="2" />
      <path d="M9 16 L13 22 L23 10" stroke="#FF6B35" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="10" r="2" fill="#00E5FF" />
    </svg>
  );
}
