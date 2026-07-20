"use client";

import { useEffect, useState, type RefObject } from "react";

// Shared active-index tracking for every snap-x card carousel (hero,
// "for you", Spotlight) -- v1.0.65. Derives which card is currently
// snapped-to from horizontal scroll position, using the same card-gap
// constant (gap-3 = 12px) every one of those carousels already uses.
// Extracted out of LiveCarousel (which had this inline) so "for you" and
// Spotlight's carousels -- which need the same index for their own dot
// indicators -- don't each reimplement it slightly differently.
export function useCarouselIndex(
  ref: RefObject<HTMLDivElement | null>,
  itemCount: number
): number {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let rafId: number | null = null;
    let attachedEl: HTMLDivElement | null = null;

    const onScroll = () => {
      if (!attachedEl) return;
      const firstCard = attachedEl.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const cardW = firstCard.getBoundingClientRect().width;
      const gap = 12; // gap-3
      const step = cardW + gap;
      const idx = Math.round(attachedEl.scrollLeft / step);
      setActiveIdx(Math.max(0, Math.min(idx, Math.max(0, itemCount - 1))));
    };

    // Root cause of a real bug (v1.0.75): plain useRef objects (as returned
    // by useDragToScroll, or a bare useRef in LiveCarousel) don't trigger a
    // re-render when `.current` changes, and this effect's deps are
    // [ref, itemCount] -- `ref` is referentially stable forever, so once
    // this effect has run once, it only runs again if `itemCount` itself
    // changes. That's fine for LiveCarousel, which only mounts (and so
    // only runs this effect for the first time) once its own DOM -- ref
    // included -- already exists. It broke for Spotlight/"for you" in
    // app/page.tsx, whose useCarouselIndex calls live in Home()'s hook
    // list and run unconditionally every render, INCLUDING the very first
    // `isBooting` skeleton render where the real carousel markup (and its
    // ref) doesn't exist yet (see the isBooting comment in app/page.tsx).
    // That first run found `ref.current` null, returned early with no
    // listener and no cleanup -- confirmed live via the fiber's effect
    // record (`hasDestroy: false`). 350ms later the skeleton swaps to real
    // content and the ref attaches, but `itemCount` never changed across
    // that swap, so the effect never got a second chance to attach its
    // listener -- the dot stayed on index 0 regardless of swiping, forever.
    // Fixed by polling for `ref.current` instead of assuming it's already
    // there on the first run -- resolves in one frame when it already is
    // (LiveCarousel's case, unchanged), keeps checking each frame when it
    // isn't (Spotlight/"for you"'s case) until it shows up. Capped so a
    // carousel that will never have 2+ items (nothing to attach to, ever)
    // doesn't poll forever.
    let tries = 0;
    const MAX_TRIES = 120; // ~2s at 60fps -- generous vs. the ~350ms isBooting gap
    const tryAttach = () => {
      const el = ref.current;
      if (!el) {
        tries++;
        if (tries < MAX_TRIES) rafId = requestAnimationFrame(tryAttach);
        return;
      }
      attachedEl = el;
      onScroll();
      el.addEventListener("scroll", onScroll, { passive: true });
    };
    tryAttach();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (attachedEl) attachedEl.removeEventListener("scroll", onScroll);
    };
  }, [ref, itemCount]);

  return activeIdx;
}
