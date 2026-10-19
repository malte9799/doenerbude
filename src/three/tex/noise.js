// Seeded, tileable noise for procedural textures. Every function takes an
// integer `period` so a texture wraps seamlessly (u across a lathe seam etc.).

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mod = (a, n) => ((a % n) + n) % n;

// Integer hash → [0, 1).
export function hash2(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const GRADS = 256;
const GX = new Float32Array(GRADS);
const GY = new Float32Array(GRADS);
for (let i = 0; i < GRADS; i++) {
  GX[i] = Math.cos((i / GRADS) * Math.PI * 2);
  GY[i] = Math.sin((i / GRADS) * Math.PI * 2);
}

const fade = t => t * t * t * (t * (t * 6 - 15) + 10);

// Periodic gradient noise in [-1, 1] (roughly). Period in lattice cells.
export function perlin(x, y, px = 256, py = px, seed = 0) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const grad = (ix, iy, dx, dy) => {
    const g = (hash2(mod(ix, px), mod(iy, py), seed) * GRADS) | 0;
    return GX[g] * dx + GY[g] * dy;
  };
  const n00 = grad(x0, y0, fx, fy);
  const n10 = grad(x0 + 1, y0, fx - 1, fy);
  const n01 = grad(x0, y0 + 1, fx, fy - 1);
  const n11 = grad(x0 + 1, y0 + 1, fx - 1, fy - 1);
  const u = fade(fx);
  const v = fade(fy);
  return 1.414 * ((n00 * (1 - u) + n10 * u) * (1 - v) + (n01 * (1 - u) + n11 * u) * v);
}

// Fractal noise over normalised coords u,v ∈ [0,1). `scale` = cells across the
// texture at the first octave (integer keeps it tileable). Result ≈ [-1, 1].
export function fbm(u, v, { scale = 4, scaleY = scale, octaves = 5, gain = 0.5, seed = 0 } = {}) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let sx = scale;
  let sy = scaleY;
  for (let o = 0; o < octaves; o++) {
    sum += amp * perlin(u * sx, v * sy, sx, sy, seed + o * 17);
    norm += amp;
    amp *= gain;
    sx *= 2;
    sy *= 2;
  }
  return sum / norm;
}

// Ridged variant – sharp creases (fibres, cracks, veins).
export function ridged(u, v, opts) {
  return 1 - Math.abs(fbm(u, v, opts));
}

// Periodic cellular noise. Returns distances to the nearest two feature points
// (in cell units) plus a stable random id for the nearest cell and the offset
// to its point (dx, dy) – enough for seeds, pores, bubbles and specks.
export function worley(u, v, { scale = 8, scaleY = scale, seed = 0, jitter = 1 } = {}) {
  const x = u * scale;
  const y = v * scaleY;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 9;
  let f2 = 9;
  let id = 0;
  let dx1 = 0;
  let dy1 = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = mod(xi + i, scale);
      const cy = mod(yi + j, scaleY);
      const px = xi + i + 0.5 + (hash2(cx, cy, seed) - 0.5) * jitter;
      const py = yi + j + 0.5 + (hash2(cx, cy, seed + 101) - 0.5) * jitter;
      const dx = px - x;
      const dy = py - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = hash2(cx, cy, seed + 7);
        dx1 = dx;
        dy1 = dy;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return { f1, f2, id, dx: dx1, dy: dy1 };
}

export const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;

// Colours as [r, g, b] in sRGB 0..1.
export const hex = h => {
  const n = parseInt(h.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
