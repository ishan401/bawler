import type { Match, PlayerProfile, PlayerFormatKey } from "./types";
import { ALL_PAST_MATCHES, ALL_LIVE_MATCHES, resolvePlayerSlug } from "./mockData";
import { getCurrentInnings } from "./matchStatus";

// ============================================================================
// Player recent form + achievements adapter — v1.0.117, rebuilt v1.0.118,
// per-innings granularity fix v1.0.126.1
// ============================================================================
// v1.0.126.1: the "settled" gate used to operate at the MATCH level only
// (candidateMatches() -> hasUsableResult filter) -- wrong granularity for
// any multi-innings match that's still genuinely live. India's only Test
// in this mock dataset is Day 3 of a follow-on with no result yet, so the
// old gate dropped EVERY entry from it, including India's fully-complete
// 1st innings (Kohli 121, Rohit 83, Gill 110 -- already 2 innings in the
// past by the time anyone's looking) and England's own already-closed 1st
// innings from the SAME match. See eligibleEntriesFor() below for the
// actual per-innings replacement -- it's decided per innings via the same
// getCurrentInnings() lookup ScoreBar.tsx/lib/playerActivity.ts already
// share, not a new independent notion of "current."
// ============================================================================
// v1.0.117 originally read a separate, hand-typed per-format field
// (PlayerProfile.testRecentForm/odiRecentForm/t20iRecentForm/
// franchiseRecentForm) that had no relationship to a player's actual
// recorded matches — it was manually authored demo data, and different
// players ended up with different, arbitrary array lengths purely because
// of how much was typed in, not because of anything real about their
// match history. v1.0.118 removed that field entirely (grep-confirmed zero
// references anywhere in the codebase — see DECISIONS-LOG.md) and rebuilt
// this adapter to derive BOTH the recent-form graph and the achievements
// callout directly from real per-match data: the same `Match`/`Innings`/
// `BattingEntry`/`BowlingEntry` records, and the same `match.result.
// manOfMatch`/`manOfTournament` fields, that already power `Scorecard.tsx`
// and every career stats grid on this page. No second, disconnected data
// source exists anymore for this feature.
//
// Same real-data-readiness pattern as every other adapter in this
// codebase (see ARCHITECTURE.md):
//   1. Split: nothing new to split here — the fields this reads
//      (Match.innings[].battingCard/bowlingCard, Match.result.manOfMatch/
//      manOfTournament) already existed and are already the sanctioned
//      shape; this adapter is a new DERIVATION over them, not a new field.
//   2. Sanctioned accessor: getRecentForm()/getPlayerAchievements() below
//      are the only place that walks match/innings/card data for this
//      specific purpose. No component reads Match/Innings/BattingEntry/
//      BowlingEntry directly for recent-form purposes.
//   3. Async from day one: both return Promises, resolving synchronously
//      from in-memory mock arrays today — the same shape a real per-player
//      stats endpoint would need.
//   4. No-op placeholder: refreshPlayerForm() below.
//
// Explicitly NOT in scope, anywhere in this file or its consumers: a
// player's upcoming matches. Playing XI isn't confirmed until close to a
// match, so showing a player's next fixture with any confidence would be
// misleading — this adapter only ever looks backward at matches with a
// genuinely settled result, never forward.
// ============================================================================

export type { PlayerFormatKey };

/** One plotted point on the recent-form graph — runs (batting) or wickets
 * (bowling) for one innings/spell. */
export interface RecentFormPoint {
  value: number;
  /**
   * Whether the batter finished this innings not out (never dismissed, or
   * a genuine `retiredNotOut` -- see `BattingEntry.out`'s doc comment in
   * lib/types.ts). Only ever present when `RecentFormSeries.metric ===
   * "runs"` -- a bowling spell has no "not out" concept, so this is
   * `undefined` on every wickets-metric point rather than a meaningless
   * `false`. v1.0.152 addition -- exists specifically so the player
   * profile page's single-innings "Tier 1" callout (see
   * PlayerProfileView.tsx's RecentFormSingleStat) can append the same
   * not-out asterisk convention the page already uses for career stats
   * like `highScore` ("254*"), without introducing a second, separately
   * computed notion of a player's innings count -- this flag rides on
   * the exact same real `BattingEntry.out` value that decided whether
   * the entry was eligible for this series at all.
   */
  notOut?: boolean;
}

export interface RecentFormSeries {
  /** Chronological oldest -> newest, real recorded entries only, length
   * 0-10. NEVER padded with fake zeros to reach 10. */
  points: RecentFormPoint[];
  metric: "runs" | "wickets";
}

/** One pre-formatted achievement line, singular/plural already resolved. */
export interface AchievementLine {
  text: string;
}

// ----------------------------------------------------------------------------
// Defensive read helpers — every field this file touches is typed as
// required/non-optional on Match/Innings/BattingEntry/BowlingEntry, but
// that's a compile-time-only guarantee (the same gap lib/dataValidation.ts's
// header comment and lib/teamAccentColor.ts's sanitizeHexColor() already
// document for other fields) — a real feed, or a hand-edited mock entry,
// can still send something malformed at runtime. Nothing below trusts a
// field's type without checking it first.
// ----------------------------------------------------------------------------

function isObjectLike(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isFiniteNonNegative(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

function resultField(match: Match, field: "manOfMatch" | "manOfTournament"): string | undefined {
  const r: unknown = (match as unknown as Record<string, unknown>).result;
  if (!isObjectLike(r)) return undefined;
  const v = r[field];
  return typeof v === "string" && v.trim() ? v : undefined;
}

/**
 * True if `match.result` is a genuinely usable completed outcome — the
 * same defensive shape as lib/teamSchedule.ts's own (private)
 * hasUsableResult(), written independently here since each adapter in
 * this codebase owns its own data-boundary checks rather than importing
 * another adapter's private helper.
 *
 * Deliberately checks the actual RESULT, not the `status` label.
 * `FEATURED_MATCH` (lib/mockData.ts) is a real, live example of why: it's
 * kept at `status: "live"` on purpose so it stays visible in the
 * homepage's live carousel, even though it's a fully finished match with
 * a complete result and full ball-by-ball data. Gating on `status` alone
 * would incorrectly exclude a real player's real recorded performance in
 * that match — exactly the kind of "trust the label, not the truth" bug
 * this codebase has already caught and fixed elsewhere (the live-badge/
 * "LIVE" carveout in DECISIONS-LOG.md v1.0.67 for the same reason).
 */
function hasUsableResult(match: Match): boolean {
  const r: unknown = (match as unknown as Record<string, unknown>).result;
  if (!isObjectLike(r) || typeof r.winner !== "string" || r.winner.length === 0) return false;
  if (r.winner === "draw" || r.winner === "tie" || r.winner === "no-result") return true;
  return r.winner === match.teamA?.code || r.winner === match.teamB?.code;
}

/**
 * Every match this adapter is willing to draw entries from at all,
 * regardless of whether the MATCH overall has concluded — drawn from both
 * ALL_PAST_MATCHES and ALL_LIVE_MATCHES. Deliberately never
 * ALL_UPCOMING_MATCHES — an upcoming match has no innings data at all yet.
 *
 * v1.0.126.1 fix: this used to be filtered down to hasUsableResult(match)
 * only (i.e. the whole match must have a final result) before any of its
 * innings were even looked at. That's wrong at the wrong granularity — a
 * multi-innings match (any Test, or a T20/ODI mid-chase) can have entire
 * INNINGS that are already 100% finished and real (the team was bowled
 * out, or simply moved on to a later innings) while the MATCH ITSELF is
 * still genuinely live and unresolved. India's only Test appearance in
 * this mock dataset (`ind-eng-test-2026-d3-live`) is exactly this shape:
 * Day 3, England on the follow-on, no `result` yet -- so the OLD
 * match-level gate silently dropped Kohli's 121, Rohit's 83, and Gill's
 * 110 from India's fully-complete 1st innings, even though that innings
 * had already ended two innings ago. It also silently dropped ENGLAND's
 * own already-closed 1st-innings entries (Root, Crawley, Duckett,
 * Stokes' first knock) from THIS SAME match -- their Test graphs still
 * showed something only because they separately have entries from an
 * unrelated, genuinely concluded past Test (the Ashes). See
 * `eligibleEntriesFor()` below for the actual per-innings decision this
 * was replaced with -- the fix is granularity, not a name/team special
 * case, so it applies identically to every team and format.
 */
function candidateMatches(): Match[] {
  return [...ALL_PAST_MATCHES, ...ALL_LIVE_MATCHES];
}

/**
 * Per-innings eligibility for recent-form purposes. An innings entry
 * (one batter's or bowler's line in one innings) is trustworthy as real,
 * final, already-happened data if:
 *
 *   - it belongs to an innings that ISN'T the match's current/last one
 *     (`getCurrentInnings()` -- the SAME shared team/innings-linked
 *     lookup `ScoreBar.tsx` and `lib/playerActivity.ts` already use, per
 *     the "one function, not two independently-derived copies" rule this
 *     codebase has already been burned by twice). Any earlier innings is
 *     closed by construction -- the match moved on to a later one -- so
 *     nothing about it can still be "in progress."
 *   - OR the match as a whole already has a usable final result
 *     (`hasUsableResult`) -- covers both a genuinely concluded past match
 *     AND the FEATURED_MATCH-shaped case (kept at `status: "live"` on
 *     purpose, but with a real final result already attached).
 *   - OR, for the current innings of a still-genuinely-live match with no
 *     final result yet: a BATTING entry counts only once the player is
 *     personally dismissed (`out: true` -- their contribution is finished
 *     even though their team keeps batting, the same "team/innings still
 *     open doesn't mean THIS number is still changing" reasoning already
 *     established for the "Your Players" live-detection fix). A BOWLING
 *     entry never counts here -- an in-progress spell's wicket tally can
 *     still increase later in the same innings, unlike a dismissed
 *     batter's already-finished runs total, so it's excluded until the
 *     innings itself closes (or the match concludes).
 *
 * The `balls.length === 0` guard matches `lib/playerActivity.ts`'s own
 * guard for the same reason: a live match's current innings can have a
 * fully pre-authored placeholder battingCard/bowlingCard despite zero
 * recorded balls, and that's never real data, regardless of `out` status.
 */
function eligibleEntriesFor(
  match: Match,
  innings: { battingCard: unknown; bowlingCard: unknown; balls: unknown[] },
  isCurrentInnings: boolean
): { batting: boolean; bowling: boolean } {
  if (!isCurrentInnings) return { batting: true, bowling: true };
  if (hasUsableResult(match)) return { batting: true, bowling: true };
  if (!Array.isArray(innings.balls) || innings.balls.length === 0) return { batting: false, bowling: false };
  // Still genuinely live, current innings, real balls recorded: batting
  // entries are checked per-entry (`out === true`) below in the caller;
  // bowling entries are excluded outright here.
  return { batting: true, bowling: false };
}

function matchesFormatCategory(match: Match, format: PlayerFormatKey): boolean {
  if (format === "test") return match.format === "Test";
  if (format === "odi") return match.format === "ODI";
  if (format === "t20i") return match.format === "T20I";
  // franchise: anything that ISN'T one of the three international formats
  // above (domestic/league T20, The Hundred, etc.) — the same "franchise
  // = not international" boundary lib/spotlight.ts's isLeagueOrDomestic
  // check draws from the Competition side; this draws it from the format
  // string instead, since Test/ODI/T20I never appear on a league match.
  return match.format !== "Test" && match.format !== "ODI" && match.format !== "T20I";
}

/**
 * Loose name match against a player's full name OR short name — real
 * award data in this mock dataset is genuinely inconsistent about which
 * form it uses for the same player (e.g. one match's `manOfTournament` is
 * "Virat Kohli", another's is "V Kohli" — both are the same real person).
 * Trimmed, case-insensitive. Returns false for anything that isn't a
 * non-empty string, so a malformed award field never crashes this check.
 */
function namesMatch(recorded: unknown, player: PlayerProfile): boolean {
  if (typeof recorded !== "string" || !recorded.trim()) return false;
  const norm = (s: string) => s.trim().toLowerCase();
  const r = norm(recorded);
  return r === norm(player.name) || r === norm(player.shortName);
}

interface PlayerInningsEntry {
  value: number;
  isBowling: boolean;
  startTimeIso: string;
  inningsNumber: number;
  match: Match;
  /** The team code this specific entry credits the player to for THIS
   * match (`innings.battingTeam` or `.bowlingTeam`) — used later to derive
   * an achievement line's opponent from the real per-match record, not
   * from the player's current, possibly-stale `teamCode`/`franchiseCode`
   * profile field. */
  playerTeamCode: string | undefined;
  /** The real recorded `BattingEntry.out` flag for a batting entry --
   * carried through so getRecentForm() can surface not-out status on the
   * single-innings "Tier 1" callout (see RecentFormPoint.notOut below).
   * Meaningless for a bowling entry (`isBowling: true`) -- a bowling
   * spell has no "not out" concept -- and always `false` in that case;
   * callers must gate on `metric === "runs"` before reading this, never
   * read it standalone. */
  out: boolean;
}

/**
 * Every real recorded batting/bowling appearance for one player in one
 * format category, across every settled match app-wide — via the same
 * `resolvePlayerSlug()` identity resolution `PlayerNameLink` (components/
 * Scorecard.tsx) already uses to turn a battingCard/bowlingCard row's
 * `playerId` into a canonical `PLAYERS` registry key. That resolver is
 * also what already tolerates this dataset's inconsistent playerId forms
 * ("J Bumrah" vs "jbumrah" vs "zcrwly") — nothing here re-derives that
 * matching logic.
 *
 * Sorted deterministically ascending (oldest -> newest): by match date
 * first, then match id (a stable tiebreak for two matches sharing a
 * timestamp), then innings number within the same match — so a Test
 * batter's 1st-innings knock always sorts before their 2nd-innings knock
 * in the SAME match, regardless of which order the underlying arrays
 * happen to store things in. Never trusts `ALL_PAST_MATCHES`' own sort
 * order for this — it sorts newest-first for a different purpose (recent-
 * first schedule lists) and mixing that assumption in here would silently
 * break the moment that array's own sort ever changed.
 */
function extractPlayerEntries(player: PlayerProfile, format: PlayerFormatKey): PlayerInningsEntry[] {
  const entries: PlayerInningsEntry[] = [];
  for (const match of candidateMatches()) {
    if (!matchesFormatCategory(match, format)) continue;
    if (typeof match.startTimeIso !== "string" || !match.startTimeIso) continue;
    if (!Array.isArray(match.innings)) continue;

    const currentInnings = getCurrentInnings(match);

    for (const inningsRaw of match.innings as unknown[]) {
      if (!isObjectLike(inningsRaw)) continue;
      const inningsNumber = isFiniteNonNegative(inningsRaw.number) ? (inningsRaw.number as number) : 0;
      const isCurrentInnings = inningsRaw === (currentInnings as unknown);
      const eligible = eligibleEntriesFor(
        match,
        {
          battingCard: inningsRaw.battingCard,
          bowlingCard: inningsRaw.bowlingCard,
          balls: Array.isArray(inningsRaw.balls) ? (inningsRaw.balls as unknown[]) : [],
        },
        isCurrentInnings
      );
      // Still-live current innings with real balls: a batting entry only
      // counts once the player is personally dismissed -- see
      // eligibleEntriesFor()'s header comment. Every other case (an
      // already-closed earlier innings, or a match with a final result)
      // has no such per-entry restriction.
      const battingRequiresDismissal = eligible.batting && isCurrentInnings && !hasUsableResult(match);

      if (eligible.batting && Array.isArray(inningsRaw.battingCard)) {
        const battingTeam = typeof inningsRaw.battingTeam === "string" ? inningsRaw.battingTeam : undefined;
        for (const entryRaw of inningsRaw.battingCard as unknown[]) {
          if (!isObjectLike(entryRaw)) continue;
          if (typeof entryRaw.playerId !== "string" || !entryRaw.playerId) continue;
          if (resolvePlayerSlug(entryRaw.playerId) !== player.id) continue;
          if (!isFiniteNonNegative(entryRaw.runs)) continue;
          if (battingRequiresDismissal && entryRaw.out !== true) continue;
          entries.push({
            value: entryRaw.runs as number,
            isBowling: false,
            startTimeIso: match.startTimeIso,
            inningsNumber,
            match,
            playerTeamCode: battingTeam,
            out: entryRaw.out === true,
          });
        }
      }

      if (eligible.bowling && Array.isArray(inningsRaw.bowlingCard)) {
        const bowlingTeam = typeof inningsRaw.bowlingTeam === "string" ? inningsRaw.bowlingTeam : undefined;
        for (const entryRaw of inningsRaw.bowlingCard as unknown[]) {
          if (!isObjectLike(entryRaw)) continue;
          if (typeof entryRaw.playerId !== "string" || !entryRaw.playerId) continue;
          if (resolvePlayerSlug(entryRaw.playerId) !== player.id) continue;
          if (!isFiniteNonNegative(entryRaw.wickets)) continue;
          entries.push({
            value: entryRaw.wickets as number,
            isBowling: true,
            startTimeIso: match.startTimeIso,
            inningsNumber,
            match,
            playerTeamCode: bowlingTeam,
            // No "not out" concept for a bowling spell -- see PlayerInningsEntry.out's
            // doc comment. Never read for a wickets-metric point.
            out: false,
          });
        }
      }
    }
  }

  entries.sort((a, b) => {
    const dateCmp = a.startTimeIso.localeCompare(b.startTimeIso);
    if (dateCmp !== 0) return dateCmp;
    if (a.match.id !== b.match.id) return a.match.id.localeCompare(b.match.id);
    return a.inningsNumber - b.inningsNumber;
  });
  return entries;
}

/**
 * Decides whether the graph plots runs or wickets for a player/format that
 * has BOTH kinds of recorded entries (an all-rounder). Bowlers show
 * wickets; everyone else shows runs. A player with only ONE discipline
 * recorded for this format uses whichever one actually exists, regardless
 * of their listed `role` — real recorded data wins over a static label.
 */
function pickMetric(entries: PlayerInningsEntry[], player: PlayerProfile): "runs" | "wickets" {
  const hasBatting = entries.some(e => !e.isBowling);
  const hasBowling = entries.some(e => e.isBowling);
  if (hasBowling && !hasBatting) return "wickets";
  if (hasBatting && !hasBowling) return "runs";
  if (hasBatting && hasBowling) return player.role === "bowler" ? "wickets" : "runs";
  return "runs"; // no entries at all -- irrelevant, points will be empty
}

/**
 * A player's last-10-innings/spells series for one format, derived from
 * real match data. Format-scoped — switching the profile page's format
 * tab and calling this again with the new format returns that format's
 * own series, never a stale mix of two formats.
 *
 * Defensive against every malformed shape a real feed (or a hand-edited
 * mock match) could send: a match with no innings data, an innings that
 * isn't a real object, a battingCard/bowlingCard that isn't an array, an
 * individual entry with a non-string `playerId` or a non-finite/negative
 * `runs`/`wickets` value — all skipped without crashing or corrupting the
 * rest of the series.
 *
 * A player with zero settled matches in this format returns an empty
 * series — correctly, because there is genuinely nothing to show, not
 * because a side-field was never populated (see DECISIONS-LOG.md v1.0.118
 * for the diagnostic that led to this rebuild).
 */
export async function getRecentForm(
  player: PlayerProfile,
  format: PlayerFormatKey
): Promise<RecentFormSeries> {
  const entries = extractPlayerEntries(player, format);
  const metric = pickMetric(entries, player);
  const relevant = entries.filter(e => (metric === "wickets") === e.isBowling);
  const last10 = relevant.slice(-10);
  // v1.0.152: attach notOut only for a runs-metric point (see
  // RecentFormPoint.notOut's doc comment) -- a wickets-metric point never
  // gets this field at all, rather than a `false` that would imply the
  // concept applies and just happens to be false.
  return {
    points: last10.map(e => (
      metric === "runs" ? { value: e.value, notOut: !e.out } : { value: e.value }
    )),
    metric,
  };
}

// ----------------------------------------------------------------------------
// Achievements
// ----------------------------------------------------------------------------

/** "2026-07-08T10:00:00.000Z" -> "July 2026". Returns "" for anything that
 * doesn't parse to a real date, so a malformed timestamp degrades to
 * omitting the date clause rather than rendering "Invalid Date". */
function formatDateLabel(startTimeIso: unknown): string {
  if (typeof startTimeIso !== "string") return "";
  const d = new Date(startTimeIso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * The opponent team's full name for an achievement line — derived from
 * the SAME per-match entry that put this match in the player's window
 * (its recorded `battingTeam`/`bowlingTeam`), never from the player's
 * static `teamCode`/`franchiseCode` profile field. A profile field says
 * who a player plays for TODAY; a specific old match record is the real
 * source of truth for which side they were actually on IN THAT MATCH.
 * Returns undefined if the side can't be confidently determined (a
 * malformed/missing team code on either the entry or the match) — callers
 * omit the "vs X" clause entirely rather than guessing wrong.
 */
function opponentName(match: Match, playerTeamCode: string | undefined): string | undefined {
  if (!playerTeamCode) return undefined;
  if (match.teamA?.code === playerTeamCode) return match.teamB?.fullName;
  if (match.teamB?.code === playerTeamCode) return match.teamA?.fullName;
  return undefined;
}

interface DistinctMatchEntry {
  match: Match;
  playerTeamCode: string | undefined;
}

/**
 * The player's last N DISTINCT settled matches for one format — not the
 * same population as getRecentForm()'s last-10-innings/spells. Achievements
 * are match-level (Man of the Match) or series-level (Man of the Series),
 * scoped to "last 10 matches" (the product's own framing), while the graph
 * is scoped to "last 10 innings/spells" — a Test player who bats in both
 * innings of one match contributes 2 points to the graph's population but
 * only 1 match to this one. Built from the same extractPlayerEntries() list
 * (already ascending-chronological), deduped by match id while preserving
 * that order, so the last N here are genuinely the most recent N distinct
 * matches.
 */
function lastNDistinctMatches(player: PlayerProfile, format: PlayerFormatKey, n = 10): DistinctMatchEntry[] {
  const entries = extractPlayerEntries(player, format);
  const byId = new Map<string, DistinctMatchEntry>();
  for (const e of entries) {
    if (!byId.has(e.match.id)) {
      byId.set(e.match.id, { match: e.match, playerTeamCode: e.playerTeamCode });
    }
  }
  return [...byId.values()].slice(-n);
}

/**
 * A player's recent achievement lines for one format — one line per
 * qualifying achievement, stacking as many as genuinely apply (never just
 * the single most impressive one). Returns an empty array when nothing
 * qualifies; callers must render nothing at all in that case.
 *
 * Two achievement kinds, both derived from `Match.result` fields that
 * already exist and already power Scorecard.tsx's own "Man of Match"/
 * "Man of Series" banners (`manOfMatch`/`manOfTournament`) — no new award
 * data source:
 *   - Man of the Match count within the player's last 10 DISTINCT
 *     matches -> one line, singular/plural resolved in code ("Won 1 Man
 *     of the Match award" vs "Won 3 Man of the Match awards").
 *   - Man of the Series (`manOfTournament` — labelled "Man of Series" here
 *     to match Scorecard.tsx's own existing banner text for the same
 *     field) -> one line PER qualifying match in the window, so multiple
 *     awards stack as multiple lines rather than collapsing to one.
 *
 * Name matching uses namesMatch() (full name or short name, case-
 * insensitive) rather than requiring an exact string match, since this
 * mock dataset genuinely records the same player's name two different
 * ways across different matches ("Virat Kohli" vs "V Kohli").
 */
// ----------------------------------------------------------------------------
// Onboarding real-moment headline (v1.0.165)
// ----------------------------------------------------------------------------

/**
 * One-line summary of a player's single most recent recorded appearance
 * (batting OR bowling, whichever actually happened last -- unlike
 * getRecentForm()/pickMetric(), which scope to the player's ONE primary
 * discipline for the graph). Built directly on extractPlayerEntries(),
 * the same private per-appearance list every other function in this file
 * already derives from -- no second, parallel match-lookup path. Returns
 * `null` when the player has no real recorded appearance in this format
 * at all, so the caller can skip the moment entirely rather than render
 * an empty/placeholder line.
 */
export async function getLastInningsHeadline(
  player: PlayerProfile,
  format: PlayerFormatKey
): Promise<string | null> {
  const entries = extractPlayerEntries(player, format);
  if (entries.length === 0) return null;
  const last = entries[entries.length - 1]; // ascending-chronological -- last is most recent
  const opponent = opponentName(last.match, last.playerTeamCode);
  const dateLabel = formatDateLabel(last.startTimeIso);
  const opponentClause = opponent ? ` vs ${opponent}` : "";
  const dateClause = dateLabel ? `, ${dateLabel}` : "";
  if (last.isBowling) {
    return `${last.value} wkt${last.value === 1 ? "" : "s"}${opponentClause}${dateClause}`;
  }
  return `${last.value}${last.out ? "" : "*"} run${last.value === 1 ? "" : "s"}${opponentClause}${dateClause}`;
}

export async function getPlayerAchievements(
  player: PlayerProfile,
  format: PlayerFormatKey
): Promise<AchievementLine[]> {
  const window = lastNDistinctMatches(player, format, 10);
  const lines: AchievementLine[] = [];

  const momCount = window.filter(w => namesMatch(resultField(w.match, "manOfMatch"), player)).length;
  if (momCount > 0) {
    lines.push({
      text: `Won ${momCount} Man of the Match ${momCount === 1 ? "award" : "awards"} in last 10 matches`,
    });
  }

  for (const w of window) {
    if (!namesMatch(resultField(w.match, "manOfTournament"), player)) continue;
    const opponent = opponentName(w.match, w.playerTeamCode);
    const dateLabel = formatDateLabel(w.match.startTimeIso);
    let text = "Man of the Series";
    if (opponent) text += ` vs ${opponent}`;
    if (dateLabel) text += `, ${dateLabel}`;
    lines.push({ text });
  }

  return lines;
}

/**
 * Placeholder for a real recent-form/achievements sync mechanism — no-op
 * today, same reasoning as lib/teamData.ts's refreshRankings(). Exists so
 * a future feature has a stable function to call instead of one that has
 * to be invented when real data actually arrives.
 */
export function refreshPlayerForm(): Promise<void> {
  return Promise.resolve();
}
