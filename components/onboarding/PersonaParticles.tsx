"use client";
import { useEffect, useState } from "react";

// v1.0.171 (onboarding visual polish): one-time particle burst behind the
// quiz's "Your cricket persona" title. Purely decorative -- `pointer-
// events: none` on the layer so it can never intercept the Share/Continue
// taps below it, and it never gates their tappability (this component
// renders as an absolutely-positioned overlay, not a blocking modal).
// Colors are exactly the three the build spec named, reused verbatim --
// no new palette entries.
const PARTICLE_COLORS = ["#00E5FF", "#3ECF8E", "#F0B429"];
const PARTICLE_COUNT = 10;
const BURST_DURATION_MS = 1300;
// Slightly longer than the animation itself so the layer unmounts only
// once every particle has visibly finished fading, never mid-animation.
const CLEANUP_MS = 1500;

interface Particle {
  id: number;
  color: string;
  size: number;
  tx: number;
  ty: number;
  delayMs: number;
}

function buildParticles(): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 40 + Math.random() * 30; // 40-70px, per spec
    particles.push({
      id: i,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      size: 2 + Math.random() * 2, // 2-4px
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      delayMs: Math.random() * 80,
    });
  }
  return particles;
}

/** Renders once and only once per mount -- the caller is responsible for
 * only mounting this the first time the persona reveal appears (see
 * QuizStep.tsx, which mounts it unconditionally alongside the persona
 * result since that whole block itself only ever renders once per quiz
 * completion). Removes itself from the DOM after the burst finishes. */
export default function PersonaParticles() {
  const [particles] = useState<Particle[]>(buildParticles);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), CLEANUP_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 0 }}
    >
      {particles.map(p => (
        <span
          key={p.id}
          className="persona-particle absolute rounded-full"
          style={
            {
              left: "50%",
              top: "50%",
              width: p.size,
              height: p.size,
              background: p.color,
              animationDuration: `${BURST_DURATION_MS}ms`,
              animationDelay: `${p.delayMs}ms`,
              // CSS custom properties, read by the .persona-particle
              // keyframe (app/globals.css) -- same cast-to-CSSProperties
              // pattern Scorecard.tsx's --glow-rgb already uses in this
              // codebase for per-instance custom properties.
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
