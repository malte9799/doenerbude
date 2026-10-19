// Central motion switch. Animations are off for now; every animated value in
// the 3D code goes through `approach`, so turning motion back on (or swapping
// in GSAP / springs) happens here and nowhere else.

export const MOTION = {
  enabled: false,
  // Smoothing for input-driven movement (landing camera). See follow().
  follow: true,
  // Damping rates per kind of change (used only when enabled).
  rates: { layerIn: 5, layerOut: 8, settle: 7, bake: 1.6, lid: 5, scroll: 5, pointer: 4 },
};

// Follows user input (scroll, mouse) with light smoothing. This is not an
// animation – the value only moves while the user does – so it stays on even
// with MOTION.enabled = false. Set MOTION.follow = false for raw 1:1 input.
export function follow(current, target, rate, dt) {
  if (!MOTION.follow) return target;
  const next = target + (current - target) * Math.exp(-rate * Math.min(dt, 0.1));
  return Math.abs(next - target) < 1e-5 ? target : next;
}

// Moves `current` towards `target`. With motion off it jumps straight there.
export function approach(current, target, rate, dt) {
  if (!MOTION.enabled) return target;
  const next = target + (current - target) * Math.exp(-rate * dt);
  return Math.abs(next - target) < 1e-4 ? target : next;
}
