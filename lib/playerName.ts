import { PLAYERS } from "./mockData";

// ============================================================================
// Centralized player display-name formatting -- v1.0.120
//
// Real-data-readiness fix, closing out the `lastName()` fragility flagged
// and logged much earlier in this project (see DECISIONS-LOG.md). That
// earlier fix (`getPlayerShortName`, formerly in lib/mockData.ts) solved
// half the problem: it stopped a naive `.split(" ").pop()` from
// confidently mis-splitting a real compound surname ("de Silva" ->
// "Silva") by checking the PLAYERS reference registry's hand-verified
// `shortName` field first. But for any player NOT in that local registry
// -- a real feed sending a player this app has no reference data for, or
// one of this mock dataset's own background/flavor players -- it gave up
// and returned the full name unchanged, rather than actually deriving a
// correct short form. That was a safe failure mode, but a deferred one.
//
// This module resolves it properly:
//   1. Still checks the PLAYERS registry first, same principle as before
//      -- an authoritative hand-verified field always wins over a guess.
//   2. For anyone not in the registry, `parsePlayerName()` now genuinely
//      derives an initial + surname from the raw string, correctly
//      handling multi-word surnames and particles ("AB de Villiers",
//      "Faf du Plessis", "Rassie van der Dussen", "Shakib Al Hasan"),
//      suffixes ("Jr.", "III"), hyphenated surnames ("J Fraser-McGurk"),
//      players recorded under a single name with no first/last split,
//      inconsistent capitalization, and stray whitespace -- instead of
//      falling back to either a wrong guess or a non-answer.
//
// A second, independent implementation of this exact concern
// (`normaliseName()`) was found living in `lib/transformers.ts`'s API
// ingestion boundary -- same last-token fragility, plus its own
// "Surname, First" comma-format handling. Consolidated here rather than
// left as a second competing utility: `parsePlayerName` now handles the
// comma format too, and `lib/transformers.ts`'s `normalizeBall()` calls
// `formatPlayerName` directly.
//
// `formatPlayerName()` is now the ONLY sanctioned way to render a
// player's name anywhere in this app. Every component that used to
// construct a name display independently (some full name, some
// `.split(" ").pop()` surname-only, some already-short registry
// strings -- which is exactly how the format ended up inconsistent
// across the app: surname-only on the Live/Score stat pills, full name
// on player profile headers, raw ball-data strings everywhere else) now
// calls this instead. See ARCHITECTURE.md for the worked-example writeup
// and the full list of migrated call sites.
// ============================================================================

// Particle words that fold into a surname when they immediately precede
// the final surname token -- e.g. "de Villiers", "van der Merwe",
// "du Plessis", "Al Hasan". Two conventions coexist in real names: the
// European lower-case convention (de, van, der, von, du, ...) and the
// South/Southeast Asian capitalized convention (Al). Both are matched
// case-insensitively on input; `CAPITALIZED_PARTICLES` controls which
// convention a particle normalizes to when the input needs case fixing
// at all (an already-correctly-cased particle is left exactly as given
// -- see `normalizeParticleCase`).
const LOWERCASE_PARTICLES = new Set([
  "de", "van", "der", "von", "du", "da", "das", "dos",
  "la", "le", "bin", "ibn", "abu", "ter", "ten",
]);
const CAPITALIZED_PARTICLES = new Set(["al"]);
const ALL_PARTICLES = new Set([...LOWERCASE_PARTICLES, ...CAPITALIZED_PARTICLES]);

// Trailing suffix tokens -- generational/legal suffixes, never part of a
// surname. Stripped before surname derivation so one never gets folded
// in as a bogus extra surname word; not included in the canonical
// "Initial Surname" display (a concise player label has no use for
// "Jr."/"III"), but preserved on the parsed result for callers that want
// it and for direct testing of the parsing logic itself.
const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);

export interface ParsedPlayerName {
  /** The original input, unmodified. */
  raw: string;
  /** First-name initial, uppercased. Empty string for a single-name
   * player -- there's no separate first name to abbreviate. */
  initial: string;
  /** The surname, including any folded-in leading particle words
   * ("de Villiers", "van der Merwe"). For a single-name player this IS
   * that one name -- nothing is invented. */
  surname: string;
  /** A recognized trailing suffix ("Jr.", "III"), or "" if none. */
  suffix: string;
  /** True when there is no first/last split to make. */
  hasSingleName: boolean;
}

function isAllUpper(s: string): boolean {
  return /[A-Z]/.test(s) && s === s.toUpperCase();
}
function isAllLower(s: string): boolean {
  return /[a-z]/.test(s) && s === s.toLowerCase();
}

/**
 * Capitalizes a single surname word, honoring the small set of
 * surname-prefix conventions plain Title Case gets wrong ("Mcgurk"
 * instead of "McGurk", "Macdonald" instead of "MacDonald", "O'brien"
 * instead of "O'Brien"). Only called once the caller has already decided
 * the word needs case-normalizing at all (see `normalizeWordCase`) --
 * this never runs on a word that's already correctly mixed-case.
 */
function capitalizeSurnamePart(word: string): string {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (lower.startsWith("mc") && lower.length > 2) {
    return "Mc" + lower[2].toUpperCase() + lower.slice(3);
  }
  if (lower.startsWith("mac") && lower.length > 3) {
    return "Mac" + lower[3].toUpperCase() + lower.slice(4);
  }
  if (lower.startsWith("o'") && lower.length > 2) {
    return "O'" + lower[2].toUpperCase() + lower.slice(3);
  }
  return lower[0].toUpperCase() + lower.slice(1);
}

/**
 * Normalizes a surname/first-name token's capitalization -- but only
 * when it actually needs it. A word that's ALL CAPS ("MCGURK") or all
 * lowercase ("mcgurk") gets normalized via `capitalizeSurnamePart`
 * (hyphen-aware: "fraser-mcgurk" -> "Fraser-McGurk"). A word that's
 * already genuine mixed case ("McGurk", "DeVilliers", "O'Brien") is left
 * completely untouched -- re-title-casing it naively would silently
 * mangle a correctly-cased real surname (Title-casing "McGurk" character
 * by character gives "Mcgurk", which is wrong).
 */
function normalizeWordCase(word: string): string {
  if (!word) return word;
  if (isAllUpper(word) || isAllLower(word)) {
    return word.split("-").map(capitalizeSurnamePart).join("-");
  }
  return word;
}

/**
 * Same "only touch it if it needs fixing" rule as `normalizeWordCase`,
 * applied to a particle word instead of a surname root -- an
 * already-correctly-cased particle (lowercase "de", capitalized "Al") is
 * trusted as-is; an ALL CAPS or all-lowercase particle is normalized to
 * whichever convention that specific particle uses.
 */
function normalizeParticleCase(token: string): string {
  const lower = token.toLowerCase();
  if (!(isAllUpper(token) || isAllLower(token))) return token;
  if (CAPITALIZED_PARTICLES.has(lower)) return lower[0].toUpperCase() + lower.slice(1);
  return lower;
}

function firstInitial(firstName: string): string {
  const trimmed = firstName.trim();
  return trimmed ? trimmed[0].toUpperCase() : "";
}

/**
 * Parses a raw player name string into first-initial / surname / suffix
 * parts. This is the ONLY place in the codebase that splits a name
 * string -- `formatPlayerName` (and, through it, every display call
 * site in the app) goes through here rather than reimplementing a
 * `.split(" ")` guess.
 */
export function parsePlayerName(rawName: string | null | undefined): ParsedPlayerName {
  const raw = rawName ?? "";
  let collapsed = raw.trim().replace(/\s+/g, " ");
  if (!collapsed) {
    return { raw, initial: "", surname: "", suffix: "", hasSingleName: false };
  }

  // "Surname, First Middle" feed format (a real API convention -- see
  // lib/transformers.ts's ingestion boundary, which used to have its own,
  // separate, equally-naive name normalizer for exactly this format).
  // Reversed into plain "First Middle Surname" order up front so every
  // rule below (particles, suffixes, hyphens, casing) applies uniformly
  // regardless of which order the raw string arrived in.
  if (collapsed.includes(",")) {
    const parts = collapsed.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const [last, ...rest] = parts;
      collapsed = [...rest, last].join(" ").trim().replace(/\s+/g, " ");
    } else {
      collapsed = parts[0] ?? "";
    }
  }
  if (!collapsed) {
    return { raw, initial: "", surname: "", suffix: "", hasSingleName: false };
  }

  let tokens = collapsed.split(" ").filter(Boolean);

  // Suffix: only stripped from the last token, and only when there's at
  // least one token left afterward -- a suffix with nothing else isn't
  // a name to strip down to nothing, it's the whole (degenerate) input.
  let suffix = "";
  if (tokens.length > 1) {
    const lastBare = tokens[tokens.length - 1].toLowerCase().replace(/\.$/, "");
    if (SUFFIXES.has(lastBare)) {
      suffix = tokens[tokens.length - 1];
      tokens = tokens.slice(0, -1);
    }
  }

  if (tokens.length === 0) {
    return { raw, initial: "", surname: suffix || collapsed, suffix: "", hasSingleName: true };
  }

  if (tokens.length === 1) {
    return { raw, initial: "", surname: normalizeWordCase(tokens[0]), suffix, hasSingleName: true };
  }

  // Scan backward from just before the last token, folding in any
  // contiguous run of particle words. Index 0 is always the first name
  // and is never folded in, even if it happens to spell a particle word
  // (guards a genuine first name like "Del" or "Van" from being eaten).
  let surnameStart = tokens.length - 1;
  while (surnameStart - 1 > 0 && ALL_PARTICLES.has(tokens[surnameStart - 1].toLowerCase())) {
    surnameStart--;
  }

  const firstName = tokens[0];
  const surnameTokens = tokens.slice(surnameStart);
  const surname = surnameTokens
    .map((t, i) => (i === surnameTokens.length - 1 ? normalizeWordCase(t) : normalizeParticleCase(t)))
    .join(" ");

  return { raw, initial: firstInitial(firstName), surname, suffix, hasSingleName: false };
}

// ----------------------------------------------------------------------------
// Registry-first resolution
// ----------------------------------------------------------------------------

let _displayNameCache: Map<string, string> | null = null;

function displayNameLookup(): Map<string, string> {
  if (_displayNameCache) return _displayNameCache;
  const map = new Map<string, string>();
  for (const p of Object.values(PLAYERS)) {
    if (!p?.name || !p?.shortName) continue;
    map.set(p.name.trim().toLowerCase(), p.shortName);
    map.set(p.shortName.trim().toLowerCase(), p.shortName);
  }
  _displayNameCache = map;
  return map;
}

/**
 * The single sanctioned way to render a player's name anywhere in this
 * app. Resolution order:
 *
 * 1. Check the PLAYERS reference registry first, by either the player's
 *    full `name` or their existing `shortName` (case-insensitive,
 *    whitespace-normalized) -- for any of the real seeded players, this
 *    returns the hand-verified `shortName` regardless of which raw
 *    string form the caller happens to have on hand. Same "trust the
 *    authoritative field over a guess" principle the old
 *    `getPlayerShortName` established.
 * 2. If the raw name isn't in the registry, derive "Initial Surname"
 *    algorithmically via `parsePlayerName` -- correctly handling
 *    multi-word surnames, particles, suffixes, hyphens, single names,
 *    bad capitalization, and stray whitespace, instead of returning the
 *    full name unchanged (the old deferred fallback) or a naive
 *    `.split(" ").pop()` guess (the original bug).
 *
 * A single-name player (no first/last split at all) is returned as that
 * one name, unchanged in casing logic but never with an invented
 * initial glued on front.
 */
export function formatPlayerName(rawName: string | null | undefined): string {
  const trimmed = (rawName ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const registryHit = displayNameLookup().get(trimmed.toLowerCase());
  if (registryHit) return registryHit;

  const parsed = parsePlayerName(trimmed);
  if (parsed.hasSingleName) return parsed.surname;
  return `${parsed.initial} ${parsed.surname}`;
}
