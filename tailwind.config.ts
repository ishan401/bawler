import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bawler palette — dark, modern, data-viz-first
        bg: {
          DEFAULT: "#0A0E1A",
          surface: "#141B2D",
          elevated: "#1B243A",
          deep: "#03060F",
        },
        line: "#1E293B",
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          dim: "#64748B",
        },
        // Cricket-domain accents
        cyan: { DEFAULT: "#00E5FF", soft: "#00E5FF33" },
        orange: { DEFAULT: "#FF6B35", soft: "#FF6B3522" },
        boundary: { DEFAULT: "#10B981", soft: "#10B98122" },
        wicket: { DEFAULT: "#EF4444", soft: "#EF444422" },
        six: { DEFAULT: "#A855F7", soft: "#A855F722" },
        // Follow/filter feature accent — deliberately its own color, NOT a
        // reuse of "six" purple (that's the ball-outcome palette).
        follow: { DEFAULT: "#7C3AED", soft: "#7C3AED22" },

        // v1.0.67 — dedicated tokens for meanings that were previously
        // borrowing "wicket" or "six" (per-ball outcome colors) for
        // something unrelated to either ball outcome. Same hex values as
        // before (no visual change), just named for what they actually
        // mean now, so a future change to the real wicket/six ball-outcome
        // color doesn't silently also change these unrelated things.
        live:     { DEFAULT: "#EF4444" }, // live-match indicator (dot, "LIVE" text, live-row highlight) — was borrowing "wicket"
        negative: { DEFAULT: "#EF4444" }, // behind/lost/declining trend signal, pairs with "boundary" as its positive counterpart — was borrowing "wicket"
        special:  { DEFAULT: "#A855F7" }, // special/premium recognition (Man of Series, "Never dismissed", a bowler's five-for) — was borrowing "six"
        spin:     { DEFAULT: "#A855F7" }, // ball spin-direction / delivery-type indicator — was borrowing "six"
        slowPace: { DEFAULT: "#A855F7" }, // slowest tier of BallGIF's speed-readout color scale — was borrowing "six"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        num: ["Inter", "system-ui", "sans-serif"],
      },
      fontFeatureSettings: {
        tabular: '"tnum"',
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shadow-bounce": "shadow-bounce 1.2s ease-in-out infinite",
        "ball-deliver": "ball-deliver 1.2s ease-in-out infinite",
        "ball-shot": "ball-shot 1.2s ease-out infinite",
        "wicket-flash": "wicket-flash 1.4s ease-out infinite",
        "boundary-pulse": "boundary-pulse 1.4s ease-out infinite",
        "crowd-wave": "crowd-wave 1.4s ease-out infinite",
      },
      keyframes: {
        "shadow-bounce": {
          "0%": { transform: "translate(0,0) scale(1)", opacity: "0.7" },
          "40%": { transform: "translate(0,4px) scale(0.6)", opacity: "0.3" },
          "55%": { transform: "translate(0,0) scale(1)", opacity: "0.85" },
          "100%": { transform: "translate(0,0) scale(1)", opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
