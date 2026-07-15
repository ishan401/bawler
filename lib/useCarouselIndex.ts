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
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const firstCard = el.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const cardW = firstCard.getBoundingClientRect().width;
      const gap = 12; // gap-3
      const step = cardW + gap;
      const idx = Math.round(el.scrollLeft / step);
      setActiveIdx(Math.max(0, Math.min(idx, Math.max(0, itemCount - 1))));
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref, itemCount]);

  return activeIdx;
}
