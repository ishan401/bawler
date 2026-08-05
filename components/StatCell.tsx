// Shared stat tile used by the player profile's MAT/RUNS/AVG/SR-style rows
// and the Info tab's pitch report box row. Both call sites must render an
// identical tile -- extracted here so there is exactly one definition
// rather than two similar-looking but independently maintained copies.
//
// v1.0.161: added an optional `size` for call sites whose row can hold more
// boxes than the player profile's fixed 4-column layout ever needs (the
// pitch-report row's column count is now dynamic per match, up to 6). `size`
// defaults to "md", whose classes are byte-for-byte the original ones this
// component always rendered -- the player profile's usage passes no `size`
// at all, so its output is completely unchanged by this addition.
export type StatCellSize = "md" | "sm" | "xs";

export default function StatCell({
  label,
  value,
  size = "md",
}: {
  label: string;
  value?: string | number;
  size?: StatCellSize;
}) {
  // Guard: API can return null or NaN for fields without data
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && isNaN(value)) return null;
  if (value === "" || value === "-") return null;

  if (size === "md") {
    return (
      <div className="flex flex-col items-center gap-0.5 px-2 py-3">
        <span className="text-base font-extrabold text-text-primary num tracking-tight">{value}</span>
        <span className="text-[10px] uppercase tracking-widest text-text-dim font-semibold">{label}</span>
      </div>
    );
  }

  // "sm" / "xs" -- denser variants. Padding and type scale down as more boxes
  // share a single row; value and label are forced to one line each (never
  // wrap), since a cramped box has no room for a second line before it
  // starts overlapping or overflowing its neighbor.
  const isXs = size === "xs";
  return (
    <div className={isXs ? "flex flex-col items-center gap-0.5 px-1 py-2" : "flex flex-col items-center gap-0.5 px-1.5 py-2.5"}>
      <span className="text-sm font-extrabold text-text-primary num tracking-tight whitespace-nowrap">{value}</span>
      <span className={`${isXs ? "text-[8px]" : "text-[9px]"} uppercase tracking-widest text-text-dim font-semibold whitespace-nowrap`}>
        {label}
      </span>
    </div>
  );
}
