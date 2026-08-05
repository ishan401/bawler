// Shared stat tile used by the player profile's MAT/RUNS/AVG/SR-style rows
// and the Info tab's pitch report box row. Both call sites must render an
// identical tile -- extracted here so there is exactly one definition
// rather than two similar-looking but independently maintained copies.
export default function StatCell({ label, value }: { label: string; value?: string | number }) {
  // Guard: API can return null or NaN for fields without data
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && isNaN(value)) return null;
  if (value === "" || value === "-") return null;
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-3">
      <span className="text-base font-extrabold text-text-primary num tracking-tight">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-text-dim font-semibold">{label}</span>
    </div>
  );
}
