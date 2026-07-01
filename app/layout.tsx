import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Bawler — Every Ball, Visualized",
  description: "IPL match companion with predictions, surfaced stats, and visual ball replays. The smart second-screen for IPL 2026.",
  manifest: undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0E1A",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="phone-frame">
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
