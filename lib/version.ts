// ============================================================================
// App version -- SINGLE SOURCE OF TRUTH
// ============================================================================
// Root-cause fix (v1.0.83): the footer in components/MatchView.tsx displayed
// a hardcoded literal ("Bawler v1.0.65") that was never updated as the app
// moved through v1.0.66 through v1.0.82 -- 17 versions of silent drift,
// caught only because a user checked the deployed footer against what had
// actually shipped.
//
// The fix isn't "hardcode the current number instead" -- that just resets
// the same drift to happen again next release. Every user-visible version
// display MUST import from HERE instead of writing its own copy of the
// version string. This file reads package.json's "version" field, so
// bumping the version is a ONE-LINE change in ONE file (package.json) --
// nothing else needs to be touched, and nothing else can silently fall out
// of sync with it.
//
// scripts/version-check.ts enforces this: it fails if any component
// contains a hardcoded "Bawler v<number>" literal instead of importing
// APP_VERSION_LABEL from here. Run it (or `npm run build`, which doesn't
// currently wire it in as a gate, so run it manually / in CI) after any
// change that touches version display.
//
// Convention: package.json's version is plain semver ("1.0.82"), no "v"
// prefix (that's what npm/semver tooling expects everywhere else). UI code
// that wants the "v1.0.82"-style display string should use
// APP_VERSION_LABEL below, not re-derive it inline.
// ============================================================================

import packageJson from "../package.json";

export const APP_VERSION = packageJson.version;
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
