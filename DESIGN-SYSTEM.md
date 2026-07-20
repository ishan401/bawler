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

**Known inconsistency, flagged not hidden:** the actual page background is **hardcoded `#000000`** in `app/globals.css` (`html { background: #000000 }`, `body { background-color: #000000 }`) — it does not use `bg.DEFAULT` (`#0A0E1A`) or `bg.deep` (`#03060F`) at all. This is why "For you"'s card can look like it's floating on true black rather than the token system's own darkest defined layer — not a bug, just worth knowing the token and the real rendered pixel aren't the same thing here.

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
| `wicket` | `#EF4444` | **Dual-purpose in current code** — (a) the literal per-ball wicket outcome color, and (b) reused broadly as the general negative/urgent signal: the "LIVE" indicator dot/text everywhere on the platform, negative NRR, "lost" match result, low-balls-remaining pressure states. Both usages are red for a reason (loss/danger), but a genuinely new "negative" or "live" use should check here first rather than picking a third red. |
| `six` | `#A855F7` | **Also dual-purpose** — six-ball outcome text/background across `MomentsStrip`, `Scorecard`, `MatchupCard`, `DigestTab`, `MatchTabs`, `LiveCarousel`'s series-schedule sheet, *and* reused for "Man of the Series" badges and ball spin-direction indicators in `BallGIF`/`DeliveryCard`. See the flagged mismatch in §4 below — this is NOT the same purple `lib/outcomeColors.ts` uses for the six-ball badge fill. |
| `follow` | `#7C3AED` | Filter/personalization only — see §4. Deliberately a different violet from `six`'s purple; do not blur the two. |

## 4. Ball-outcome palette vs. Filter violet — different systems, do not cross-wire

**`lib/outcomeColors.ts`** is the canonical per-ball outcome palette (used by `BallGIF`, `DeliveryCard`; header comment lists `MiniBallGIF`/`OverSummary` as consumers too, though those two currently roll their own Tailwind classes rather than importing `OUTCOME` directly):

| Outcome | `primary` (badge fill / line) | `badgeFg` | `badgeText` |
|---|---|---|---|
| wicket | `#EF4444` | `#FFFFFF` | `W` |
| dot / single / two | `#64748B` | `#FFFFFF` | `.` / `1` / `2` |
| three | `#EC4899` (pink) | `#FFFFFF` | `3` |
| four | `#06B6D4` | `#0A0E1A` | `4` |
| six | `#2DD4BF` (turquoise) | `#0A0E1A` | `6` |
| extra | `#94A3B8` | `#0A0E1A` | `+` |

**Known inconsistency, flagged not hidden:** `OUTCOME.six.primary` (`#2DD4BF`, turquoise) does **not** match the Tailwind `six` token (`#A855F7`, purple) that `DigestTab.tsx`, `MomentsStrip.tsx`, `Scorecard.tsx`, and others use directly for six-ball styling. In practice this means a six-ball badge in `DeliveryCard`/`BallGIF` currently renders turquoise, while the exact same outcome rendered in the Digest tab or Moments strip renders purple. Same is true of `three` (`#EC4899` pink) — it exists only inside `OUTCOME`, with no equivalent Tailwind token at all. **This doc is not silently "fixing" this** — it's surfacing it as a real, live discrepancy so a future pass can deliberately choose one canonical six-color rather than it staying accidental.

**Filter/personalization violet — completely separate, single-purpose color:**

| Token | Hex | Reserved for | Must NOT be used for |
|---|---|---|---|
| `follow` (`#7C3AED`) | Violet 600 | The Filter feature only: bottom-nav Filter icon/label while the sheet is open, `FollowSheet` checkbox fill + category badges, "FOR YOU" label + its card's colored border logic route, "Update" button fill | Any ball outcome, any team's brand color, any other "selected/active" state elsewhere in the app. It was deliberately created as its *own* violet specifically so it would never be confused with `six`'s purple (`#A855F7`) — see the inline comment already in `tailwind.config.ts`. If a new feature needs a "this is selected" accent, it should get its own token the same way `follow` did, not reuse either purple. |

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

---

## Before you add a new color, border, or card type

1. Check §3/§4 first — is there already a token for what you mean (brand accent, status, ball-outcome, or feature-specific like `follow`)? Don't introduce a 4th red or a 3rd purple.
2. If adding a team, run the collision script in §5 against the full roster, not just a visual eyeball check — the CSK/AUS/SRH cluster (RGB distance 9.3) would not have been obvious from looking at the three swatches in isolation, only from checking against the full list.
3. If adding a new card type, place it in §6's tier system deliberately — pick a height (fixed, matching the tier's convention) and a color rule (what specific, decided thing does color represent here, if anything) before writing JSX.
4. If you find another inconsistency like the ones flagged in §1/§4, add it here rather than quietly working around it — the value of this doc depends on it staying honest about what's actually shipped, not just what was intended.
