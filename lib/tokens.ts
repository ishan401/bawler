// ============================================================================
// Design-token hex constants — v1.0.67.
//
// Companion to the same-named entries in tailwind.config.ts, for the many
// places in this codebase that can't use a Tailwind class at all — SVG
// `stroke`/`fill` attributes and inline `style` objects require a literal
// color value, not a className. Keep these in sync with tailwind.config.ts
// by hand; there's no build-time link between the two files (this mirrors
// the app's existing pattern of also hardcoding e.g. "#A855F7" directly in
// SVG attributes rather than importing a shared constant — this file at
// least gives new code introduced going forward a real constant to import
// instead of adding another bare hex literal).
//
// Each of these was carved out of "wicket" or "six" (lib/outcomeColors.ts /
// tailwind.config.ts's ball-outcome colors) — same hex value as before, now
// under its own name for what it actually means. See DESIGN-SYSTEM.md §3-4
// for the full audit of why.
// ============================================================================

/** Live-match indicator — dot, "LIVE" text, live-row highlight. Was borrowing "wicket". */
export const LIVE = "#EF4444";

/** Behind/lost/declining trend signal — pairs with BOUNDARY as its positive counterpart. Was borrowing "wicket". */
export const NEGATIVE = "#EF4444";

/** Positive trend signal — won/ahead states. Matches tailwind.config.ts's `boundary` token. */
export const BOUNDARY = "#10B981";

/** Special/premium recognition — Man of Series, "Never dismissed", a bowler's five-for. Was borrowing "six". */
export const SPECIAL = "#A855F7";

/** Ball spin-direction / delivery-type indicator. Was borrowing "six". */
export const SPIN = "#A855F7";

/** Slowest tier of BallGIF's speed-readout color scale. Was borrowing "six". */
export const SLOW_PACE = "#A855F7";

/** The platform's default accent. Matches tailwind.config.ts's `cyan` token.
 * Also the fallback for a team whose primary AND secondary both fail the
 * hairline-stroke contrast check -- see lib/teamAccentColor.ts. */
export const CYAN = "#00E5FF";
