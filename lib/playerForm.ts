import type { PlayerProfile, PlayerFormatKey, RecentFormWindow } from "./types";

// ============================================================================
// Player recent form + achievements adapter — v1.0.117
// ============================================================================
// Same real-data-readiness pattern as lib/teamData.ts (membership status /
// rankings) and lib/teamAccentColor.ts (accent color resolution) — see
// ARCHITECTURE.md's "interface-first pattern" for the full writeup. Applied
// here:
//
//   1. Split: raw per-format storage lives on PlayerProfile as
//      testRecentForm/odiRecentForm/t20iRecentForm/franchiseRecentForm
//      (lib/types.ts's RecentFormWindow) — one player-innings/spell series
//      plus its achievements, per format, mirroring how testStats/odiStats/
//      etc. already split FormatStats by format.
//   2. Sanctioned accessor: getRecentForm()/getPlayerAchievements() below
//      are the ONLY reads of those four fields anywhere in the codebase.
//      No component reads player.testRecentForm etc. directly.
//   3. Async from day one: both return Promises today, resolving
//      synchronously from the in-memory mock PlayerProfile — a real
//      per-player stats feed is a network call, so every call site is
//      already written against that shape.
//   4. No-op placeholder: refreshPlayerForm() below, for the same reason
//      lib/teamData.ts's refreshRankings() exists — a future real sync
//      mechanism has a stable function to implement instead of a call site
//      that has to be invented from scratch.
//
// Explicitly NOT in scope, anywhere in this file or its consumers: a
// player's upcoming matches. Playing XI isn't confirmed until close to a
// match, so showing a player's next fixture with any confidence would be
// misleading — this adapter only ever looks backward at recorded innings/
// spells and awards, never forward.
// ============================================================================

export type { PlayerFormatKey };

/** One plotted point on the recent-form graph — runs (batting) or wickets
 * (bowling) for one innings/spell. Deliberately just `{ value }`, not the
 * richer `RecentFormWindow` shape — components consume the resolved,
 * already-validated series, never the raw window. */
export interface RecentFormPoint {
  value: number;
}

export interface RecentFormSeries {
  /** Chronological oldest -> newest, real recorded entries only, length
   * 0-10. NEVER padded with fake zeros to reach 10 — a player with 4
   * recorded innings this format has a 4-point series, not a 10-point one
   * with 6 fabricated zeros. */
  points: RecentFormPoint[];
  metric: "runs" | "wickets";
}

/** One pre-formatted achievement line, singular/plural already resolved.
 * Callers render `.text` directly — no further string assembly needed. */
export interface AchievementLine {
  text: string;
}

function rawWindow(player: PlayerProfile, format: PlayerFormatKey): RecentFormWindow | undefined {
  if (format === "test") return player.testRecentForm;
  if (format === "odi") return player.odiRecentForm;
  if (format === "t20i") return player.t20iRecentForm;
  return player.franchiseRecentForm;
}

/**
 * A player's last-10-innings/spells series for one format, for the recent-
 * form graph. Format-scoped — switching the profile page's format tab and
 * calling this again with the new format returns that format's own window,
 * never a stale mix of two formats.
 *
 * Defensive against every malformed shape a real feed could send instead
 * of a clean number array:
 *   - No window recorded for this format at all (`undefined`) -> empty
 *     series. This is the normal, expected state for a format the mock
 *     dataset (or eventually a real feed) hasn't populated recent-form
 *     data for yet — NOT an error, and callers should render nothing
 *     rather than a broken/empty-looking graph.
 *   - `values` not an array -> empty series, same as above.
 *   - Individual entries that aren't finite, non-negative numbers (a
 *     malformed feed sending `null`, `NaN`, a string, or a negative value)
 *     are dropped rather than crashing the whole series or rendering as a
 *     broken point.
 *   - Fewer than 10 real entries -> returns exactly however many exist.
 *     Never padded to a fixed length of 10.
 *   - More than 10 real entries (shouldn't happen given the "last 10"
 *     contract, but handled anyway) -> takes the most recent 10.
 *   - `metric` anything other than exactly `"wickets"` (including a
 *     malformed value) defensively resolves to `"runs"` rather than
 *     crashing a Y-axis label lookup.
 */
export async function getRecentForm(
  player: PlayerProfile,
  format: PlayerFormatKey
): Promise<RecentFormSeries> {
  const raw = rawWindow(player, format);
  if (!raw || !Array.isArray(raw.values)) {
    return { points: [], metric: "runs" };
  }
  const metric: "runs" | "wickets" = raw.metric === "wickets" ? "wickets" : "runs";
  const points = raw.values
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0)
    .slice(-10)
    .map(value => ({ value }));
  return { points, metric };
}

/**
 * A player's recent achievement lines for one format — one line per
 * qualifying achievement, stacking as many as genuinely apply (never just
 * the single most impressive one). Returns an empty array when nothing
 * qualifies; callers must render nothing at all in that case — no
 * placeholder, no empty state, the whole section simply doesn't exist for
 * that player/format.
 *
 * Two achievement kinds today, both independently optional and additive:
 *   - Man of the Match count within the last-10 window -> one line, with
 *     singular/plural resolved correctly ("Won 1 Man of the Match award"
 *     vs "Won 3 Man of the Match awards" — never "Won 1 Man of the Match
 *     awards"). Omitted entirely if the count is missing, zero, negative,
 *     or not a finite number.
 *   - Man of the Series awards -> one line PER award (an array, not a
 *     count), so a player with two qualifying series in the window gets
 *     two separate lines, not one. Each entry is validated independently —
 *     a malformed entry (missing/blank `opponent`) is skipped rather than
 *     producing a garbled line or dropping the other valid entries in the
 *     same array.
 */
export async function getPlayerAchievements(
  player: PlayerProfile,
  format: PlayerFormatKey
): Promise<AchievementLine[]> {
  const raw = rawWindow(player, format);
  const lines: AchievementLine[] = [];

  const momCount = raw?.achievements?.manOfMatchAwards;
  if (typeof momCount === "number" && Number.isFinite(momCount) && momCount > 0) {
    const n = Math.floor(momCount);
    lines.push({
      text: `Won ${n} Man of the Match ${n === 1 ? "award" : "awards"} in last 10 matches`,
    });
  }

  const mosAwards = raw?.achievements?.manOfSeriesAwards;
  if (Array.isArray(mosAwards)) {
    for (const award of mosAwards) {
      if (!award || typeof award.opponent !== "string" || !award.opponent.trim()) continue;
      const opponent = award.opponent.trim();
      const dateLabel = typeof award.dateLabel === "string" ? award.dateLabel.trim() : "";
      lines.push({
        text: dateLabel
          ? `Man of the Series vs ${opponent}, ${dateLabel}`
          : `Man of the Series vs ${opponent}`,
      });
    }
  }

  return lines;
}

/**
 * Placeholder for a real recent-form/achievements sync mechanism — no-op
 * today, same reasoning as lib/teamData.ts's refreshRankings(). Exists so a
 * future feature has a stable function to call instead of one that has to
 * be invented when real data actually arrives.
 */
export function refreshPlayerForm(): Promise<void> {
  return Promise.resolve();
}
