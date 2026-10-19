import { fbm, hex, mix, ridged, smooth, worley } from '../../tex/noise.js';

// Pizza extras: chicken, tuna, red onion, corn, jalapeño, rucola, cardboard.
// Same style rules as recipes.js: clean saturated base, drawn details, low
// normal strength. All keys are prefixed `pz`.

const ellipseE = (w, a, b, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = w.dx * c + w.dy * s;
  const y = -w.dx * s + w.dy * c;
  return (x / a) ** 2 + (y / b) ** 2;
};
const dome = e => (e < 1 ? Math.sqrt(1 - e) : 0);
const ink = (e, soft = 0.12) => smooth(1, 1 - soft, e);

// Grilled chicken chunk (planar top view). Golden meat, browner edge, three
// dark grill bars running diagonally and a few char spots.
export const pzChicken = {
  width: 512,
  normal: 0.7,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y * 0.85);
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 311 });
    let c = mix(hex('#F6CF8E'), hex('#E9A95B'), smooth(-0.5, 0.6, n) * 0.7 + r * 0.3);
    // Pale fibres.
    const fib = smooth(0.8, 0.95, ridged(u, v, { scale: 6, scaleY: 9, octaves: 2, seed: 313 }));
    c = mix(c, hex('#FFE8BC'), fib * 0.45);
    let h = 0.55 + fib * 0.04;
    // Grill bars: stripes across the diagonal, wobbling a bit.
    const t = (x * 0.7 + y * 0.7) * 3.1 + Math.sin(y * 3 + n * 3) * 0.12 + 0.35;
    const bar = smooth(0.2, 0.1, Math.abs((((t % 1) + 1) % 1) - 0.5) - 0.28) * smooth(1.02, 0.7, r);
    c = mix(c, mix(hex('#8A4A1F'), hex('#5A2E14'), n * 0.5 + 0.5), bar * 0.92);
    h -= bar * 0.1;
    // Char spots.
    const s = worley(u, v, { scale: 9, seed: 317, jitter: 0.8 });
    if (s.id < 0.35) {
      const k = ink(ellipseE(s, 0.2, 0.14, s.id * 20), 0.3);
      c = mix(c, hex('#A9601F'), k * 0.8);
    }
    c = mix(c, hex('#C7833A'), smooth(0.72, 0.98, r) * 0.8);
    o.color = c;
    o.height = h;
    o.rough = 0.42 - bar * 0.1;
  },
};

// Flaky tuna: pale pink-beige flakes separated by darker seams.
export const pzTuna = {
  width: 512,
  normal: 0.9,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const w = worley(u, v, { scale: 6, scaleY: 8, seed: 331, jitter: 0.95 });
    const seam = 1 - smooth(0.0, 0.16, w.f2 - w.f1);
    const n = fbm(u, v, { scale: 4, octaves: 2, seed: 333 });
    let c = mix(hex('#F0C9AE'), hex('#E2A98C'), w.id * 0.7 + n * 0.2);
    c = mix(c, hex('#FBE3CF'), smooth(0.45, 0.0, w.f1) * 0.35);
    c = mix(c, hex('#B97B60'), seam * 0.75);
    c = mix(c, hex('#C98F72'), smooth(0.8, 1.0, r) * 0.6);
    o.color = c;
    o.height = 0.55 + w.id * 0.1 - seam * 0.35;
    o.rough = 0.32;
  },
};

// Red onion ring (torus uv: u along the ring, v around the tube; v = 0 is the
// outer equator, 0.25 the top). Purple skin outside, pale pink inside.
export const pzRedOnion = {
  width: 256,
  normal: 0.4,
  fn(u, v, o) {
    const outer = 0.5 + 0.5 * Math.cos(v * Math.PI * 2);
    const top = 0.5 + 0.5 * Math.sin(v * Math.PI * 2);
    const n = fbm(u, v, { scale: 4, scaleY: 3, octaves: 2, seed: 341 });
    let c = mix(hex('#FBEAF4'), hex('#B24B9C'), smooth(0.4, 0.95, outer));
    c = mix(c, hex('#8F2C80'), smooth(0.9, 1.0, outer) * 0.5);
    // Fine layer lines along the ring.
    const line = smooth(0.84, 0.97, 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 3 + n));
    c = mix(c, hex('#FFFFFF'), line * 0.35 * smooth(0.2, 0.7, top));
    o.color = c;
    o.height = 0.5 + line * 0.05;
    o.rough = 0.3;
  },
};

// Corn kernel (sphere uv: v = 0 bottom, 1 top).
export const pzCorn = {
  width: 128,
  normal: 0.4,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, octaves: 2, seed: 351 });
    let c = mix(hex('#F3A81A'), hex('#FFD43B'), smooth(0.15, 0.85, v));
    c = mix(c, hex('#FFF0A0'), smooth(0.8, 0.98, v) * 0.7);
    c = mix(c, hex('#E89A12'), (n * 0.5 + 0.5) * 0.2);
    c = mix(c, hex('#D98B10'), smooth(0.97, 1.0, v) * 0.7);
    o.color = c;
    o.height = 0.5;
    o.rough = 0.28;
  },
};

// Jalapeño slice (disc uv): dark skin ring, pale green flesh, cream cavity
// with ribs and a handful of seeds.
export const pzJalapeno = {
  width: 512,
  normal: 0.7,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const n = fbm(u, v, { scale: 3, octaves: 2, seed: 361 });
    const skin = smooth(0.82, 0.88, r);
    const cavity = smooth(0.58 + Math.sin(a * 3) * 0.02, 0.52, r);
    let c = mix(hex('#A8D45A'), hex('#7FBF3C'), smooth(0.3, 0.8, r) + n * 0.1);
    c = mix(c, hex('#2E7A22'), skin);
    c = mix(c, hex('#6DB333'), smooth(0.74, 0.82, r) * (1 - skin) * 0.7);
    c = mix(c, hex('#F4F2BE'), cavity);
    let h = 0.55 - cavity * 0.12;
    const rib = smooth(0.12, 0.03, Math.abs(Math.sin(a * 2 + 0.5)) * Math.min(1, r * 3)) * smooth(0.1, 0.2, r) * cavity;
    c = mix(c, hex('#D9E48A'), rib * 0.8);
    const s = worley(u, v, { scale: 11, seed: 363, jitter: 0.6 });
    if (cavity > 0.5 && s.id < 0.7) {
      const e = ellipseE(s, 0.3, 0.2, a + 1.57);
      const k = ink(e, 0.2);
      c = mix(c, hex('#FFF7C8'), k);
      c = mix(c, hex('#E8D78C'), k * smooth(0.0, 1.0, s.dy + 0.3) * 0.5);
      h += dome(e) * 0.2;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.25;
  },
};

// Rucola leaf (strip uv: u along the length, v across).
export const pzRucola = {
  width: 256,
  normal: 0.8,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const across = Math.abs(v - 0.5) * 2;
    const mid = smooth(0.1, 0.03, across);
    const side = Math.abs(Math.sin((u * 5 - across * 1.4) * Math.PI));
    const vein = smooth(0.1, 0.02, side) * smooth(0.95, 0.25, across);
    const n = fbm(u, v, { scale: 3, octaves: 2, seed: 371 });
    let c = mix(hex('#3F9E34'), hex('#25702A'), smooth(0.05, 1, across) * 0.8 + n * 0.1);
    c = mix(c, hex('#B7E67F'), Math.max(mid, vein * 0.65));
    o.color = c;
    o.height = 0.5 - Math.max(mid, vein) * 0.1;
    o.rough = 0.32;
  },
};

// Corrugated cardboard (box faces): kraft colour, fine fluting lines in one
// direction, painted fibre flecks and a few grease stains. Tiles.
export const pzCardboard = {
  width: 512,
  normal: 0.7,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 381 });
    let c = mix(hex('#D9A86C'), hex('#C8925A'), smooth(-0.5, 0.6, n));
    const rib = 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 24 + n * 1.5);
    c = mix(c, hex('#B97F48'), smooth(0.55, 1, rib) * 0.28);
    const f = worley(u, v, { scale: 28, scaleY: 28, seed: 383, jitter: 1 });
    if (f.id < 0.28) c = mix(c, hex('#8C5A30'), smooth(0.14, 0.04, f.f1) * 0.5);
    else if (f.id > 0.86) c = mix(c, hex('#F0CFA0'), smooth(0.14, 0.04, f.f1) * 0.5);
    const g = worley(u, v, { scale: 3, seed: 385, jitter: 0.8 });
    if (g.id < 0.45) {
      const k = smooth(0.36 + g.id * 0.3, 0.12, g.f1 + n * 0.08);
      c = mix(c, hex('#A8703A'), k * 0.28);
    }
    o.color = c;
    o.height = 0.5 + rib * 0.1;
    o.rough = 0.8;
  },
};
