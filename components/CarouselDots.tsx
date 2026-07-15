// Shared swipe-carousel position indicator -- v1.0.65.
//
// Replaces the native horizontal scrollbar thumb (".scrollbar-thin") that
// was previously visible on every snap-x card carousel in the app (hero,
// "for you", Spotlight). That scrollbar thumb tracks the width of its
// scroll CONTAINER, which is intentionally wider than a single card (it
// spans edge-to-edge via a negative margin so touch/drag scrolling feels
// natural) -- so the thumb rendered as a thin gray bar stretching past
// each card's own rounded corners, full-viewport-width, instead of
// looking like it belonged to any one card.
//
// This component is the deliberate replacement: small per-item dots,
// sized and centered to read as part of the carousel's card, never wider
// than it. Used by every screen with a swipeable card set so the fix
// lives in one place -- see lib/useCarouselIndex.ts for the matching
// shared active-index tracking hook.
export default function CarouselDots({
  count,
  activeIndex,
  activeColor = "#00E5FF",
}: {
  count: number;
  activeIndex: number;
  activeColor?: string;
}) {
  // Nothing to page between -- no bar, no single leftover dot either.
  if (count < 2) return null;

  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <span
            key={i}
            className="rounded-full transition-colors duration-200"
            style={{
              width: active ? 6 : 5,
              height: active ? 6 : 5,
              background: active ? activeColor : "#475569",
              opacity: active ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}
