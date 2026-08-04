// Safety tripwire for lib/mockData.ts.
//
// Added after two incidents where an attempt to extend the pitch-report
// feature corrupted this file badly enough to truncate ~13,800 of its
// ~15,200 lines and take down the whole platform -- each requiring a hard
// reset to recover (see DECISIONS-LOG.md v1.0.39, and the unresolved
// BUILD-STATUS.md v1.0.42/43 entries describing a second such incident).
// mockData.ts is the single largest, most load-bearing file in the app
// (match/ball/player data for the entire platform), so a silent truncation
// here doesn't fail loudly on its own -- it just quietly deletes most of
// the app's content. This check makes that failure loud instead.
//
// It compares the file's current line count and export list against a
// recorded baseline (scripts/mockdata-baseline.json) and fails if either
// drops by more than a small, clearly-abnormal margin. A real truncation
// bug removes thousands of lines at once, so even a generous threshold
// here catches it long before it ever reaches production.
//
// Run automatically as part of `npm run build` (wired into the `prebuild`
// script in package.json, alongside the existing version-check.ts).
//
// To intentionally shrink mockData.ts (a real, reviewed refactor -- not a
// bug), re-run with --update-baseline to record the new state as accepted:
//   npx tsx scripts/check-mockdata-integrity.ts --update-baseline

import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const MOCKDATA_PATH = path.join(ROOT, "lib", "mockData.ts");
const BASELINE_PATH = path.join(__dirname, "mockdata-baseline.json");

interface Baseline {
  lineCount: number;
  exports: string[];
}

function getExports(text: string): string[] {
  const re = /^export\s+(?:const|function|type|interface|class)\s+([A-Za-z0-9_]+)/gm;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) names.push(m[1]);
  return names;
}

const text = fs.readFileSync(MOCKDATA_PATH, "utf8");
const lineCount = text.split("\n").length;
const exportsNow = getExports(text);

if (process.argv.includes("--update-baseline")) {
  const baseline: Baseline = { lineCount, exports: exportsNow };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
  console.log(`Baseline updated: ${lineCount} lines, ${exportsNow.length} exports.`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.log("FAIL  no baseline recorded yet -- run with --update-baseline first.");
  process.exit(1);
}

const baseline: Baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));

let failures = 0;
function check(label: string, cond: boolean, detail: string) {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label} — ${detail}`);
  }
}

// A real truncation bug wipes thousands of lines at once (the historical
// incident removed ~13,800 of ~15,200 -- over 90%). A 5% drop from the
// recorded baseline is already far beyond anything a normal edit should
// ever cause, so this threshold is sensitive without being brittle.
const DROP_THRESHOLD_FRACTION = 0.05;
const minAcceptableLines = Math.floor(baseline.lineCount * (1 - DROP_THRESHOLD_FRACTION));

check(
  `lib/mockData.ts line count hasn't dropped more than ${DROP_THRESHOLD_FRACTION * 100}% from baseline`,
  lineCount >= minAcceptableLines,
  `baseline=${baseline.lineCount} lines, current=${lineCount} lines (min acceptable ${minAcceptableLines})`
);

const missingExports = baseline.exports.filter((name) => !exportsNow.includes(name));
check(
  "no export present in the baseline has disappeared from lib/mockData.ts",
  missingExports.length === 0,
  `missing export(s): ${missingExports.join(", ") || "none"}`
);

if (failures === 0) {
  console.log(
    `\nALL CHECKS PASSED  (${lineCount} lines, ${exportsNow.length} exports; baseline: ${baseline.lineCount} lines, ${baseline.exports.length} exports)`
  );
} else {
  console.log(`\n${failures} CHECK(S) FAILED -- lib/mockData.ts may have been truncated or corrupted.`);
  console.log("If this drop is a deliberate, reviewed refactor, re-run with --update-baseline to accept the new state.");
}
process.exit(failures === 0 ? 0 : 1);
