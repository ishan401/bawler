"use client";
import { useRef, useState, useCallback } from "react";

// ============================================================================
// SwipeCard — hand-rolled pointer-drag swipe card (v1.0.165)
// ============================================================================
// No gesture/animation library exists anywhere in this codebase (BallGIF's
// book-turn animation, CarouselDots, etc. are all hand-rolled CSS
// transform/transition -- see ARCHITECTURE.md conventions) -- this follows
// the same pattern rather than introducing a new dependency for one
// component. Pointer Events cover mouse + touch + pen uniformly, same
// rationale lib/pointerGuard.ts already documents for its own listeners.
// ============================================================================

const SWIPE_THRESHOLD_PX = 80;
const EXIT_DURATION_MS = 220;
const SNAP_BACK_MS = 200;

export interface SwipeCardHandle {
  swipeRight: () => void;
  swipeLeft: () => void;
}

export default function SwipeCard({
  children,
  active,
  onSwipeRight,
  onSwipeLeft,
  registerHandle,
}: {
  children: React.ReactNode;
  /** Only the top card of the stack should capture drag gestures. */
  active: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  /** Lets the parent trigger a swipe programmatically (heart/X buttons)
   * without duplicating the exit-animation logic. */
  registerHandle?: (handle: SwipeCardHandle | null) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);

  const runExit = useCallback(
    (direction: "left" | "right") => {
      setExiting(direction);
      window.setTimeout(() => {
        if (direction === "right") onSwipeRight();
        else onSwipeLeft();
      }, EXIT_DURATION_MS);
    },
    [onSwipeRight, onSwipeLeft]
  );

  if (registerHandle) {
    registerHandle({
      swipeRight: () => runExit("right"),
      swipeLeft: () => runExit("left"),
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!active || exiting) return;
    startX.current = e.clientX;
    pointerId.current = e.pointerId;
    elRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || pointerId.current !== e.pointerId) return;
    setDx(e.clientX - startX.current);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging || pointerId.current !== e.pointerId) return;
    setDragging(false);
    pointerId.current = null;
    if (dx > SWIPE_THRESHOLD_PX) {
      runExit("right");
    } else if (dx < -SWIPE_THRESHOLD_PX) {
      runExit("left");
    } else {
      setDx(0); // snap back -- CSS transition handles the animation
    }
  }

  const exitOffset = exiting === "right" ? 520 : exiting === "left" ? -520 : 0;
  const translateX = exiting ? exitOffset : dx;
  const rotate = (exiting ? exitOffset : dx) / 22;
  const transitionMs = dragging ? 0 : exiting ? EXIT_DURATION_MS : SNAP_BACK_MS;

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative select-none touch-none"
      style={{
        transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
        transition: `transform ${transitionMs}ms ease-out, opacity ${transitionMs}ms ease-out`,
        opacity: exiting ? 0 : 1,
        cursor: active ? (dragging ? "grabbing" : "grab") : "default",
      }}
    >
      {children}
      {/* Directional hint overlays -- fade in as the card is dragged past ~30% of the threshold */}
      {active && dx > 24 && (
        <div
          className="absolute top-4 left-4 rounded-lg border-2 border-boundary px-3 py-1 text-boundary font-bold text-sm rotate-[-12deg]"
          style={{ opacity: Math.min(1, (dx - 24) / SWIPE_THRESHOLD_PX) }}
        >
          FOLLOW
        </div>
      )}
      {active && dx < -24 && (
        <div
          className="absolute top-4 right-4 rounded-lg border-2 border-negative px-3 py-1 text-negative font-bold text-sm rotate-[12deg]"
          style={{ opacity: Math.min(1, (-dx - 24) / SWIPE_THRESHOLD_PX) }}
        >
          SKIP
        </div>
      )}
    </div>
  );
}
