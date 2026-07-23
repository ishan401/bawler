// ============================================================================
// Data validation / adapter layer — the boundary between "whatever a real
// live-scores API sends us" and the app's internal Match/Ball shapes.
// ============================================================================
// WHY THIS EXISTS
//   Match/Ball/Team/etc. in lib/types.ts are compile-time-only contracts —
//   TypeScript checks the SHAPE of data we WRITE in our own code (mock
//   generators, tests), but it cannot check anything arriving at runtime
//   over the network. A real API can send a field with the wrong type, a
//   missing field, a null where a number is expected, or a differently-cased
//   enum value, and none of that would be caught until it silently produces
//   wrong output deep inside a narrative string or a win-probability chart —
//   or a raw crash.
//
// HOW TO USE THIS WHEN THE REAL API ARRIVES
//   Wherever the app fetches a match from the live API, pass the raw JSON
//   through `normalizeMatch(raw, { source: "<endpoint or feed name>" })`
//   BEFORE it touches any component, narrative builder, or win-prob
//   calculation. Example:
//
//     const raw = await fetch(liveScoresUrl).then(r => r.json());
//     const result = normalizeMatch(raw, { source: "acme-live-scores" });
//     if (!result.ok) {
//       // result.errors is a human-readable list — log it, alert on it,
//       // and DO NOT render this match. Falling back to "no data" is much
//       // safer than rendering a match built from a malformed object.
//       return null;
//     }
//     setMatch(result.match); // guaranteed to satisfy the Match shape
//
//   `generatePastMatches`/`generateFutureMatches` in lib/matchGenerator.ts
//   are wired through this same validator today (see matchGenerator.ts) —
//   that's the template for how a real fetch-based adapter should plug in:
//   validate every object at the boundary, never past it.
// ============================================================================

import type { Match, Ball, Innings, Team, Venue, Competition, MatchFormat, MatchStatus } from "./types";

const VALID_FORMATS: MatchFormat[] = ["T20", "T20I", "ODI", "Test", "Hundred"];
const VALID_STATUSES: MatchStatus[] = ["upcoming", "pre-match", "toss", "live", "innings-break", "post-match"];
const VALID_COMPETITION_TYPES = ["league", "international", "bilateral", "domestic"];
const VALID_DISMISSALS = ["bowled", "caught", "lbw", "run-out", "stumped", "hit-wicket", "retired"];
const VALID_EXTRA_TYPES = ["wd", "nb", "b", "lb", "pen"];

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface NormalizeSuccess {
  ok: true;
  match: Match;
  /** Non-blocking issues found on optional fields — logged, not fatal. */
  warnings: ValidationIssue[];
}

export interface NormalizeFailure {
  ok: false;
  match: null;
  errors: ValidationIssue[];
}

export type NormalizeResult = NormalizeSuccess | NormalizeFailure;

// ── tiny runtime-type helpers ────────────────────────────────────────────────

function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isIsoDate(v: unknown): v is string {
  if (!isString(v)) return false;
  const t = new Date(v).getTime();
  return Number.isFinite(t);
}

// ── field-level validators ───────────────────────────────────────────────────
// Each validator pushes into `errors` (required, blocking) or `warnings`
// (optional, non-blocking) and returns nothing — callers keep going so a
// single bad field doesn't hide every OTHER problem in the same object.
// The goal is one full report per object, not "fail on first error."

function validateVenue(raw: unknown, path: string, errors: ValidationIssue[]): raw is Venue {
  if (!isObject(raw)) {
    errors.push({ path, message: `expected an object, got ${typeOf(raw)}` });
    return false;
  }
  requireString(raw.id, `${path}.id`, errors);
  requireString(raw.name, `${path}.name`, errors);
  requireString(raw.city, `${path}.city`, errors);
  return errors.length === 0;
}

function validateTeam(raw: unknown, path: string, errors: ValidationIssue[]): raw is Team {
  if (!isObject(raw)) {
    errors.push({ path, message: `expected an object, got ${typeOf(raw)}` });
    return false;
  }
  requireString(raw.code, `${path}.code`, errors);
  requireString(raw.shortName, `${path}.shortName`, errors);
  requireString(raw.fullName, `${path}.fullName`, errors);
  // primaryColor/secondaryColor: this only confirms they're non-empty
  // strings, not valid hex colors -- see requireString's doc comment
  // above. lib/teamAccentColor.ts's sanitizeHexColor() is the real
  // format guard for these two fields, applied downstream at the point
  // where the color actually gets used, not here.
  requireString(raw.primaryColor, `${path}.primaryColor`, errors);
  requireString(raw.secondaryColor, `${path}.secondaryColor`, errors);
  return true;
}

function validateCompetition(raw: unknown, path: string, errors: ValidationIssue[]): raw is Competition {
  if (!isObject(raw)) {
    errors.push({ path, message: `expected an object, got ${typeOf(raw)}` });
    return false;
  }
  requireString(raw.id, `${path}.id`, errors);
  requireString(raw.name, `${path}.name`, errors);
  requireString(raw.shortName, `${path}.shortName`, errors);
  requireEnum(raw.type, VALID_COMPETITION_TYPES, `${path}.type`, errors);
  requireEnum(raw.format, VALID_FORMATS, `${path}.format`, errors);
  if (raw.hasStandings !== undefined && !isBool(raw.hasStandings)) {
    errors.push({ path: `${path}.hasStandings`, message: `expected boolean, got ${typeOf(raw.hasStandings)}` });
  }
  return true;
}

function validateBall(raw: unknown, path: string, errors: ValidationIssue[], warnings: ValidationIssue[]): raw is Ball {
  if (!isObject(raw)) {
    errors.push({ path, message: `expected an object, got ${typeOf(raw)}` });
    return false;
  }
  requireString(raw.id, `${path}.id`, errors);
  requireFiniteNumber(raw.over, `${path}.over`, errors);
  requireFiniteNumber(raw.ballInOver, `${path}.ballInOver`, errors);
  requireString(raw.batterId, `${path}.batterId`, errors);
  requireString(raw.batterName, `${path}.batterName`, errors);
  requireString(raw.bowlerId, `${path}.bowlerId`, errors);
  requireString(raw.bowlerName, `${path}.bowlerName`, errors);
  requireFiniteNumber(raw.runs, `${path}.runs`, errors);
  requireFiniteNumber(raw.extras, `${path}.extras`, errors);
  requireBool(raw.isWicket, `${path}.isWicket`, errors);
  requireBool(raw.isBoundary4, `${path}.isBoundary4`, errors);
  requireBool(raw.isBoundary6, `${path}.isBoundary6`, errors);

  // timestampIso is load-bearing for Test session derivation and any
  // time-ordering logic — treat a missing/invalid one as a hard error
  // rather than letting it silently fall out of session grouping.
  if (raw.timestampIso === undefined || raw.timestampIso === null) {
    errors.push({ path: `${path}.timestampIso`, message: "missing — required for session/ordering logic" });
  } else if (!isIsoDate(raw.timestampIso)) {
    errors.push({ path: `${path}.timestampIso`, message: `not a valid ISO date: ${JSON.stringify(raw.timestampIso)}` });
  }

  if (raw.extraType !== undefined && raw.extraType !== null && !VALID_EXTRA_TYPES.includes(raw.extraType as string)) {
    warnings.push({ path: `${path}.extraType`, message: `unrecognized extraType ${JSON.stringify(raw.extraType)} — ignoring` });
  }
  if (raw.dismissalType !== undefined && raw.dismissalType !== null && !VALID_DISMISSALS.includes(raw.dismissalType as string)) {
    warnings.push({ path: `${path}.dismissalType`, message: `unrecognized dismissalType ${JSON.stringify(raw.dismissalType)}` });
  }
  return true;
}

function validateInnings(raw: unknown, path: string, errors: ValidationIssue[], warnings: ValidationIssue[]): raw is Innings {
  if (!isObject(raw)) {
    errors.push({ path, message: `expected an object, got ${typeOf(raw)}` });
    return false;
  }
  requireFiniteNumber(raw.number, `${path}.number`, errors);
  requireString(raw.battingTeam, `${path}.battingTeam`, errors);
  requireString(raw.bowlingTeam, `${path}.bowlingTeam`, errors);

  // `runs`/`wickets` drive target/win-prob math directly (see lib/winProb.ts)
  // — a missing value here is exactly the class of bug that produced the
  // `target!` NaN risk. Flag it loudly instead of letting `0`/`undefined`
  // ambiguity pass silently.
  if (raw.runs === undefined || raw.runs === null) {
    warnings.push({ path: `${path}.runs`, message: "missing — win-prob/target math will treat this innings as not-yet-started" });
  } else if (!isFiniteNumber(raw.runs)) {
    errors.push({ path: `${path}.runs`, message: `expected number, got ${typeOf(raw.runs)}` });
  }
  if (raw.wickets !== undefined && raw.wickets !== null && !isFiniteNumber(raw.wickets)) {
    errors.push({ path: `${path}.wickets`, message: `expected number, got ${typeOf(raw.wickets)}` });
  }

  if (raw.balls !== undefined) {
    if (!Array.isArray(raw.balls)) {
      errors.push({ path: `${path}.balls`, message: `expected an array, got ${typeOf(raw.balls)}` });
    } else {
      raw.balls.forEach((b, i) => validateBall(b, `${path}.balls[${i}]`, errors, warnings));
    }
  }
  return true;
}

// `requireString` only answers "IS this a non-empty string" -- it has no
// opinion on whether that string is a VALID instance of whatever the field
// actually represents (a hex color, an enum-like free-text status, an
// ID matching some external format). That's a real, previously-unguarded
// gap: `validateTeam` below calls this for `primaryColor`/`secondaryColor`,
// so a real feed sending `"blue"`, `"rgb(0,0,0)"`, or a bare hex with no
// `#` passes this check cleanly (all non-empty strings) and reaches
// lib/teamAccentColor.ts's contrast/Delta E math completely unvalidated --
// exactly the gap `sanitizeHexColor()` in that file closes at its own
// boundary (see that file's v1.0.108 module comment, and ARCHITECTURE.md's
// real-data-readiness pattern). This is the template for any other
// loosely-typed string field validated here: `requireString` alone is
// necessary but not sufficient whenever "is it a string" and "is it a
// VALID one" are different questions -- add a format-specific check at
// whichever module actually consumes the field, the same way
// `sanitizeHexColor` does, rather than assuming this function already
// covers it.
function requireString(v: unknown, path: string, errors: ValidationIssue[]): void {
  if (!isString(v) || v.length === 0) errors.push({ path, message: `expected a non-empty string, got ${typeOf(v)}` });
}
function requireFiniteNumber(v: unknown, path: string, errors: ValidationIssue[]): void {
  if (!isFiniteNumber(v)) errors.push({ path, message: `expected a finite number, got ${typeOf(v)}` });
}
function requireBool(v: unknown, path: string, errors: ValidationIssue[]): void {
  if (!isBool(v)) errors.push({ path, message: `expected a boolean, got ${typeOf(v)}` });
}
function requireEnum(v: unknown, allowed: readonly string[], path: string, errors: ValidationIssue[]): void {
  if (!isString(v) || !allowed.includes(v)) {
    errors.push({ path, message: `expected one of ${allowed.join("|")}, got ${JSON.stringify(v)}` });
  }
}
function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

// ── top-level entry point ────────────────────────────────────────────────────

/**
 * Validate a raw object (e.g. straight off a `fetch().json()`) against the
 * shape the app requires, and either hand back a Match guaranteed to match
 * that shape, or refuse it with a full list of what's wrong.
 *
 * This never throws — malformed input always resolves to `{ ok: false }`
 * rather than crashing the caller, so a bad payload can be handled as a
 * normal "couldn't load this match" state.
 */
export function normalizeMatch(raw: unknown, opts?: { source?: string }): NormalizeResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const source = opts?.source ?? "unknown-source";

  if (!isObject(raw)) {
    errors.push({ path: "$", message: `expected an object, got ${typeOf(raw)}` });
    logFailure(source, errors);
    return { ok: false, match: null, errors };
  }

  requireString(raw.id, "$.id", errors);
  requireEnum(raw.format, VALID_FORMATS, "$.format", errors);
  requireEnum(raw.status, VALID_STATUSES, "$.status", errors);
  if (raw.startTimeIso === undefined || !isIsoDate(raw.startTimeIso)) {
    errors.push({ path: "$.startTimeIso", message: `expected a valid ISO date, got ${JSON.stringify(raw.startTimeIso)}` });
  }

  validateCompetition(raw.competition, "$.competition", errors);
  validateVenue(raw.venue, "$.venue", errors);
  validateTeam(raw.teamA, "$.teamA", errors);
  validateTeam(raw.teamB, "$.teamB", errors);

  if (raw.innings !== undefined) {
    if (!Array.isArray(raw.innings)) {
      errors.push({ path: "$.innings", message: `expected an array, got ${typeOf(raw.innings)}` });
    } else {
      raw.innings.forEach((inn, i) => validateInnings(inn, `$.innings[${i}]`, errors, warnings));
    }
  } else {
    warnings.push({ path: "$.innings", message: "missing — treating as no innings started yet" });
  }

  if (errors.length > 0) {
    logFailure(source, errors);
    return { ok: false, match: null, errors };
  }

  if (warnings.length > 0) logWarnings(source, warnings);

  return { ok: true, match: raw as unknown as Match, warnings };
}

function logFailure(source: string, errors: ValidationIssue[]): void {
  // eslint-disable-next-line no-console
  console.error(
    `[Bawler:DataValidation] REJECTED malformed match data from "${source}" — ${errors.length} error(s):\n` +
      errors.map(e => `  • ${e.path}: ${e.message}`).join("\n")
  );
}

function logWarnings(source: string, warnings: ValidationIssue[]): void {
  // eslint-disable-next-line no-console
  console.warn(
    `[Bawler:DataValidation] Match data from "${source}" has ${warnings.length} non-fatal issue(s):\n` +
      warnings.map(w => `  • ${w.path}: ${w.message}`).join("\n")
  );
}
