// Verifies the Tournaments/Series split (v1.0.88): bilateral series must be
// excluded from Tournaments and included in Series, and qualifyMatch must
// still treat a followed series as a Tier 1 match.
import { COMPETITIONS, NATIONAL_TEAMS } from "../lib/mockData";
import {
  emptyFollowPrefs,
  qualifyMatch,
  isTier1Match,
  sanitizeFollowPrefs,
} from "../lib/followPrefs";
import type { Match } from "../lib/types";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

const tournaments = Object.values(COMPETITIONS).filter(c => c.type !== "bilateral");
const series = Object.values(COMPETITIONS).filter(c => c.type === "bilateral");

assert(
  !tournaments.some(c => c.type === "bilateral"),
  "Tournaments list contains zero bilateral entries"
);
assert(
  series.every(c => c.type === "bilateral"),
  "Series list contains only bilateral entries"
);
assert(
  series.some(c => c.name === "India tour of Australia 2026"),
  "'India tour of Australia 2026' is in the Series list"
);
assert(
  series.some(c => c.name === "India tour of England 2026"),
  "'India tour of England 2026' is in the Series list"
);
assert(
  !tournaments.some(c => c.name.includes("tour of")),
  "No 'tour of' style entry remains in Tournaments"
);
assert(
  tournaments.some(c => c.name === "Big Bash League 2025-26") &&
    tournaments.some(c => c.name === "IPL 2026") &&
    tournaments.some(c => c.name === "ICC Champions Trophy 2025") &&
    tournaments.some(c => c.name === "ICC T20 World Cup 2026") &&
    tournaments.some(c => c.name.startsWith("ICC World Test Championship")),
  "Genuine multi-team competitions (BBL, IPL, Champions Trophy, T20 WC, WTC) remain in Tournaments"
);

// qualifyMatch: following a series should still surface it as Tier 1,
// exactly as a tournament-follow does today -- just stored under `series`.
const indAus = COMPETITIONS.indAusT20i2026;
const fakeMatch = {
  id: "fake",
  format: indAus.format,
  competition: indAus,
  matchNumber: "Match 1",
  startTimeIso: new Date().toISOString(),
  status: "upcoming",
  venue: { id: "v", name: "V", city: "C", country: "AUS" },
  teamA: NATIONAL_TEAMS.IND,
  teamB: NATIONAL_TEAMS.AUS,
  innings: [],
} as unknown as Match;

const prefsWithSeries = { ...emptyFollowPrefs(), series: [indAus.id] };
const q = qualifyMatch(fakeMatch, prefsWithSeries);
assert(q.series === true, "qualifyMatch flags series:true when the series is followed");
assert(isTier1Match(q), "A followed series counts as a Tier 1 match");

const prefsWithoutFollow = emptyFollowPrefs();
const q2 = qualifyMatch(fakeMatch, prefsWithoutFollow);
assert(!isTier1Match(q2), "An unfollowed series match does not count as Tier 1");

// sanitizeFollowPrefs: a stale bilateral id sitting under `tournaments`
// (e.g. pre-migration stored data) is dropped, not silently honored under
// the wrong category.
const staleTournaments = { ...emptyFollowPrefs(), tournaments: [indAus.id] };
const cleaned = sanitizeFollowPrefs(staleTournaments);
assert(
  !cleaned.tournaments.includes(indAus.id),
  "A bilateral id stored under tournaments is dropped by sanitizeFollowPrefs (no longer valid there)"
);

// And the same id under `series` survives sanitization.
const validSeries = { ...emptyFollowPrefs(), series: [indAus.id] };
const cleaned2 = sanitizeFollowPrefs(validSeries);
assert(
  cleaned2.series.includes(indAus.id),
  "The same bilateral id stored under series survives sanitizeFollowPrefs"
);

console.log(`\nTournaments (${tournaments.length}):`, tournaments.map(c => c.name).join(", "));
console.log(`Series (${series.length}):`, series.map(c => c.name).join(", "));
