"use client";
import { useEffect, useState } from "react";
import { markSelectMoreNudgeSeen } from "@/lib/selectMoreNudge";

const AUTO_DISMISS_MS = 6000;
// BottomNav (components/BottomNav.tsx) is a fixed ~52px-tall bar; this
// clearance lifts the coachmark just above it with a small gap. Filter is
// the middle of BottomNav's 3 equal-width flex-1 tabs, and BottomNav
// itself is horizontally centered on screen (`left-1/2` + translateX(-50%)),
// so the middle tab's own center is always the viewport's horizontal
// center too -- a plain `left: 50%` here lines this bubble up with the
// Filter icon without needing to measure BottomNav's DOM from a sibling
// component tree.
const NAV_CLEARANCE_PX = 66;

/**
 * One-time, non-blocking coachmark shown on Home only (mounted directly by
 * app/page.tsx, gated by lib/selectMoreNudge.ts's own one-time flag --
 * mirrors FirstSessionQuest.tsx's convention of a small `fixed`-positioned,
 * no-backdrop widget that never captures taps meant for the page under it).
 *
 * Dismissal per the build spec: tapping the Filter tab dismisses AND lets
 * that same tap open the Filter sheet as normal; tapping anywhere else
 * dismisses without navigating; left untouched, it auto-dismisses after
 * 6s. All three are handled by one capture-phase `pointerdown` listener --
 * the bubble itself is `pointer-events: none`, so it can never intercept
 * or block the tap that dismisses it (including the Filter tap, which
 * must still reach BottomNav's own button underneath).
 */
export default function SelectMoreNudge() {
  const [visible, setVisible] = useState(true);

  // Marked seen the instant this mounts (i.e. the instant it's shown) --
  // not on dismiss -- so a page refresh mid-display can never re-trigger
  // it. app/page.tsx only ever mounts this component once its own
  // 800ms-after-render delay has elapsed and the one-time flag was still
  // unset at that moment.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[diag] SelectMoreNudge MOUNTED");
    markSelectMoreNudgeSeen();
    return () => {
      // eslint-disable-next-line no-console
      console.log("[diag] SelectMoreNudge UNMOUNTED");
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const autoTimer = window.setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    function onPointerDown() {
      setVisible(false);
    }
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.clearTimeout(autoTimer);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-[60] pointer-events-none"
      style={{ left: "50%", bottom: NAV_CLEARANCE_PX, transform: "translateX(-50%)" }}
    >
      <div className="select-more-nudge px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap">
        Select more
      </div>
      {/* Downward-pointing caret connecting the bubble to the Filter icon
          below -- a small rotated square sharing the bubble's own
          background/border/blur, with its top+left border/shadow
          suppressed so it reads as one continuous shape rather than a
          separate diamond. */}
      <div
        aria-hidden="true"
        className="select-more-nudge"
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          width: 12,
          height: 12,
          transform: "translateX(-50%) rotate(45deg)",
          borderTop: "none",
          borderLeft: "none",
          borderRadius: 2,
          boxShadow: "none",
        }}
      />
    </div>
  );
}
