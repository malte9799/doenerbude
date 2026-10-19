// Central motion switch. Animations are off for now; every animated value in
// the 3D code goes through `approach`, so turning motion back on (or swapping
// in GSAP / springs) happens here and nowhere else.

export const MOTION = {
  enabled: false,
  // Damping rates per kind of change (used only when enabled).
  rates: { layerIn: 5, layerOut: 8, settle: 7, bake: 1.6, lid: 5 },
};

// Moves `current` towards `target`. With motion off it jumps straight there.
export function approach(current, target, rate, dt) {
  if (!MOTION.enabled) return target;
  const next = target + (current - target) * Math.exp(-rate * dt);
  return Math.abs(next - target) < 1e-4 ? target : next;
}
