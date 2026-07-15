"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FollowSheet from "./FollowSheet";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: "/schedule",
    label: "Schedule",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed bottom-0 left-1/2 z-50 flex items-stretch"
        style={{
          width: "min(430px, 100vw)",
          background: "rgba(10,14,26,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          // Centering (translateX(-50%)) combined with translateZ(0) in ONE
          // transform -- these must be a single inline `transform` value,
          // not split between a Tailwind class and inline style, because
          // inline `style` fully overrides a class's `transform` rather
          // than merging with it. (An earlier fix here accidentally did
          // exactly that and knocked the whole bar off-center.)
          //
          // translateZ(0) forces the GPU compositing layer this
          // backdrop-filter needs to exist immediately (at style-recalc
          // time), instead of letting Chrome promote it lazily on first
          // paint. Without it, the very first tap/click landing inside a
          // fresh backdrop-filter layer can hit-test against the
          // pre-promotion layer and pass through to whatever was
          // underneath -- i.e. it does nothing visible. Cheap, inert on
          // every other browser.
          transform: "translateX(-50%) translateZ(0)",
          willChange: "backdrop-filter, transform",
        }}
      >
        {TABS.slice(0, 1).map(tab => {
          const active = pathname === "/";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? "text-cyan" : "text-text-dim hover:text-text-secondary"
              }`}
            >
              {tab.icon(active)}
              <span className="text-[9.5px] font-bold uppercase tracking-widest leading-none" style={{ opacity: active ? 1 : 0.55 }}>
                {tab.label}
              </span>
              {active && <span className="absolute bottom-0 rounded-full bg-cyan" style={{ width: 24, height: 2, marginBottom: 0 }} />}
            </Link>
          );
        })}

        {/*
          Filter trigger — styled identically to Home/Schedule (plain
          icon+label tab, same size/layout), NOT a raised circular button.
          Filter is the least-used of the three destinations and opens an
          overlay sheet rather than switching to a persistent screen, so it
          shouldn't visually outrank its neighbors. The only distinguishing
          treatment is color: neutral gray by default, Violet 600 (#7C3AED,
          the `follow` token — same accent used for selections inside the
          sheet itself) only while the sheet is actually open, reverting to
          neutral the instant it closes.
        */}
        <button
          onClick={() => setFilterOpen(true)}
          aria-label="Filter — follow teams, players, and tournaments"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
            filterOpen ? "text-follow" : "text-text-dim hover:text-text-secondary"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filterOpen ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M8 12h8M11 18h2" />
          </svg>
          <span className="text-[9.5px] font-bold uppercase tracking-widest leading-none" style={{ opacity: filterOpen ? 1 : 0.55 }}>
            Filter
          </span>
          {filterOpen && <span className="absolute bottom-0 rounded-full bg-follow" style={{ width: 24, height: 2, marginBottom: 0 }} />}
        </button>

        {TABS.slice(1).map(tab => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? "text-cyan" : "text-text-dim hover:text-text-secondary"
              }`}
            >
              {tab.icon(active)}
              <span className="text-[9.5px] font-bold uppercase tracking-widest leading-none" style={{ opacity: active ? 1 : 0.55 }}>
                {tab.label}
              </span>
              {active && <span className="absolute bottom-0 rounded-full bg-cyan" style={{ width: 24, height: 2, marginBottom: 0 }} />}
            </Link>
          );
        })}
      </nav>

      <FollowSheet open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}
