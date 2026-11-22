import { gsap, prefersReducedMotion } from "./motion";
import { TONES } from "./theme";

const COLORS = Object.values(TONES).map((t) => t.fill);
const SHAPES = ["50%", "3px", "50% 0"];

function createParticle(layer: HTMLElement, size: number): HTMLSpanElement {
  const particle = document.createElement("span");
  Object.assign(particle.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: `${size}px`,
    height: `${size * gsap.utils.random(0.6, 1.4)}px`,
    background: gsap.utils.random(COLORS),
    borderRadius: gsap.utils.random(SHAPES),
  });
  layer.appendChild(particle);
  return particle;
}

/** Kleiner Konfetti-Burst aus einem Element heraus (reines GSAP, kein Paket). */
export function burstConfetti(origin: Element | null, amount = 26) {
  if (!origin || prefersReducedMotion()) return;
  const rect = origin.getBoundingClientRect();
  const layer = document.createElement("div");
  Object.assign(layer.style, {
    position: "fixed",
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top + rect.height / 2}px`,
    pointerEvents: "none",
    zIndex: "60",
  });
  document.body.appendChild(layer);

  const timeline = gsap.timeline({ onComplete: () => layer.remove() });
  for (let i = 0; i < amount; i++) {
    const particle = createParticle(layer, gsap.utils.random(6, 11));
    const angle = gsap.utils.random(-Math.PI, 0);
    const power = gsap.utils.random(60, 170);
    timeline
      .to(
        particle,
        {
          x: Math.cos(angle) * power,
          y: Math.sin(angle) * power,
          rotation: gsap.utils.random(-360, 360),
          duration: 0.5,
          ease: "power3.out",
        },
        0,
      )
      .to(particle, { y: `+=${gsap.utils.random(140, 240)}`, opacity: 0, duration: 0.9, ease: "power1.in" }, 0.45);
  }
}
