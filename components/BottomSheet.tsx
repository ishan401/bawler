"use client";

import React, { useState, useRef, useEffect } from "react";

// ============================================================================
// Shared swipe-down-dismissible bottom sheet — v1.0.52
// ============================================================================
// Extracted out of LiveCarousel.tsx (where this pattern originated) so the
// new FollowSheet can reuse the exact same drag-to-dismiss + body-scroll-lock
// + back-button-closes-it behavior instead of duplicating it.
// Drag gesture is ONLY on the handle/header — content scrolls freely.
// ============================================================================
export default function BottomSheet({ title, subtitle, onClose, onBack, children, footer }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  /** Optional pinned footer, rendered BELOW the scrollable content (e.g. a
   * full-width confirm button) — stays visible, never scrolls away. */
  footer?: React.ReactNode;
}) {
  const dragY = useRef(0);
  const startY = useRef(0);
  const [translateY, setTranslateY] = useState(0);

  // Lock body scroll — position:fixed is the only reliable method on mobile.
  // overflow:hidden alone doesn't stop iOS/Android from scrolling the page.
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflowY = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Back-button / back-swipe → close sheet.
  // Uses a #modal hash entry so iOS Safari's edge-swipe also fires popstate.
  // Cleanup uses replaceState (not history.back()) to avoid double-navigation
  // when the sheet is closed programmatically (swipe-down, tap backdrop, ×).
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const cleanUrl = window.location.href.split("#")[0];
    history.pushState({ bawlerModal: true }, "", cleanUrl + "#modal");
    const onPop = () => onCloseRef.current();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Only clean up the hash entry if it's still ours (programmatic close).
      // If back was pressed, the browser already popped it.
      if (window.location.hash === "#modal") {
        history.replaceState(null, "", cleanUrl);
      }
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; dragY.current = 0; };
  const onTouchMove  = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) return;
    dragY.current = delta;
    setTranslateY(delta);
  };
  const onTouchEnd = () => {
    if (dragY.current > 80) { onClose(); }
    else { setTranslateY(0); }
    dragY.current = 0;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          transform: `translateY(${translateY}px)`,
          transition: translateY === 0 ? "transform 0.25s ease" : "none",
          // h-[85vh] not max-h: flex-1 needs a real defined height to scroll
          height: "85vh",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderRadius: "16px 16px 0 0",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle + header — swipe-down zone only */}
        <div
          style={{ flexShrink: 0 }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Book-page swipe indicator */}
          <div className="flex flex-col items-center gap-0.5 pt-2 pb-0.5">
            <div className="w-10 h-1 rounded-full bg-line" />
            <div className="w-6 h-0.5 rounded-full bg-line/40" />
          </div>
          <div className="px-4 pt-2 pb-2.5 flex items-center justify-between border-b border-line">
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center mr-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <div>
                <span className="text-sm font-extrabold">{title}</span>
                {subtitle && <span className="ml-2 text-[10px] text-text-dim font-bold uppercase tracking-widest">{subtitle}</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Scrollable content — explicit flex:1 + overflow so mobile sees it */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-y", minHeight: 0 }}>
          {children}
        </div>
        {footer && (
          <div style={{ flexShrink: 0 }} className="border-t border-line">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

