import { clamp01, fbm, hex, lerp, mix, smooth, worley } from '../../tex/noise.js';

// Döner family: yufka wrap, fries, kraft box, lahmacun, lemon. Same painted,
// readable style as the other recipes (see ../recipes.js).

const ellipseE = (w, a, b, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = w.dx * c + w.dy * s;
  const y = -w.dx * s + w.dy * c;
  return (x / a) ** 2 + (y / b) ** 2;
};
const ink = (e, soft = 0.12) => smooth(1, 1 - soft, e);

// Yufka: pale, thin flatbread with soft golden-brown toasting blotches and
// a few darker blisters. Periodic in u (wraps around the roll).
export const dfYufka = {
  width: 512,
  normal: 0.5,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 201 });
    const f = fbm(u, v, { scale: 14, octaves: 2, seed: 203 });
    let c = mix(hex('#F8E7C2'), hex('#EFCB8C'), smooth(-0.5, 0.6, n));
    const b = worley(u, v, { scale: 7, seed: 205, jitter: 0.8 });
    let h = 0.5 + f * 0.02;
    if (b.id < 0.55) {
      const k = smooth(0.34, 0.1, b.f1);
      c = mix(c, hex('#C98340'), k * 0.75);
      h += k * 0.06;
      const core = smooth(0.14, 0.04, b.f1);
      c = mix(c, hex('#9C5A26'), core * 0.5);
    }
    // Flour dust.
    const d = worley(u, v, { scale: 40, seed: 207 });
    if (d.id < 0.3) c = mix(c, hex('#FFF8E8'), ink(ellipseE(d, 0.2, 0.14, d.id * 30), 0.4) * 0.5);
    o.color = c;
    o.height = h;
    o.rough = 0.6;
  },
};

// French fries: golden with darker, crisp ends. u along the stick.
export const dfFries = {
  width: 256,
  normal: 0.5,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, scaleY: 2, octaves: 3, seed: 211 });
    let c = mix(hex('#FBD870'), hex('#EFAE36'), smooth(-0.5, 0.7, n));
    const edge = smooth(0.8, 1.0, Math.abs(u - 0.5) * 2);
    c = mix(c, hex('#D98A22'), edge * 0.7);
    const sp = worley(u, v, { scale: 9, seed: 213 });
    if (sp.id < 0.3) c = mix(c, hex('#C77A1E'), ink(ellipseE(sp, 0.25, 0.16, 0.3), 0.3) * 0.7);
    o.color = c;
    o.height = 0.5 + n * 0.05;
    o.rough = 0.45;
  },
};

// Kraft cardboard: warm brown with tiny pale fibres.
export const dfKraft = {
  width: 256,
  normal: 0.4,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 5, octaves: 3, seed: 221 });
    let c = mix(hex('#D9B07A'), hex('#C99A62'), smooth(-0.5, 0.6, n));
    const f = worley(u, v, { scale: 34, scaleY: 12, seed: 223 });
    if (f.id < 0.25) c = mix(c, hex('#F0D6A8'), ink(ellipseE(f, 0.3, 0.07, 0.4), 0.3) * 0.6);
    o.color = c;
    o.height = 0.5 + n * 0.03;
    o.rough = 0.8;
  },
};

// Lahmacun, top view on a disc (centre 0.5/0.5): spicy minced topping with
// herb and pepper flecks inside a pale blistered rim. Outside the disc (the
// corners) it is plain dough – used for the underside.
export const dfLahmacun = {
  width: 1024,
  normal: 0.7,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const n = fbm(u, v, { scale: 5, octaves: 3, seed: 231 });
    const dough = mix(hex('#F6DEA8'), hex('#E8B866'), smooth(-0.5, 0.7, n));
    let c = dough;
    let h = 0.5;
    let rough = 0.55;
    const top = smooth(1.05, 0.98, r);
    if (top > 0) {
      const rim = smooth(0.82, 0.88, r);
      const meat = mix(hex('#C7552E'), hex('#A93D22'), smooth(-0.4, 0.7, n));
      let t = meat;
      const lump = worley(u, v, { scale: 34, seed: 233, jitter: 0.9 });
      t = mix(t, hex('#E27A45'), smooth(0.3, 0.1, lump.f1) * 0.5);
      const herb = worley(u, v, { scale: 22, seed: 235, jitter: 0.9 });
      if (herb.id < 0.3) t = mix(t, hex('#5A9A33'), ink(ellipseE(herb, 0.2, 0.1, herb.id * 30)));
      const dark = worley(u, v, { scale: 28, seed: 237, jitter: 0.9 });
      if (dark.id < 0.2) t = mix(t, hex('#6E1E12'), ink(ellipseE(dark, 0.17, 0.12, dark.id * 20)) * 0.8);
      // Blistered golden rim with a few char spots.
      let d = dough;
      const bl = worley(u, v, { scale: 18, seed: 239, jitter: 0.8 });
      if (bl.id < 0.4) d = mix(d, hex('#B8652B'), ink(ellipseE(bl, 0.2, 0.15, bl.id * 20), 0.3) * 0.7);
      c = mix(c, mix(t, d, rim), top);
      h += lump.f1 * 0.05 * (1 - rim);
      rough = lerp(rough, 0.4, 1 - rim);
    }
    o.color = c;
    o.height = h;
    o.rough = rough;
  },
};

// Lemon half-wheel on a disc: pith ring, juicy segments with fine white
// walls, yellow rind.
export const dfLemon = {
  width: 512,
  normal: 0.5,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const rind = smooth(0.86, 0.9, r);
    const pith = smooth(0.8, 0.84, r) * (1 - rind);
    const wall = smooth(0.1, 0.02, Math.abs(Math.sin(a * 4))) * smooth(0.08, 0.18, r) * smooth(0.8, 0.7, r);
    let c = mix(hex('#FFE76A'), hex('#F7D23A'), smooth(0.1, 0.8, r));
    c = mix(c, hex('#FFFBE0'), clamp01(wall + smooth(0.1, 0.03, r) * 0.8));
    c = mix(c, hex('#FFF6C8'), pith);
    c = mix(c, hex('#F4C21B'), rind);
    o.color = c;
    o.height = 0.5 + rind * 0.05;
    o.rough = lerp(0.18, 0.4, rind);
  },
};
