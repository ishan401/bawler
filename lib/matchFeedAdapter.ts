// ============================================================================
// Match feed adapter — v1.0.134
// ============================================================================
// The ONE sanctioned entry point for a real ball-by-ball provider's raw
// feed, following the same real-data-readiness interface-first pattern
// documented in ARCHITECTURE.md and already used for team rankings
// (lib/teamData.ts), schedules (lib/teamSchedule.ts), and player form
// (lib/playerForm.ts) — this was the one subsystem without such a layer.
//
// `lib/dataValidation.ts`'s `normalizeMatch()` validates an object that's
// ALREADY shaped like Bawler's own Match/Innings/Ball types, field for
// field — it has no opinion on a real provider's actual wire format, which
// will use its own field names, casing, and event vocabulary.
// `ingestMatchFeed()` below is the layer above that: it accepts a raw
// provider payload in `RawFeedMatch` shape (this file's best-informed
// assumption about a realistic live-scores API — no live provider is
// connected yet, so this is a design choice, not a real contract),
// reshapes every field into Bawler's internal naming, and — critically —
// extracts any retirement event out of each innings' event stream into
// `Innings.retirements` BEFORE the result ever reaches `normalizeMatch()`
// or any other part of the app.
//
// WHY THE EXTRACTION STEP EXISTS: several real ball-by-ball providers
// interleave delivery and non-delivery events in one flat sequence per
// innings (a retirement, a drinks break, etc. sitting inline between two
// deliveries). `RawFeedInnings.events` below is modeled that way
// deliberately, as the realistic case to guard against. If a retirement
// event were mapped straight into `Innings.balls` the way a delivery is,
// it would be counted as a real ball by every downstream consumer that
// assumes each `balls[]` entry is exactly one delivery toward
// `ballsPerSet(format)` — concretely proven (DECISIONS-LOG.md v1.0.133) to
// either inflate a real over's legal-ball count (corrupting that over's
// bowler's figures) or, if given an out-of-range over number instead,
// get misidentified as the new "current" over and prematurely close out
// the genuinely current one. See RetirementRecord's doc comment in
// lib/types.ts for the full rationale of why retirement lives in its own
// side-channel instead.
//
// HOW TO USE THIS WHEN A REAL PROVIDER IS CONNECTED
//   const raw = await fetch(liveFeedUrl).then(r => r.json());
//   const result = ingestMatchFeed(raw, { source: "<provider name>" });
//   if (!result.ok) {
//     // result.errors — log it, alert on it, and do not render this match.
//     return null;
//   }
//   setMatch(result.match); // guaranteed to satisfy the Match shape,
//                           // including a correctly side-channeled
//                           // Innings.retirements for any player who left
//                           // the innings without being properly dismissed
//
// Nothing should call `normalizeMatch()` directly against genuinely raw
// provider JSON — only against something already Bawler-shaped (a mock
// fixture, a generated test object, or this adapter's own transformed
// output, which is exactly what it does internally below).
// ============================================================================

import type { RetirementRecord, RetirementType, MatchFormat, Ball } from "./types";
import { normalizeMatch, type NormalizeResult } from "./dataValidation";
import { countWicketEquivalentRetirements } from "./matchStatus";
import { ballsPerSet } from "./formatUtils";

// ── Raw feed shape (best-informed assumption; no live provider connected yet) ──

export interface RawFeedTeam {
  code: string;
  short_name: string;
  full_name: string;
  primary_color: string;
  secondary_color: string;
}

export interface RawFeedVenue {
  id: string;
  name: string;
  city: string;
  country?: string;
}

export interface RawFeedCompetition {
  id: string;
  name: string;
  short_name: string;
  type: string; // "league" | "international" | "bilateral" | "domestic"
  format: string;
  has_standings?: boolean;
}

/** One ball-by-ball delivery, in the raw feed's own field naming. */
export interface RawFeedDelivery {
  event_type: "delivery";
  id: string;
  over: number;
  ball_in_over: number;
  batter_id: string;
  batter_name: string;
  bowler_id: string;
  bowler_name: string;
  runs: number;
  extras: number;
  extra_type?: string;
  is_wicket: boolean;
  // Never "retired" here in a well-formed feed — see RawFeedRetirementEvent.
  // If a provider DOES send it this way regardless, ingestMatchFeed does
  // not special-case it: it flows through to normalizeMatch()'s validateBall,
  // which hard-rejects it (see lib/dataValidation.ts v1.0.134). A raw feed
  // that conflates the two must be fixed at its own source, not silently
  // reinterpreted here.
  dismissal_type?: string;
  is_four: boolean;
  is_six: boolean;
  timestamp: string;
}

/**
 * A retirement, reported by the provider as its own event INLINE in the
 * same ball-by-ball sequence as deliveries — the realistic case this
 * adapter exists to guard against (see module header). `retirement_type`
 * is the provider's own vocabulary, not Bawler's internal
 * `RetirementType` — translated by `adaptRetirementType()` below.
 */
export interface RawFeedRetirementEvent {
  event_type: "retirement";
  player_id: string;
  player_name: string;
  retirement_type: "not_out" | "given_out";
  // The raw `id` of the last delivery bowled before this retirement, or
  // null/undefined if it happened before the innings' first ball.
  after_event_id?: string | null;
  timestamp: string;
}

export type RawFeedEvent = RawFeedDelivery | RawFeedRetirementEvent;

export interface RawFeedInnings {
  innings_number: number;
  batting_team: string;
  bowling_team: string;
  // Provider-reported totals, when available — used as-is; if absent,
  // this adapter computes them from `events` instead (see adaptInnings).
  runs?: number;
  wickets?: number;
  events: RawFeedEvent[];
}

export interface RawFeedMatch {
  match_id: string;
  format: string;
  status: string;
  start_time: string;
  competition: RawFeedCompetition;
  venue: RawFeedVenue;
  team_a: RawFeedTeam;
  team_b: RawFeedTeam;
  innings?: RawFeedInnings[];
}

// ── mapping helpers ──────────────────────────────────────────────────────

function adaptTeam(t: RawFeedTeam) {
  return {
    code: t.code,
    shortName: t.short_name,
    fullName: t.full_name,
    primaryColor: t.primary_color,
    secondaryColor: t.secondary_color,
  };
}

function adaptVenue(v: RawFeedVenue) {
  return { id: v.id, name: v.name, city: v.city, country: v.country };
}

function adaptCompetition(c: RawFeedCompetition) {
  return {
    id: c.id,
    name: c.name,
    shortName: c.short_name,
    type: c.type,
    format: c.format,
    hasStandings: c.has_standings ?? false,
  };
}

function adaptRetirementType(raw: "not_out" | "given_out"): RetirementType {
  return raw === "given_out" ? "retired-out" : "retired-not-out";
}

function isDeliveryEvent(e: RawFeedEvent): e is RawFeedDelivery {
  return e.event_type === "delivery";
}
function isRetirementEvent(e: RawFeedEvent): e is RawFeedRetirementEvent {
  return e.event_type === "retirement";
}

/**
 * Splits one innings' raw event stream into (a) real deliveries, mapped
 * into Bawler's `Ball` shape, and (b) retirement events, mapped into
 * `RetirementRecord` and kept COMPLETELY separate from `balls` — this is
 * the one step this whole file exists for. `after_event_id` (a raw
 * delivery's own `id`) maps directly to `afterBallId`, since this adapter
 * preserves delivery ids as-is rather than regenerating them. `overs` is
 * intentionally left for the caller to fill in (see ingestMatchFeed) —
 * it needs the match-level `format`, which isn't known at this per-innings
 * scope.
 */
function adaptInnings(raw: RawFeedInnings) {
  const balls: Ball[] = raw.events.filter(isDeliveryEvent).map(e => ({
    id: e.id,
    inningsNumber: raw.innings_number as 1 | 2 | 3 | 4,
    over: e.over,
    ballInOver: e.ball_in_over,
    timestampIso: e.timestamp,
    batterId: e.batter_id,
    batterName: e.batter_name,
    bowlerId: e.bowler_id,
    bowlerName: e.bowler_name,
    runs: e.runs,
    extras: e.extras,
    extraType: e.extra_type as Ball["extraType"],
    isWicket: e.is_wicket,
    dismissalType: e.dismissal_type as Ball["dismissalType"],
    isBoundary4: e.is_four,
    isBoundary6: e.is_six,
  }));

  const retirements: RetirementRecord[] = raw.events.filter(isRetirementEvent).map(e => ({
    playerId: e.player_id,
    playerName: e.player_name,
    type: adaptRetirementType(e.retirement_type),
    afterBallId: e.after_event_id ?? undefined,
  }));

  // Prefer the provider's own reported totals when present (a real feed
  // usually does report them directly, cheaper than recomputing); fall
  // back to deriving from `events` otherwise. Wickets folds in any
  // "retired -- out" occurrence via the same shared helper
  // MatchView.tsx's live truncation uses, so this can't silently drift
  // out of sync with that logic (see countWicketEquivalentRetirements in
  // lib/matchStatus.ts).
  const computedRuns = balls.reduce((s, b) => s + b.runs + b.extras, 0);
  const computedWickets =
    balls.filter(b => b.isWicket).length + countWicketEquivalentRetirements(retirements, balls);

  return {
    number: raw.innings_number,
    battingTeam: raw.batting_team,
    bowlingTeam: raw.bowling_team,
    runs: raw.runs ?? computedRuns,
    wickets: raw.wickets ?? computedWickets,
    lastBall: balls[balls.length - 1],
    balls,
    battingCard: [] as unknown[], // a scorecard endpoint is a separate concern, out of scope here — every consumer already derives live per-player cards from `balls` (see lib/matchStatus.ts's deriveBattingCardFromBalls/deriveBowlingCardFromBalls)
    bowlingCard: [] as unknown[],
    retirements: retirements.length > 0 ? retirements : undefined,
  };
}

/**
 * The ONE sanctioned entry point for a real ball-by-ball provider's raw
 * feed. Reshapes `raw` into Bawler's internal Match/Innings/Ball naming,
 * extracts every retirement event out of each innings' event stream into
 * its own `retirements` side-channel (see module header), then delegates
 * to `normalizeMatch()` for the actual field-level validation — this
 * function does not duplicate that logic, only the shape translation and
 * retirement-extraction step upstream of it.
 *
 * Never throws (matches `normalizeMatch()`'s contract) — a malformed or
 * unexpected raw payload always resolves to `{ ok: false }`.
 */
export function ingestMatchFeed(raw: RawFeedMatch, opts?: { source?: string }): NormalizeResult {
  const source = opts?.source ?? "matchFeedAdapter.ingestMatchFeed";

  // This function's whole job is to handle input whose SHAPE we don't
  // control, so a malformed top-level raw object (wrong type, a missing
  // nested object a field-access would throw on) must degrade to one
  // clear error rather than crashing the caller — normalizeMatch's own
  // field-by-field report only runs once we've gotten this far safely.
  let shaped: unknown;
  try {
    const innings = (raw.innings ?? []).map(adaptInnings).map(inn => {
      const overs = inn.lastBall
        ? inn.lastBall.over - 1 + (inn.lastBall.ballInOver + 1) / ballsPerSet(raw.format as MatchFormat)
        : 0;
      const { lastBall: _lastBall, ...rest } = inn;
      return { ...rest, overs: Math.round(overs * 10) / 10 };
    });

    shaped = {
      id: raw.match_id,
      format: raw.format,
      status: raw.status,
      startTimeIso: raw.start_time,
      competition: adaptCompetition(raw.competition),
      venue: adaptVenue(raw.venue),
      teamA: adaptTeam(raw.team_a),
      teamB: adaptTeam(raw.team_b),
      innings,
    };
  } catch {
    return {
      ok: false,
      match: null,
      errors: [{
        path: "$",
        message: "raw feed payload is missing required top-level fields (match_id/format/status/start_time/competition/venue/team_a/team_b)",
      }],
    };
  }

  return normalizeMatch(shaped, { source });
}
