"use client";

import React, { useState } from "react";
import { parsePlayerName } from "@/lib/playerName";

// ============================================================================
// Shared player avatar — v1.0.129
// ============================================================================
// Extracted from components/YourPlayersStrip.tsx's PlayerChip (v1.0.125),
// which had this fallback logic right, and components/DigestTab.tsx's Man
// of the Match card, which -- until v1.0.128 fixed the field-name bug --
// had its OWN, slightly different (and briefly broken) copy of the same
// idea. Two independent copies of "photo first, fall back to initials" is
// exactly the kind of duplication that let them silently drift apart:
// DigestTab's copy ended up reading a field (`photoUrl`) that doesn't even
// exist on `PlayerProfile`, and used a CSS-attribute-toggle hack for the
// broken-image case instead of the more reliable React-state approach
// YourPlayersStrip already had. This component is now the ONE place that
// owns "how a player's avatar renders," reused (not re-implemented) by the
// homepage strip, the Digest tab's MOM card, and the player profile page
// header (see DECISIONS-LOG.md v1.0.129 for the fuller writeup).
//
// Real-data-ready by construction: `imageUrl` is the exact field
// `PlayerProfile` declares (lib/types.ts) -- once a real photo URL
// populates it, every one of this component's callers picks it up with
// zero further code changes. A broken/unreachable URL degrades to
// initials at runtime too (`onError`), not just when the field is empty.
//
// Deliberately role/format-agnostic: nothing here reads `role`,
// `battingStyle`, or any format-scoped field. Every visual customization a
// caller needs (favourited ring color, a match's team-tinted background,
// the profile header's role-tinted ring) is passed in as plain color
// props, not hardcoded here or branched on player shape.
// ============================================================================

export interface PlayerAvatarProps {
  /** Player's real name or short name -- used for the initials fallback
   * (via the same `parsePlayerName()` the rest of the app already uses for
   * display formatting) and the `<img>` alt text. Accepts a raw string,
   * not a full `PlayerProfile`, so a caller with only a display-name
   * string (e.g. `Match.result.manOfMatch`) doesn't need to resolve a full
   * player object just to render an avatar. */
  name: string;
  /** Real headshot URL, if any -- `PlayerProfile.imageUrl` today; empty in
   * every seeded mock player, by design (see lib/types.ts). */
  imageUrl?: string | null;
  /** Diameter in pixels. Callers pick the size for their own context (the
   * strip's small chip, the Digest card's compact badge, the profile
   * header's larger anchor) -- this component only owns the fallback
   * logic, never a fixed size. */
  sizePx: number;
  /** Border + initials text color. Defaults to the platform's neutral
   * line/dim-text pair so an unstyled avatar still looks intentional. */
  ringColor?: string;
  textColor?: string;
  /** Optional background override (e.g. a team color at low alpha) -- if
   * omitted, falls back to the platform's standard `bg-surface` token via
   * className, so most callers never need to pass this at all. */
  backgroundColor?: string;
  borderWidthPx?: number;
  className?: string;
}

export default function PlayerAvatar({
  name,
  imageUrl,
  sizePx,
  ringColor = "var(--line)",
  textColor = "var(--text-dim)",
  backgroundColor,
  borderWidthPx = 1.5,
  className,
}: PlayerAvatarProps) {
  // React-state-driven fallback (not a CSS attribute-selector/display-none
  // hack) so a broken image reliably swaps to initials the instant
  // `onError` fires, regardless of how the parent is styled -- the same
  // reasoning YourPlayersStrip.tsx's original comment already documented,
  // now the ONE implementation instead of one-of-two.
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = !!imageUrl && !imgFailed;
  const initials = (() => {
    const parsed = parsePlayerName(name);
    const first = parsed.initial || parsed.surname[0] || "?";
    const second = parsed.surname[0] || "";
    return (first + second).toUpperCase().slice(0, 2);
  })();
  const fontSizePx = Math.max(9, Math.round(sizePx * 0.28));

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center font-extrabold bg-surface shrink-0 ${className ?? ""}`}
      style={{
        width: sizePx,
        height: sizePx,
        border: `${borderWidthPx}px solid ${ringColor}`,
        color: textColor,
        fontSize: fontSizePx,
        ...(backgroundColor ? { background: backgroundColor } : {}),
      }}
    >
      {showPhoto ? (
        <img
          src={imageUrl as string}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
