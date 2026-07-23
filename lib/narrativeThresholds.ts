// ============================================================================
// Narrative thresholds — the magic numbers behind Digest tab's copy
// ============================================================================
// Every "big over", "collapse", "tight session" etc. judgment in
// components/DigestTab.tsx used to be an inline number scattered across
// three functions. That made two things hard: (1) seeing all the tuning
// knobs in one place, and (2) retuning them against real match data after
// launch without touching code (and redeploying) every time.
//
// This file is the single source of truth for those numbers. Defaults below
// match exactly what shipped before this file existed — recalibrating them
// against real historical scoring data is a follow-up, data-driven task
// (this file just makes that possible without a code change).
//
// RUNTIME OVERRIDE (no redeploy required):
//   getNarrativeThresholds() merges a partial override over the defaults
//   on every read. The override lives in localStorage under the key
//   "bawler:narrativeThresholds". setNarrativeThresholdOverride()/
//   clearNarrativeThresholdOverride() below are the intended way to
//   write/clear that key from CODE that imports this module (e.g. a
//   future hidden admin control) -- they are plain exported functions,
//   NOT attached to `window`, so typing their name directly into the
//   browser console will throw "not defined". To override from the
//   console today, write the key directly instead:
//
//     localStorage.setItem('bawler:narrativeThresholds', JSON.stringify({
//       narrative: { bigOverRunsDefault: 16 }
//     }));
//     location.reload();
//
//   Clear it the same way:
//     localStorage.removeItem('bawler:narrativeThresholds');
//     location.reload();
//
//   A full page reload (not just re-navigating within the app) is
//   required after changing the override -- DigestTab.tsx reads the real
//   value inside a useEffect after mount (kept out of the render path on
//   purpose, see DECISIONS-LOG.md FY29 for why), and that effect also
//   clears its per-card cache so already-COMPLETE over/session/day cards
//   rebuild against the new value instead of staying frozen with
//   whatever was cached before the override was read. FY29 also has a
//   real worked example (exact match, session, wicket/run counts, and
//   copy-pasteable console commands) for independently re-verifying this
//   mechanism end to end.
// ============================================================================

export interface NarrativeThresholds {
  narrative: {
    /** buildNarrative()'s "big <span>" run threshold, ODI overs/blocks. */
    bigOverRunsODI: number;
    /** buildNarrative()'s "big <span>" run threshold, Test sessions. */
    bigOverRunsTest: number;
    /** buildNarrative()'s "big <span>" run threshold, T20/T20I/Hundred overs. */
    bigOverRunsDefault: number;
    /** Wickets in a chunk needed to call it a "collapse". */
    wicketsCollapse: number;
    /** Runs-with-a-wicket needed for the combined "runs & a wicket" line. */
    runsWithWicketNotable: number;
    /** Sixes needed to say the batter is "in flow". */
    sixesInFlow: number;
    /** Fours needed to say "boundaries flowing". */
    foursFlowing: number;
    /** Runs-or-under (with zero wickets) to call a chunk "tight". */
    tightOverRuns: number;
  };
  overSummary: {
    /** Wickets needed for the over-summary "collapse" phrasing. */
    wicketsCollapse: number;
    /** Wickets needed for the "game just tilted" swing phrasing. */
    wicketsSwing: number;
    /** Runs needed for the "relentless" huge-over phrasing. */
    runsHugeOver: number;
    /** Runs needed for the "statement over" big-over phrasing. */
    runsBigOver: number;
    /** Sixes needed for the "cleared the ropes" phrasing. */
    sixesInFlow: number;
    /** Fours needed for the "boundaries everywhere" phrasing. */
    foursFlowing: number;
    /** Runs-or-under to call the over "tight, disciplined". */
    tightOverRuns: number;
  };
  dayReport: {
    /** Day total wickets for the "bowler's masterclass" line. */
    bowlerMasterclassWickets: number;
    /** Day total wickets-or-under for the "batter's paradise" line. */
    battersParadiseMaxWickets: number;
    /** Day total wickets for the "swung decisively" line. */
    daySwungWickets: number;
    /** Session wickets for "dominated by X, dismantled the innings". */
    sessionDominantBowlingWickets: number;
    /** Session wickets for "sustained bowling effort". */
    sessionStrongBowlingWickets: number;
    /** Session runs (0 wickets) for "dominant batting session". */
    sessionDominantBattingRuns: number;
    /** Session runs (0 wickets) for "steady" batting phrasing. */
    sessionSteadyBattingRuns: number;
    /** Session runs-or-under alongside sessionSwingMinWickets for "swung the match". */
    sessionSwingMaxRuns: number;
    /** Session wickets alongside sessionSwingMaxRuns for "swung the match". */
    sessionSwingMinWickets: number;
    /** Top bowler's day wickets for "story of the day" phrasing. */
    starBowlerWickets: number;
    /** Top bowler's day wickets for "pick of the bowlers" phrasing. */
    goodBowlerWickets: number;
    /** Combined fours+sixes for the day's boundary-count fallback line. */
    boundaryHeavyCount: number;
    /** Day wickets for the "scales have tilted sharply" match-context line. */
    matchTiltedWickets: number;
    /** Overs bowled below this, in a COMPLETE session, reads as weather/bad-light-shortened rather than genuinely "tight" cricket. */
    shortenedSessionMaxOvers: number;
  };
}

export const DEFAULT_NARRATIVE_THRESHOLDS: NarrativeThresholds = {
  narrative: {
    bigOverRunsODI: 30,
    bigOverRunsTest: 50,
    bigOverRunsDefault: 14,
    wicketsCollapse: 3,
    runsWithWicketNotable: 10,
    sixesInFlow: 2,
    foursFlowing: 3,
    tightOverRuns: 3,
  },
  overSummary: {
    wicketsCollapse: 3,
    wicketsSwing: 2,
    runsHugeOver: 18,
    runsBigOver: 14,
    sixesInFlow: 2,
    foursFlowing: 3,
    tightOverRuns: 4,
  },
  dayReport: {
    bowlerMasterclassWickets: 10,
    battersParadiseMaxWickets: 2,
    daySwungWickets: 6,
    sessionDominantBowlingWickets: 5,
    sessionStrongBowlingWickets: 3,
    sessionDominantBattingRuns: 70,
    sessionSteadyBattingRuns: 40,
    sessionSwingMaxRuns: 35,
    sessionSwingMinWickets: 2,
    starBowlerWickets: 4,
    goodBowlerWickets: 2,
    boundaryHeavyCount: 12,
    matchTiltedWickets: 8,
    shortenedSessionMaxOvers: 18,
  },
};

const STORAGE_KEY = "bawler:narrativeThresholds";

type DeepPartial<T> = { [K in keyof T]?: Partial<T[K]> };

function mergeGroup<T extends Record<string, number>>(base: T, override: Partial<T> | undefined): T {
  if (!override || typeof override !== "object") return base;
  return { ...base, ...override };
}

function mergeThresholds(base: NarrativeThresholds, override: unknown): NarrativeThresholds {
  if (!override || typeof override !== "object") return base;
  const o = override as DeepPartial<NarrativeThresholds>;
  return {
    narrative: mergeGroup(base.narrative, o.narrative),
    overSummary: mergeGroup(base.overSummary, o.overSummary),
    dayReport: mergeGroup(base.dayReport, o.dayReport),
  };
}

/**
 * Get the active narrative thresholds: defaults, with any persisted
 * localStorage override merged on top. Safe to call during SSR (returns
 * defaults directly — there's no localStorage on the server).
 */
export function getNarrativeThresholds(): NarrativeThresholds {
  if (typeof window === "undefined") return DEFAULT_NARRATIVE_THRESHOLDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NARRATIVE_THRESHOLDS;
    return mergeThresholds(DEFAULT_NARRATIVE_THRESHOLDS, JSON.parse(raw));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[Bawler] Invalid narrative threshold override in localStorage — using defaults.", err);
    return DEFAULT_NARRATIVE_THRESHOLDS;
  }
}

/**
 * Persist a partial threshold override (merged over whatever's already
 * stored, merged over the defaults) — no redeploy needed. Any group/key
 * you omit keeps its current value.
 */
export function setNarrativeThresholdOverride(partial: DeepPartial<NarrativeThresholds>): void {
  if (typeof window === "undefined") return;
  const merged = mergeThresholds(getNarrativeThresholds(), partial);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

/** Remove any persisted override and revert to the defaults above. */
export function clearNarrativeThresholdOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
