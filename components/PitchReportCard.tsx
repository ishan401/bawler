import type { PitchReport } from "@/lib/pitchReports";
import StatCell, { type StatCellSize } from "./StatCell";

interface PitchReportCardProps {
  pitch: PitchReport;
}

/**
 * Pitch report explained in plain language.
 * Per Sarthak — pitch info is "one of the most misunderstood, under-discussed
 * things in cricket" — this section is meant to feel intuitive.
 *
 * Structure:
 *   - Surface type tag (always -- required field)
 *   - Compact box row: one box per rating stat that has a value
 *     (pace-friendly, spin-friendly, bounce-consistency, avg 1st innings
 *     score, dew factor)
 *   - Bullet-list of behaviour hints in everyday language (always --
 *     required field)
 *
 * v1.0.155 (real-data-readiness): every field except `surfaceType` and
 * `bullets` is optional on `PitchReport` -- a real per-match report may only
 * have some of these available.
 *
 * v1.0.160 (box-row redesign, real-data-readiness continued):
 *   - The old stacked full-width sliders (pace/spin/bounce) and the separate
 *     dew-factor row were replaced with a single row of compact boxes, one
 *     per stat that actually has a value -- reusing the exact `StatCell`
 *     tile from the player profile's MAT/RUNS/AVG/SR rows (shared component,
 *     not a lookalike) so both places render identically.
 *   - `expectedFirstInningsScore` (a predictive `{low, mid, high}` range
 *     shown as a gauge) was replaced with `avgFirstInningsScore`, a single
 *     historical statistic, rendered as its own box in the same row.
 *
 * v1.0.161 (dynamic column count -- fixes a real layout bug in v1.0.160):
 *   - v1.0.160 chunked boxes into rows of a FIXED 4 columns. That looked
 *     fine for the (common) 4-field case, but broke for every other count:
 *     a 5th box (Dew) wrapped onto its own second row with 3 empty column
 *     slots beside it -- whether or not that lone box stretched to fill the
 *     row, the row itself was mostly empty. A 3-field match (the two Test
 *     entries) hit the opposite problem in principle: had there been a
 *     partial final row it would've reserved a 4th empty slot too, though 3
 *     happened to fit in one chunk by coincidence.
 *   - Fixed by deriving the column count from however many boxes are
 *     actually present for THIS match, every time -- never a fixed number.
 *     `MAX_ROW_COLUMNS` (6) is a defensive cap only: today's real data never
 *     exceeds 5 fields, so every current match renders in exactly one row;
 *     the cap exists purely so a hypothetical future 7th field wraps instead
 *     of squeezing a row into illegibility, not because wrapping is an
 *     active feature today.
 *   - `StatCell` gained an optional `size` ("md"/"sm"/"xs") so padding and
 *     type scale down as a row holds more boxes (5 -> "sm", 6 -> "xs"); "md"
 *     (4 or fewer boxes) is byte-for-byte the original, unscaled tile the
 *     player profile also uses. The "Avg score" label abbreviates to
 *     "Avg sc." once a row is dense enough to need it, so it stays on one
 *     line instead of wrapping.
 */

const MAX_ROW_COLUMNS = 6;

interface StatBox {
  key: string;
  label: string;
  shortLabel?: string;
  value: string | number;
}

function sizeForColumnCount(n: number): StatCellSize {
  if (n <= 4) return "md";
  if (n === 5) return "sm";
  return "xs";
}

export default function PitchReportCard({ pitch }: PitchReportCardProps) {
  // Declarative field -> box mapping. A box is included only if its field
  // actually has a value on THIS match's report -- adding a future optional
  // field here is a one-line addition, not a new branch of layout logic;
  // the row's column count always just falls out of how many of these are
  // present, never a hardcoded expectation of 4 (or any other number).
  const candidateBoxes: (StatBox | null)[] = [
    pitch.paceFriendly !== undefined ? { key: "pace", label: "Pace", value: `${pitch.paceFriendly}/10` } : null,
    pitch.spinFriendly !== undefined ? { key: "spin", label: "Spin", value: `${pitch.spinFriendly}/10` } : null,
    pitch.bounceConsistency !== undefined ? { key: "bounce", label: "Bounce", value: `${pitch.bounceConsistency}/10` } : null,
    pitch.avgFirstInningsScore !== undefined
      ? { key: "avgScore", label: "Avg score", shortLabel: "Avg sc.", value: pitch.avgFirstInningsScore }
      : null,
    pitch.dewFactor ? { key: "dew", label: "Dew", value: capitalize(pitch.dewFactor) } : null,
  ];
  const boxes: StatBox[] = candidateBoxes.filter((b): b is StatBox => b !== null);

  // Single row whenever the box count fits the cap (true for every match in
  // today's data, up to 5 fields) -- only wraps to a second row if a future
  // report somehow exceeds MAX_ROW_COLUMNS fields at once.
  const boxRows: StatBox[][] = [];
  for (let i = 0; i < boxes.length; i += MAX_ROW_COLUMNS) boxRows.push(boxes.slice(i, i + MAX_ROW_COLUMNS));

  return (
    <div className="card overflow-hidden">
      {/* v1.0.191: the venue name/city line that used to render here
          ("Wankhede Stadium, Mumbai") is removed -- it duplicated the same
          info already shown once on this same Info tab, in the Date &
          Time card (see InfoTab.tsx). The header div now holds only the
          "Pitch report" label, so the stat rows below sit directly under
          it with no leftover gap or empty line where the venue text used
          to be -- `border-b` on this div still separates the label from
          the surface/stat-box content beneath. See DECISIONS-LOG.md. */}
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim">Pitch report</h3>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* v1.0.163: Surface row is a plain single-line row (label left,
            value right) -- it never had its own box/border, but it used to
            sit above a `border-t` divider belonging to the stat-box row
            below, which read as its own separated section. Surface and the
            stat-box row are now grouped into one tight space-y-2 block with
            no divider between them, matching the plain-text row treatment
            used for the Toss line in InfoTab.tsx's Match Context card.
            Font sizes on the label/value are unchanged -- only the
            divider/spacing around the row changed. */}
        <div className="space-y-2">
          {/* Surface type -- always present (required field) */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-dim uppercase tracking-widest">Surface</span>
            <span className="text-sm font-bold text-text-primary">{capitalize(pitch.surfaceType.replace("-", " "))}</span>
          </div>

          {/* Compact stat box row -- section omitted entirely if no field
              has a value. Column count equals however many boxes are
              present for THIS match (capped at MAX_ROW_COLUMNS), so every
              real case today renders as one single row that fills the full
              width evenly -- never a lone box stranded on its own row,
              never an empty slot reserved for a field this match doesn't
              have. */}
          {boxRows.length > 0 && (
            <div className="space-y-2">
              {boxRows.map((row, ri) => {
                const size = sizeForColumnCount(row.length);
                const dense = size !== "md";
                return (
                  <div
                    key={ri}
                    className={dense ? "grid gap-2" : "grid gap-3"}
                    style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0,1fr))` }}
                  >
                    {row.map((box) => (
                      <div key={box.key} className="card">
                        <StatCell label={dense && box.shortLabel ? box.shortLabel : box.label} value={box.value} size={size} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Behavior bullets -- always present (required field) */}
        <div className="border-t border-line pt-3">
          <div className="text-xs text-text-dim uppercase tracking-widest mb-2">How this pitch behaves</div>
          <ul className="space-y-2">
            {pitch.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-primary leading-snug">
                <span className="text-cyan shrink-0 mt-0.5">→</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
