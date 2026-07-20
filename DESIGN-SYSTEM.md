# Bawler Design System — Internal Reference

> **Dev-facing only. Not shipped, not linked from the app, not user content.**
> This is the single source of truth for color/spacing/layout decisions, consolidated from what's *actually* in the live codebase as of this writing (not reconstructed from memory or intent). Every value below was pulled directly from `tailwind.config.ts`, `app/globals.css`, `lib/mockData.ts`, `lib/outcomeColors.ts`, and the component files that consume them — re-run the greps/scripts noted inline if this drifts.
>
> **Read this before adding any new color, border, or card type to the homepage or match cards.** Check a new value against what's here first. This doc exists because color collisions and inconsistent treatment have shipped before without a place to check against (see "Known inconsistencies" below — some already exist in production and are flagged rather than hidden).

---

## 1. Surface / background layers

Defined in `tailwind.config.ts` under `colors.bg`:

| Token | Hex | Actual current usage |
|---|---|---|
| `bg.deep` | `#03060F` | **Defined, unused.** Zero matches for `bg-bg-deep` anywhere in `components/` or `app/`. Available for a future deeper layer (e.g. a modal-behind-a-modal) but nothing currently reaches for it. |
| `bg.DEFAULT` (`bg-bg`) | `#0A0E1A` | Used in exactly one place: `WinProbChart.tsx`'s full-screen modal background (`bg-bg`). Not the page background. |
| `bg.surface` (`bg-bg-surface`) | `#141B2D` | The workhorse layer — `.card`'s background, `PastMatchCard`/`FutureMatchCard`/`ForYouRow`, popovers, toggle-track backgrounds. 8 direct usages outside the `.card` class itself. |
| `bg.elevated` (`bg-bg-elevated`) | `#1B243A` | One layer up from surface — dropdown menus, active toggle segments, back/close buttons on `BottomSheet`, `FollowSheet` category rail. 10 direct usages. |
| `line` | `#1E293B` | Not a background — the universal border/divider color (`.card`'s border, quiet-grid's neutral "no winner yet" border, `FollowSheet` dividers). Also the fallback team-border color when a winner can't be resolved (see §5). |

**Resolved (v1.0.67):** the page background was previously hardcoded to `#000000` in `app/globals.css`, bypassing `bg.deep` entirely. Confirmed with the user first, since `#000000` and `bg.deep` (`#03060F`) don't match exactly — the fix accepts a near-imperceptible shift (RGB 0,0,0 -> 3,6,15) rather than silently changing the rendered page. `html`/`body` now both read `background: #03060F` via the token, so the page background finally goes through the same system as everything else.

## 2. Text tokens

`tailwind.config.ts` → `colors.text`:

| Token | Hex | Usage pattern observed in code |
|---|---|---|
| `text.primary` (`text-text-primary`) | `#F8FAFC` | Default body text, team names, scores — anything that's the main point of a row. |
| `text.secondary` (`text-text-secondary`) | `#94A3B8` | Supporting stat labels, sub-text under a primary value, inactive-but-visible nav label hover state. |
| `text.dim` (`text-text-dim`) | `#64748B` | Deemphasized: inactive nav icons/labels, section headers ("SPOTLIGHT", "PAST · 12"), timestamps, placeholder search text. |

## 3. Brand / status accents

`tailwind.config.ts` → top-level accent tokens:

| Token | Hex | Reserved for |
|---|---|---|
| `cyan` (`text-cyan`/`bg-cyan`) | `#00E5FF` | The platform's actual "brand" accent — live win-prob sparkline, TABLE button, countdown timers, Spotlight's `excitement-glow` pulse, hero-carousel dot indicator. This is the "something live/active/data-driven" color. |
| `boundary` | `#10B981` | Positive signal — won/ahead states (NRR >= 0, RRR comfortable, match-result "won" text). |
| `orange` | `#FF6B35` | Mid-tier attention — moderate pace/dew/expected-score readings, ESPN data-source badge, ball-speed mid-band. A "notice this, but it's not alarming" tier, distinct from `wicket` red. |
| `wicket` | `#EF4444` | The literal per-ball wicket outcome color only, as of v1.0.67 — see the resolved dual-purpose cases below. |
| `six` | `#A855F7` | The literal per-ball six outcome color only, as of v1.0.67 — see the resolved dual-purpose cases below. Now also the single canonical value for six-ball rendering everywhere (§4 mismatch resolved). |
| `follow` | `#7C3AED` | Filter/personalization only — see §4. Deliberately a different violet from `six`'s purple; do not blur the two. |
| `live` | `#EF4444` | The live-match indicator specifically — dot, "LIVE" text, live-row highlight, live-status text. Carved out of `wicket` in v1.0.67 (same hex, new name) after finding it reused across `ScoreBar`, `MomentsStrip`, `MatchCard`'s hero card, `app/page.tsx`'s "for you" row, and 3 separate, slightly different "LIVE" badge implementations inside `LiveCarousel.tsx` alone (one of which was raw Tailwind `red-400`/`red-500`, not even a token, on the team-schedule page). |
| `negative` | `#EF4444` | Behind/lost/declining trend signal — pairs with `boundary` as its positive counterpart. Carved out of `wicket` in v1.0.67 (same hex, new name) after finding it reused for negative NRR, "lost" match results, projected-score deficits, and rising-pressure states across `table/page.tsx`, `ProjectedScore`, `StandingsTab`, `MiniStandings`, `AIMetrics`, `PressureGauge`, and the team-schedule page. |
| `special` | `#A855F7` | Special/premium recognition — Man of the Series (badge + name highlight in `Scorecard`), a batter's "Never dismissed" achievement and a bowler's five-for milestone chip (`MatchupCard`, `MomentsStrip`, `WinProbChart`'s event-dot color), and a "WON" badge inside `LiveCarousel`'s series-schedule sheet that's been reassigned to `boundary` instead (see below) since that's what it actually means. Carved out of `six` in v1.0.67 (same hex, new name) — none of these are six-run outcomes. |
| `spin` | `#A855F7` | Ball spin-direction / delivery-type indicator — `BallGIF`, `MiniBallGIF`, `DeliveryCard`, `MomentStoryCard`, `PitchReportCard`'s "Spin-friendly" slider. Carved out of `six` in v1.0.67 (same hex, new name) — a spin delivery isn't a six-run outcome (a fast bowler's slower ball can also land in the spin-colored bucket while scoring zero runs). |
| `slowPace` | `#A855F7` | The slowest tier of `BallGIF`/`DeliveryCard`'s ball-speed readout color scale (fast=cyan -> mid=white -> slower=orange -> slowest=this). Carved out of `six` in v1.0.67 (same hex, new name) — this is about km/h, not runs scored or spin. |

## 4. Ball-outcome palette vs. Filter violet — different systems, do not cross-wire

**`lib/outcomeColors.ts`** is the canonical per-ball outcome palette (used by `BallGIF`, `DeliveryCard`; header comment lists `MiniBallGIF`/`OverSummary` as consumers too, though those two currently roll their own Tailwind classes rather than importing `OUTCOME` directly):

| Outcome | `primary` (badge fill / line) | `badgeFg` | `badgeText` |
|---|---|---|---|
| wicket | `#EF4444` | `#FFFFFF` | `W` |
| dot / single / two | `#64748B` | `#FFFFFF` | `.` / `1` / `2` |
| three | `#EC4899` (pink) | `#FFFFFF` | `3` |
| four | `#06B6D4` | `#0A0E1A` | `4` |
| six | `#A855F7` (purple, resolved v1.0.67 — was `#2DD4BF` turquoise) | `#FFFFFF` (was `#0A0E1A`) | `6` |
| extra | `#94A3B8` | `#0A0E1A` | `+` |

**Resolved (v1.0.67):** `OUTCOME.six` was turquoise (`#2DD4BF`); the Tailwind `six` token (used directly, bypassing `OUTCOME`, in `DigestTab.tsx`, `MomentsStrip.tsx`, `Scorecard.tsx`, `MatchTabs.tsx`, `MatchupCard.tsx`) was purple (`#A855F7`). Audited actual usage before picking one: purple is the color rendered by `BallGIF` (the hero ball-replay visual — 5 separate raw-hex six-related usages), `MiniBallGIF`, `MomentStoryCard`, `WinProbChart`'s event dots, `Scorecard`'s "6s" column, and `OverSummary`, in addition to the 4 files above — 11+ files. Turquoise reached the screen in exactly one place: `DeliveryCard`'s `FullCard` outcome badge, which sits directly next to a `MiniBallGIF` thumbnail (same ball, same card) that was already purple — a real, visible two-color clash on a single live card. Standardized on purple: `OUTCOME.six.primary`/`.tint` changed to `#A855F7`, `badgeFg` changed from `#0A0E1A` to `#FFFFFF` to match `BallGIF`'s own established fg convention for a purple-filled badge. `three` (`#EC4899` pink) still has no Tailwind equivalent — not touched by this pass, since nothing conflicts with it.

**Filter/personalization violet — completely separate, single-purpose color:**

| Token | Hex | Reserved for | Must NOT be used for |
|---|---|---|---|
| `follow` (`#7C3AED`) | Violet 600 | The Filter feature only: bottom-nav Filter icon/label while the sheet is open, `FollowSheet` checkbox fill + category badges, "FOR YOU" label + its card's colored border logic route, "Update" button fill | Any ball outcome, any team's brand color, any other "selected/active" state elsewhere in the app. It was deliberately created as its *own* violet specifically so it would never be confused with `six`'s purple (`#A855F7`) — see the inline comment already in `tailwind.config.ts`. If a new feature needs a "this is selected" accent, it should get its own token the same way `follow` did, not reuse either purple. |

**Raw-hex sites (v1.0.67):** SVG `stroke`/`fill` attributes and inline `style` objects can't use a Tailwind class at all — they need a literal hex string. `lib/tokens.ts` exports `LIVE`, `NEGATIVE`, `BOUNDARY`, `SPECIAL`, `SPIN`, `SLOW_PACE` as plain string constants mirroring the Tailwind tokens above, for exactly those sites (see `BallGIF.tsx`, `MiniBallGIF.tsx`, `MomentStoryCard.tsx`, `DeliveryCard.tsx`, `PitchReportCard.tsx` for real usage). There's no build-time link between this file and `tailwind.config.ts` — keep them in sync by hand if either changes.

## 5. Team color roster (all 72 currently in `lib/mockData.ts`)

Pulled via direct parse of `TEAMS` (10 IPL), `NATIONAL_TEAMS` (22), `LEAGUE_TEAMS` (40) — every `primaryColor` currently shipping.

### IPL (`TEAMS`)

| Code | Team | Color |
|---|---|---|
| MI | Mumbai Indians | `#004BA0` |
| CSK | Chennai Super Kings | `#FDB913` |
| KKR | Kolkata Knight Riders | `#3A225D` |
| RCB | Royal Challengers Bengaluru | `#DA1818` |
| DC | Delhi Capitals | `#17449B` |
| SRH | Sunrisers Hyderabad | `#F7A721` |
| PBKS | Punjab Kings | `#DD1F2D` |
| RR | Rajasthan Royals | `#EA1A85` |
| LSG | Lucknow Super Giants | `#00A2D6` |
| GT | Gujarat Titans | `#4285F4` |

### National teams (`NATIONAL_TEAMS`)

| Code | Team | Color | Code | Team | Color |
|---|---|---|---|---|---|
| IND | India | `#005BAC` | IRE | Ireland | `#169B62` |
| AUS | Australia | `#FFB81C` | ZIM | Zimbabwe | `#D4212D` |
| SA | South Africa | `#007A4D` | SCO | Scotland | `#003DA5` |
| ENG | England | `#1D244E` | NED | Netherlands | `#F77F00` |
| NZ | New Zealand | `#000000` | USA | United States | `#002868` |
| PAK | Pakistan | `#005C3F` | UAE | United Arab Emirates | `#CC0000` |
| BAN | Bangladesh | `#1A6B3A` | NAM | Namibia | `#003087` |
| SL | Sri Lanka | `#003087` | PNG | Papua New Guinea | `#000000` |
| WI | West Indies | `#6E1436` | OMA | Oman | `#8B0000` |
| AFG | Afghanistan | `#1D71B8` | CAN | Canada | `#CC0000` |
| KEN | Kenya | `#006600` | UGA | Uganda | `#000000` |

### Overseas leagues (`LEAGUE_TEAMS`, 40)

| Code | Team | Color | Code | Team | Color |
|---|---|---|---|---|---|
| SIXERS | Sydney Sixers | `#FF1F8E` | ISL | Islamabad United | `#C8102E` |
| STARS | Melbourne Stars | `#00A650` | OVI | Oval Invincibles | `#1A1A1A` |
| HEAT | Brisbane Heat | `#FF6600` | LSP | London Spirit | `#000000` |
| SCORCHERS | Perth Scorchers | `#F15A22` | MOR | Manchester Originals | `#CC0000` |
| HURRICANES | Hobart Hurricanes | `#5C1FAB` | SBR | Southern Brave | `#2E1760` |
| THUNDER | Sydney Thunder | `#16A829` | NSC | Northern Superchargers | `#FFD700` |
| RENE | Melbourne Renegades | `#C8102E` | TRR | Trent Rockets | `#CC0033` |
| STR | Adelaide Strikers | `#003087` | WEF | Welsh Fire | `#8B0000` |
| LAH | Lahore Qalandars | `#00A651` | BPH | Birmingham Phoenix | `#A0173A` |
| KAR | Karachi Kings | `#00AEEF` | SEC | Sunrisers Eastern Cape | `#F7A800` |
| PES | Peshawar Zalmi | `#F7A800` | MICT | MI Cape Town | `#004BA0` |
| QUE | Quetta Gladiators | `#2D2D8F` | JSK | Joburg Super Kings | `#FDB913` |
| MUL | Multan Sultans | `#8B0000` | PREC | Pretoria Capitals | `#002868` |
| TKR | Trinbago Knight Riders | `#3A225D` | PARR | Paarl Royals | `#EA5B7C` |
| BARB | Barbados Royals | `#EA1A85` | DURGD | Durban's Super Giants | `#00A0C6` |
| GAW | Guyana Amazon Warriors | `#1A7A1A` | LAKR | LA Knight Riders | `#3A225D` |
| JAT | Jamaica Tallawahs | `#FFD700` | TSK | Texas Super Kings | `#FDB913` |
| SKP | St Kitts & Nevis Patriots | `#006400` | MINE | MI New York | `#004BA0` |
| SLK | St Lucia Kings | `#003DA5` | SEAO | Seattle Orcas | `#008080` |
| SFU | San Francisco Unicorns | `#FF6600` | WASF | Washington Freedom | `#B22234` |

### Collision check — how to read the roster before adding a new team

Two different things show up when you diff colors across this roster, and they mean opposite things:

**Exact-hex matches = intentional, not a collision.** Global ownership groups deliberately reuse their flagship franchise's exact color for sister teams in other leagues: MI/MICT/MINE all `#004BA0`, CSK/JSK/TSK all `#FDB913`, KKR/TKR/LAKR all `#3A225D`, RR/BARB both `#EA1A85`, PES/SEC both `#F7A800`. Don't "fix" these — they're correct brand consistency.

**Close-but-not-identical hex = a real visual collision to check against.** Computed pairwise RGB distance across all 72 current colors (script below) and flagged everything under a "would look the same on a small colored dot/border" threshold. The headline case — confirmed by re-running this exact check — is the warm-gold/amber cluster:

| Pair | Colors | RGB distance |
|---|---|---|
| CSK <-> AUS | `#FDB913` / `#FFB81C` | **9.3** (near-indistinguishable) |
| SRH <-> AUS | `#F7A721` / `#FFB81C` | 19.4 |
| CSK <-> SRH | `#FDB913` / `#F7A721` | 23.6 |

All three sit in the same warm gold/amber band. This is exactly the kind of cluster this doc is meant to catch *before* a new team ships into it — a 4th warm-gold team (or a redesign nudging any of these three) should be checked against this trio first, not decided in isolation. Other clusters worth knowing about, same method:

| Pair | Colors | Distance | Note |
|---|---|---|---|
| Melbourne Stars <-> Lahore Qalandars | `#00A650` / `#00A651` | 1.0 | Coincidental near-exact match, different orgs — not a sibling-franchise case |
| Kenya <-> St Kitts & Nevis Patriots | `#006600` / `#006400` | 2.0 | Same as above |
| Lucknow Super Giants <-> Durban's Super Giants | `#00A2D6` / `#00A0C6` | 16.1 | Both literally named "Super Giants" — worth a second look if ever shown side by side |
| Scotland / St Lucia Kings <-> Mumbai-family navy | `#003DA5` vs `#004BA0`-family | ~15 | Navy cluster, lower risk (navy has more perceptual headroom than gold) |

Re-run this check yourself whenever a team is added — this isn't a one-time snapshot, it's a repeatable script:

```python
# pip install nothing extra -- stdlib only
import re, itertools
content = open("lib/mockData.ts").read()
def extract_block(name):
    m = re.search(rf'export const {name}: Record<str, Team> = \{{'.replace("str","string"), content)
    start = m.end(); depth = 1; i = start
    while depth > 0:
        if content[i] == '{': depth += 1
        elif content[i] == '}': depth -= 1
        i += 1
    return content[start:i-1]
def parse_teams(block):
    return re.findall(r'code:\s*"([^"]+)".*?fullName:\s*"([^"]+)".*?primaryColor:\s*"(#[0-9A-Fa-f]{6})"', block, re.S)
all_teams = parse_teams(extract_block("TEAMS")) + parse_teams(extract_block("NATIONAL_TEAMS")) + parse_teams(extract_block("LEAGUE_TEAMS"))
def rgb(h): h=h.lstrip("#"); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def dist(a,b): return sum((x-y)**2 for x,y in zip(rgb(a),rgb(b)))**0.5
for (c1,f1,h1),(c2,f2,h2) in itertools.combinations(all_teams, 2):
    if h1 != h2 and dist(h1,h2) < 35:
        print(f"{dist(h1,h2):5.1f}  {c1} {h1} <-> {c2} {h2}  ({f1} / {f2})")
```

## 6. Card-tier system

Four visually distinct tiers exist on the homepage, in descending order of visual weight. Fixed heights are a deliberate pattern — only "for you" is auto-height, and that's intentional (see below).

| Tier | Height | Radius | Background | Border | Color usage rule |
|---|---|---|---|---|---|
| **Hero / Live** (`LiveMatchCard`) | `LIVE_CARD_HEIGHT` = 168px, fixed | `rounded-2xl` (1rem) | Full-bleed `SplitTeamBg` gradient (both teams' colors as the actual card background) | None — the background itself carries the color signal | Always colored; there's no "quiet" hero state, it's the single most prominent card on the page by design (see `lib/heroSelection.ts` for which live match earns this slot) |
| **Spotlight** (`SpotlightMatchCard`) | `SPOTLIGHT_CARD_HEIGHT` = 116px, fixed (was 148 before v1.0.66's trim) | `rounded-xl` (0.75rem) | Full-bleed `SplitTeamBg` gradient + `excitement-glow` (pulsing cyan `box-shadow`, `app/globals.css`) | None — same reasoning as Hero | Reserved for matches clearing the concrete spotlight bar (`lib/spotlight.ts`) — close finish / individual milestone / genuine stakes. Not a color-intensity dial, a boolean gate. |
| **"For you"** (`ForYouRow`) | Auto-height (~72-80px depending on live/upcoming content) — the one tier that ISN'T fixed, since its content is genuinely minimal and pinning it to a shared constant would just add dead space (learned the hard way in v1.0.66) | `rounded-xl` (0.75rem), inline override to match Spotlight (v1.0.61) | Flat `.card` (`bg-bg-surface`) | **3px colored `borderLeft`**, always the followed team's `primaryColor` (`followedMatchSide()`), never the winner's | The one card where color is always personal-to-the-user, never "whoever's winning" |
| **Quiet grid** (`PastMatchCard`/`FutureMatchCard`) | `QUIET_CARD_HEIGHT` = 60px, fixed | `rounded-xl` (0.75rem) | Flat `bg-bg-surface` | **3px colored `borderLeft`** — winning team's `primaryColor` if completed, neutral `#1E293B` (the `line` token) if upcoming (no winner exists yet, so no side is favored) | Color = a decided outcome only. No result yet -> deliberately neutral, never a guessed/default team color (this is exactly the bug GB1 hardened against) |

**The one universal rule across all four:** color on a card always means something specific and decided (a real winner, a real personal follow, a real spotlight-worthy match) — never an arbitrary/default pick. A card with no real signal to show stays neutral or flat rather than borrowing a color that isn't earned.

## 7. Spacing / sizing conventions

Pulled from the actual homepage card components, for matching a new card without reinventing the rhythm:

- **Corner radius:** `rounded-xl` (0.75rem / 12px) is the default for *everyday* cards (Spotlight, "for you", quiet grid) as of the v1.0.61 alignment pass. `rounded-2xl` (1rem / 16px) is reserved for the one tier that's meant to read as more prominent (Hero/Live) and for the generic `.card`/`.card-elevated` utility classes (sheets, popovers — non-homepage-card contexts).
- **Border widths:** `1px` (`border border-line`) = generic "this is a distinct card" boundary, used by the base `.card` class. `3px` colored `borderLeft` = "this card's color carries real meaning" (quiet grid, "for you") — never used decoratively, always tied to the rules in §6.
- **Padding rhythm (Spotlight / "for you", aligned in v1.0.61):** `px-2 py-1.5` edges, one uniform `flex-col gap-0.5` governing spacing between internal rows (label row -> team row -> footer/context line) — not ad-hoc per-child margins.
- **Padding rhythm (quiet grid):** `pl-2 pr-2.5 py-1.5`, `gap-1` between the team row and the result/countdown line.
- **Padding rhythm (Hero/Live):** `px-2.5 py-2` — the most generous of the four, matching its larger fixed height.
- **Swipe-carousel dot indicator:** 5-6px dots (`components/CarouselDots.tsx`), muted gray (`#475569`) inactive, accent-colored active — cyan for Hero/Spotlight, violet (`follow`) for "for you". Renders nothing below 2 items. This is the shared component for any new swipeable card set — see `lib/useCarouselIndex.ts` for the matching active-index hook. Do not re-implement a native-scrollbar-visible carousel; that's the exact bug this replaced (v1.0.65).
- **Glow effects** (`app/globals.css`): `.glow-cyan`/`.glow-orange`/`.glow-wicket`/`.glow-six` and the pulsing `.excitement-glow` are reserved for calling out a genuinely elevated state (Spotlight, in-progress milestone highlights) — not a generic decorative hover effect. If a new card wants a glow, ask whether it's actually in the same "this is unusually significant right now" category Spotlight is.
- **Tournament-table shortcut pill is fixed-width, not content-hugging** (`LiveCarousel.tsx`'s `TABLE_PILL_WIDTH`, v1.0.68): the pill below the hero card that links to standings (`WTC TABLE`, `IPL TABLE`, `PSL TABLE`, etc.) occupies the exact same footprint every time — `176px`, label centered inside — regardless of which tournament's table it links to. Only one of these ever shows at a time, in the same slot, so a per-label content-hugging width made the pill subtly resize depending on which match was on screen, which reads as visual jitter rather than a stable UI element. `176px` was sized against the longest current real label (`Champ. Tr. Table`, which measures ~163px with this exact icon/padding/font) plus a comfortable buffer — not an arbitrary round number. **If a future tournament's shortName is long enough that `{shortName} Table` doesn't comfortably fit inside 176px, that's a real signal to come back and widen the constant deliberately — do not let this regress to content-hugging width, and do not add a silent `truncate`/ellipsis to paper over it.** The label span uses `whitespace-nowrap` specifically so an over-length future label overflows *visibly* rather than silently truncating or quietly wrapping to two lines.
- **Table-shortcut pill + series-info chip render in one row, and that row must not wrap** (`LiveCarousel.tsx`, the `flex items-center gap-2 flex-nowrap` container just below the hero card, v1.0.70): the fixed-width `TABLE` pill (above) and the series-status chip (`"Series level 1-1 · 3-match Test series"` or equivalent, opens the series schedule) are meant to sit inline, side by side, for every tournament type — this is a shared container, not per-match markup, so a fix here applies platform-wide automatically. The container uses `flex-nowrap`, not `flex-wrap`: when the pill's v1.0.68 fixed width left less room than the chip's natural content width, `flex-wrap` was dropping the chip to a second row instead of shrinking it (flex-wrap decides line breaks off each item's un-shrunk content size, before flex-shrink is ever applied — shrinking a wrap-eligible item doesn't stop it from wrapping). The series chip carries `min-w-0` plus a `truncate`d label span specifically so it can shrink and ellipsize to fill whatever width remains after the pill's fixed 176px, instead of wrapping or overflowing. **If this row ever needs a third element, or the pill width changes again, re-check that the chip still has enough room to truncate to something legible — don't reintroduce `flex-wrap` on this container as a "fix" for overflow, since that's exactly what caused the regression this documents.**

---

## Before you add a new color, border, or card type

1. Check §3/§4 first — is there already a token for what you mean (brand accent, status, ball-outcome, or feature-specific like `follow`)? Don't introduce a 4th red or a 3rd purple.
2. If adding a team, run the collision script in §5 against the full roster, not just a visual eyeball check — the CSK/AUS/SRH cluster (RGB distance 9.3) would not have been obvious from looking at the three swatches in isolation, only from checking against the full list.
3. If adding a new card type, place it in §6's tier system deliberately — pick a height (fixed, matching the tier's convention) and a color rule (what specific, decided thing does color represent here, if anything) before writing JSX.
4. If you find another inconsistency like the ones flagged in §1/§4, add it here rather than quietly working around it — the value of this doc depends on it staying honest about what's actually shipped, not just what was intended.
