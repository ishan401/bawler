"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

const PAGE_ORDER = [
  (p: string) => p === "/",
  (p: string) => p.startsWith("/schedule"),
  (p: string) => p.startsWith("/table"),
  (p: string) => p.startsWith("/match"),
];

function getPageIndex(path: string) {
  const idx = PAGE_ORDER.findIndex(fn => fn(path));
  return idx === -1 ? 99 : idx;
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [displayed, setDisplayed] = useState<ReactNode>(children);
  const [animClass, setAnimClass] = useState("");
  const busy = useRef(false);

  useEffect(() => {
    if (pathname === prevPath.current) {
      // Same route — just keep children fresh (e.g. query param changes)
      if (!busy.current) setDisplayed(children);
      return;
    }

    if (busy.current) return;
    busy.current = true;

    const from = getPageIndex(prevPath.current);
    const to   = getPageIndex(pathname);
    const dir  = to >= from ? "forward" : "backward";

    prevPath.current = pathname;

    // 1. Exit — current content flips away
    setAnimClass(`book-exit-${dir}`);

    setTimeout(() => {
      // 2. Swap content + enter animation
      setDisplayed(children);
      setAnimClass(`book-enter-${dir}`);
      setTimeout(() => {
        setAnimClass("");
        busy.current = false;
      }, 320);
    }, 220);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Keep children updated when not animating
  useEffect(() => {
    if (!busy.current) setDisplayed(children);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div
      className={animClass}
      style={{ minHeight: "100%", transformOrigin: "center center" }}
    >
      {displayed}
    </div>
  );
}
