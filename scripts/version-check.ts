// Regression guard for the "footer showed v1.0.65 while the app had shipped
// to v1.0.82" bug (fixed in v1.0.83, see lib/version.ts for the root-cause
// writeup). Run with `npx tsx scripts/version-check.ts`.
//
// This does NOT just check that today's footer happens to show the right
// number -- that would pass right up until the next time someone hardcodes
// a version string instead of importing it, which is exactly how the
// original bug happened silently for 17 releases. Instead it scans the
// whole app/components tree for the dangerous PATTERN (a literal
// "Bawler v<number>"-style string anywhere other than lib/version.ts
// itself) so a future reintroduction of the same mistake fails loudly here
// instead of drifting unnoticed again.

import fs from "fs";
import path from "path";
import packageJson from "../package.json";
import { APP_VERSION, APP_VERSION_LABEL } from "../lib/version";

let failures = 0;
function check(label: string, cond: boolean, detail: string) {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label} — ${detail}`);
  }
}

// ============================================================================
// 1. lib/version.ts actually reflects package.json (not a second hardcoded copy)
// ============================================================================
check(
  "lib/version.ts's APP_VERSION matches package.json's version field",
  APP_VERSION === packageJson.version,
  `APP_VERSION=${APP_VERSION}, package.json version=${packageJson.version}`
);
check(
  "APP_VERSION_LABEL is package.json's version prefixed with 'v'",
  APP_VERSION_LABEL === `v${packageJson.version}`,
  `got ${APP_VERSION_LABEL}`
);

// ============================================================================
// 2. No component/page hardcodes its own "Bawler vX.Y.Z"-style literal
// ============================================================================
const ROOT = path.resolve(__dirname, "..");
const SCAN_DIRS = ["app", "components", "lib"];
const VERSION_LITERAL_PATTERN = /Bawler\s+v\d+\.\d+\.\d+/;
const ALLOWED_FILES = new Set([
  path.join(ROOT, "lib", "version.ts"), // the one legitimate place this pattern's *concept* is discussed
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const offenders: string[] = [];
for (const dir of SCAN_DIRS) {
  const dirPath = path.join(ROOT, dir);
  if (!fs.existsSync(dirPath)) continue;
  for (const file of walk(dirPath)) {
    if (ALLOWED_FILES.has(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    // Only flag it inside an actual rendered/returned string -- a comment
    // mentioning "as of v1.0.74" for historical context is fine and common
    // throughout this codebase; a live "Bawler vX.Y.Z" DISPLAY string is not.
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
      if (!isComment && VERSION_LITERAL_PATTERN.test(line)) {
        offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${trimmed}`);
      }
    });
  }
}
check(
  "no component hardcodes its own literal 'Bawler vX.Y.Z' string",
  offenders.length === 0,
  `found ${offenders.length} offender(s):\n${offenders.join("\n")}`
);

// ============================================================================
// 3. MatchView.tsx's footer actually imports and uses the shared label
// ============================================================================
const matchViewPath = path.join(ROOT, "components", "MatchView.tsx");
const matchViewText = fs.readFileSync(matchViewPath, "utf8");
check(
  "MatchView.tsx imports APP_VERSION_LABEL from lib/version",
  /import\s*\{[^}]*APP_VERSION_LABEL[^}]*\}\s*from\s*["']@\/lib\/version["']/.test(matchViewText),
  "no matching import found"
);
check(
  "MatchView.tsx's footer actually renders APP_VERSION_LABEL",
  /Bawler\s*\{APP_VERSION_LABEL\}/.test(matchViewText),
  "footer doesn't reference APP_VERSION_LABEL"
);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
