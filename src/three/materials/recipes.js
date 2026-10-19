import { clamp01, fbm, hex, lerp, mix, ridged, smooth, worley } from '../tex/noise.js';

// Texture recipes: pure definitions { width, height, normal, wrapU, wrapV, fn }.
// They run inside Web Workers (see tex/textures.js) and contain no three.js.
//
// Style: Fluent-emoji cartoon. Clean, saturated base colours with soft
// gradients; details (seeds, fat, veins, char spots) are drawn as clear,
// readable shapes – never photographic grain. Normal strength stays low so
// surfaces read smooth and plump.
//
// UV conventions (see geometry helpers):
//   planar  – u,v = world x,z scaled so 1 texture ≈ 2 units (20 cm)
//   disc    – centre (0.5, 0.5), rim at radius 0.5   (slices: salami, tomato …)
//   strip   – u along the length, v across            (meat, lettuce, leaves …)
//   lathe   – u around the axis, v along the profile  (pizza base)

// Elliptical feature inside a worley cell (seeds, specks). Returns the
// normalised radius² (e < 1 is inside).
const ellipseE = (w, a, b, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = w.dx * c + w.dy * s;
  const y = -w.dx * s + w.dy * c;
  return (x / a) ** 2 + (y / b) ** 2;
};
const dome = e => (e < 1 ? Math.sqrt(1 - e) : 0);
// Crisp but anti-aliased edge for drawn shapes.
const ink = (e, soft = 0.12) => smooth(1, 1 - soft, e);

// ───────────────────────────────── Bread ─────────────────────────────────

export const breadCrust = {
  width: 1024,
  normal: 0.9,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, octaves: 3, seed: 3 });
    const fine = fbm(u, v, { scale: 24, octaves: 2, seed: 5 });
    let c = mix(hex('#F8C672'), hex('#CF7E33'), smooth(-0.55, 0.65, n));
    c = mix(c, hex('#FBDDA0'), smooth(0.3, 0.8, fine) * 0.25);
    let h = 0.5 + n * 0.04 + fine * 0.015;
    let r = 0.42;
    // Tiny dark specks (bake marks) between the seeds.
    const d = worley(u, v, { scale: 44, seed: 7 });
    if (d.id < 0.3) {
      const k = ink(ellipseE(d, 0.16, 0.11, d.id * 20), 0.3);
      c = mix(c, hex('#B8682A'), k * 0.55);
      h -= k * 0.05;
    }
    const s = worley(u, v, { scale: 13, seed: 11, jitter: 0.7 });
    if (s.id < 0.55) {
      const e = ellipseE(s, 0.19, 0.095, s.id * 40);
      const k = ink(e);
      if (k > 0) {
        // Seed with its own soft highlight towards the top.
        c = mix(c, mix(hex('#F4DDAE'), hex('#FFF8E8'), clamp01(0.6 - s.dy * 2)), k);
        h += dome(e) * 0.45;
        r = lerp(r, 0.3, k);
      }
    }
    const g = worley(u, v, { scale: 13, seed: 21, jitter: 0.7 });
    if (g.id < 0.16) {
      const e = ellipseE(g, 0.13, 0.08, g.id * 31);
      const k = ink(e);
      if (k > 0) {
        c = mix(c, hex('#3B2A22'), k);
        h += dome(e) * 0.3;
        r = lerp(r, 0.25, k);
      }
    }
    o.color = c;
    o.height = h;
    o.rough = r;
  },
};

export const breadCrumb = {
  width: 512,
  normal: 0.7,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 31 });
    let c = mix(hex('#FFF6E4'), hex('#F8E6C2'), smooth(-0.4, 0.6, n));
    const w = worley(u, v, { scale: 14, seed: 33 });
    const pore = w.id < 0.5 ? smooth(0.3, 0.12, w.f1) : 0;
    c = mix(c, hex('#EED6A8'), pore * 0.8);
    o.color = c;
    o.height = 0.6 + n * 0.05 - pore * 0.15;
    o.rough = 0.8;
  },
};

// ─────────────────────────────── Döner fillings ───────────────────────────

export const doenerMeat = {
  width: 512,
  normal: 0.9,
  wrapV: false,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, octaves: 3, seed: 43 });
    // Juicy lighter stripes along the slice, darker caramelised rim.
    const stripes = 0.5 + 0.5 * Math.sin((v * 4.5 + n * 0.6) * Math.PI * 2);
    const fibres = ridged(u, v, { scale: 2, scaleY: 18, octaves: 2, seed: 41 });
    const edgeDist = Math.min(v, 1 - v, u * 0.45, (1 - u) * 0.45);
    const char = smooth(0.16, 0.03, edgeDist + n * 0.05);
    let c = mix(hex('#DE915A'), hex('#C1703C'), smooth(-0.5, 0.6, n));
    c = mix(c, hex('#F4B27C'), smooth(0.55, 0.9, stripes) * 0.6);
    c = mix(c, hex('#9C4B22'), char * 0.8);
    o.color = c;
    o.height = 0.5 + stripes * 0.06 + fibres * 0.06 + char * 0.05;
    o.rough = lerp(0.42, 0.3, stripes);
  },
};

export const lettuce = {
  width: 512,
  normal: 1,
  wrapV: false,
  fn(u, v, o) {
    const across = Math.abs(v - 0.5) * 2;
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 53 });
    let c = mix(hex('#E7F7B4'), hex('#7CC447'), smooth(0.15, 0.95, across + n * 0.15));
    // Midrib and side veins as clean light lines.
    const mid = smooth(0.06, 0.02, across);
    const side = Math.abs(Math.sin((u * 7 - across * 2.2) * Math.PI));
    const vein = smooth(0.12, 0.03, side) * smooth(0.95, 0.4, across);
    c = mix(c, hex('#F6FDE2'), Math.max(mid, vein * 0.8));
    o.color = c;
    o.height = 0.5 + Math.max(mid, vein) * 0.12 + n * 0.05;
    o.rough = 0.35;
  },
};

export const tomatoSlice = {
  width: 512,
  normal: 0.8,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const sept = Math.abs(Math.cos(2 * a));
    const chamber = smooth(0.62, 0.56, r) * smooth(0.2, 0.26, r) * smooth(0.86, 0.72, sept);
    let c = mix(hex('#FF5A3C'), hex('#F23B26'), smooth(0.3, 0.9, r));
    c = mix(c, hex('#FF8E6A'), chamber);
    c = mix(c, hex('#FF8466'), smooth(0.2, 0.12, r) * 0.7);
    c = mix(c, hex('#D8231A'), smooth(0.88, 0.93, r));
    let h = 0.6 - chamber * 0.1;
    // Seeds: a few clear drops in each chamber.
    const s = worley(u, v, { scale: 14, seed: 63, jitter: 0.5 });
    if (chamber > 0.6 && s.id < 0.8) {
      const e = ellipseE(s, 0.24, 0.15, a);
      c = mix(c, hex('#FFE7AE'), ink(e, 0.2));
      h += dome(e) * 0.12;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.4;
  },
};

export const cucumberSlice = {
  width: 512,
  normal: 0.8,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    let c = mix(hex('#EEF9CF'), hex('#C5E585'), smooth(0.15, 0.85, r));
    const bed = smooth(0.5, 0.42, r - Math.cos(3 * a) * 0.07) * smooth(0.08, 0.16, r);
    c = mix(c, hex('#F6FCE4'), bed * 0.6);
    const skin = smooth(0.86, 0.9, r);
    const stripe = 0.5 + 0.5 * Math.sin(a * 14);
    c = mix(c, mix(hex('#3C8A2C'), hex('#5BAA3E'), stripe), skin);
    let h = 0.6;
    const s = worley(u, v, { scale: 11, seed: 73, jitter: 0.4 });
    if (bed > 0.6 && s.id < 0.85) {
      const e = ellipseE(s, 0.3, 0.15, a);
      c = mix(c, hex('#FBFFF0'), ink(e, 0.25));
      h += dome(e) * 0.08;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.22;
  },
};

export const onion = {
  width: 256,
  normal: 0.5,
  fn(u, v, o) {
    // Torus uv: v around the tube. Outer side purple, inside white.
    const side = 0.5 + 0.5 * Math.cos(v * Math.PI * 2);
    o.color = mix(hex('#FBEFF7'), hex('#A6458F'), smooth(0.35, 0.8, side));
    o.height = 0.5;
    o.rough = 0.25;
  },
};

const cabbage = (dark, light, seed) => ({
  width: 256,
  normal: 0.6,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 2, scaleY: 1, octaves: 3, seed });
    const vein = smooth(0.82, 0.96, 0.5 + 0.5 * Math.sin((u * 6 + n) * Math.PI * 2));
    o.color = mix(mix(hex(dark), hex(light), smooth(-0.6, 0.8, n) * 0.35), hex(light), vein * 0.8);
    o.height = 0.5 + vein * 0.1;
    o.rough = 0.32;
  },
});
export const redCabbage = cabbage('#7A2A6E', '#D9A0CF', 91);
export const whiteCabbage = cabbage('#DCEBA6', '#FBFEEA', 93);

export const feta = {
  width: 256,
  normal: 0.8,
  fn(u, v, o) {
    const w = worley(u, v, { scale: 6, seed: 103 });
    const pit = w.id < 0.45 ? smooth(0.28, 0.12, w.f1) : 0;
    o.color = mix(hex('#FFFDF6'), hex('#EFE7D3'), pit);
    o.height = 0.5 - pit * 0.25;
    o.rough = 0.7;
  },
};

export const garlicSauce = {
  width: 256,
  normal: 0.3,
  fn(u, v, o) {
    const w = worley(u, v, { scale: 10, scaleY: 3, seed: 113 });
    const herb = w.id < 0.2 ? ink(ellipseE(w, 0.22, 0.1, w.id * 9)) : 0;
    o.color = mix(hex('#FFFCF4'), hex('#6FA03C'), herb);
    o.height = 0.5;
    o.rough = 0.15;
  },
};

// ───────────────────────────────── Pizza ─────────────────────────────────

// Pizza base on a lathe: u around (periodic), v along the profile from the
// centre (0) over the rim (0.55–0.85) to the underside (0.85–1). `baked`
// toggles pale dough ↔ golden crust with a few soft char spots.
const BASE_U = 36;
const BASE_V = 9;
const baseRecipe = baked => (u, v, o) => {
  const n = fbm(u, v, { scale: 8, scaleY: 2, octaves: 3, seed: 121 });
  const rim = smooth(0.52, 0.6, v) * smooth(0.9, 0.82, v);
  const under = smooth(0.82, 0.9, v);
  let h = 0.5 + n * 0.04;
  let c;
  if (!baked) {
    c = mix(hex('#FBEACB'), hex('#F2D8A8'), smooth(-0.5, 0.6, n) * 0.7 + under * 0.3);
  } else {
    const top = hex('#F8DDA6');
    const crust = mix(hex('#F7B65C'), hex('#E08A3A'), smooth(-0.4, 0.7, n) * 0.6 + (v - 0.55) * 1.2);
    c = mix(top, crust, rim);
    c = mix(c, hex('#D68A45'), under);
    // Small raised blisters with a darker ring.
    const b = worley(u, v, { scale: 110, scaleY: 28, seed: 129 });
    if (b.id < 0.35) {
      const size = 0.22 + b.id * 0.4;
      const ringK = smooth(size * 1.4, size, b.f1) - smooth(size, size * 0.6, b.f1);
      const top = smooth(size, size * 0.4, b.f1);
      c = mix(c, hex('#C8742F'), ringK * 0.45 * (rim + under * 0.5));
      c = mix(c, hex('#FFD596'), top * 0.35 * rim);
      h += top * 0.08 * (rim + under * 0.5);
    }
    // Flour dust on the underside and lower rim.
    const fl = worley(u, v, { scale: 160, scaleY: 40, seed: 131 });
    if (fl.id < 0.25) c = mix(c, hex('#FFF1D6'), ink(ellipseE(fl, 0.2, 0.2, 0), 0.4) * smooth(0.7, 0.95, v) * 0.7);
    const w = worley(u, v, { scale: BASE_U, scaleY: BASE_V, seed: 125 });
    if (w.id < 0.32) {
      const size = 0.16 + w.id * 0.8;
      const spot = smooth(size, size * 0.55, w.f1 + n * 0.08) * (rim + under * 0.4);
      c = mix(c, mix(hex('#B8652B'), hex('#7A3B1A'), smooth(size * 0.5, 0, w.f1)), spot * 0.9);
      h += spot * 0.05;
    }
  }
  o.color = c;
  o.height = h;
  o.rough = baked ? 0.5 : 0.65;
};
export const pizzaBaseRaw = { width: 2048, height: 512, normal: 0.8, wrapV: false, fn: baseRecipe(false) };
export const pizzaBaseBaked = { width: 2048, height: 512, normal: 0.8, wrapV: false, fn: baseRecipe(true) };

export const tomatoSauce = {
  width: 1024,
  normal: 0.6,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 131 });
    let c = mix(hex('#E0301C'), hex('#B82015'), smooth(-0.5, 0.6, n));
    let h = 0.5 + n * 0.05;
    const w = worley(u, v, { scale: 18, seed: 135, jitter: 0.8 });
    if (w.id < 0.12) {
      const e = ellipseE(w, 0.2, 0.08, w.id * 50);
      c = mix(c, hex('#4E7E2A'), ink(e));
      h += dome(e) * 0.06;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.45;
  },
};

// Melted mozzarella as one sheet over the pizza (disc UV, non-tiling).
// Alpha cuts the lobed edge and a few holes where the sauce shows through;
// height (also used for real displacement) melts down towards those edges.
// Same relief raw/baked; baked turns the bubble tops golden.
const cheeseRecipe = baked => (u, v, o) => {
  const x = (u - 0.5) * 2;
  const y = (v - 0.5) * 2;
  const r = Math.hypot(x, y);
  const n = fbm(u, v, { scale: 5, octaves: 3, seed: 145 });
  const lobes = fbm(u, v, { scale: 4, octaves: 2, seed: 147 });
  const edge = 0.88 + lobes * 0.1;
  const cover = smooth(edge, edge - 0.08, r);
  const holes = smooth(-0.36, -0.48, fbm(u, v, { scale: 5, octaves: 2, seed: 149 }));
  const coverage = cover * (1 - holes);
  const w = worley(u, v, { scale: 7, seed: 141 });
  const bubble = Math.pow(clamp01(1 - w.f1 * 1.15), 1.4);
  const relief = 0.5 + bubble * 0.42 + n * 0.04;
  const h = relief * smooth(0.2, 0.9, coverage);
  let c = mix(hex('#FFF6D2'), hex('#FFE89A'), smooth(-0.4, 0.6, n) * 0.6 + (1 - coverage) * 0.3);
  if (baked) {
    c = mix(c, hex('#FFDF73'), 0.55);
    const golden = smooth(0.7, 0.88, relief) * (w.id < 0.5 ? 1 : 0.2);
    c = mix(c, hex('#F4A83E'), golden);
  }
  o.color = c;
  o.alpha = smooth(0.3, 0.5, coverage);
  o.height = h;
  o.rough = 0.3;
};
export const cheeseRaw = { width: 1024, normal: 0.8, wrapU: false, wrapV: false, fn: cheeseRecipe(false) };
export const cheeseBaked = { width: 1024, normal: 0.8, wrapU: false, wrapV: false, fn: cheeseRecipe(true) };

export const salami = {
  width: 512,
  normal: 0.6,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const n = fbm(u, v, { scale: 3, octaves: 3, seed: 151 });
    let c = mix(hex('#F04A46'), hex('#D23238'), smooth(-0.5, 0.6, n) * 0.6 + r * 0.4);
    let h = 0.5;
    // A handful of big, round fat dots – the emoji salami look.
    const f = worley(u, v, { scale: 5, seed: 153, jitter: 0.6 });
    if (f.id < 0.7 && r < 0.78) {
      const size = 0.17 + f.id * 0.12;
      const k = smooth(size, size * 0.85, f.f1);
      c = mix(c, hex('#FFE9E2'), k);
      h += k * 0.05;
    }
    c = mix(c, hex('#A3302C'), smooth(0.86, 0.92, r));
    o.color = c;
    o.height = h;
    o.rough = 0.5;
  },
};

export const olive = {
  width: 128,
  normal: 0.3,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 2, octaves: 2, seed: 161 });
    o.color = mix(hex('#45324A'), hex('#271B2A'), smooth(-0.5, 0.5, n));
    o.height = 0.5;
    o.rough = 0.15;
  },
};

export const mushroom = {
  width: 256,
  normal: 0.5,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    // Disc-style UV over the slice: gills darken just under the cap.
    const gills = smooth(0.62, 0.52, v) * smooth(0.38, 0.47, v) * smooth(0.12, 0.3, Math.abs(u - 0.5));
    const lines = 0.5 + 0.5 * Math.sin(u * 60);
    let c = mix(hex('#FBF1E2'), hex('#F0DFC6'), smooth(0.3, 0.9, v));
    c = mix(c, mix(hex('#C9A57D'), hex('#B48E66'), lines), gills * 0.8);
    o.color = c;
    o.height = 0.5 - gills * 0.04;
    o.rough = 0.5;
  },
};

export const basil = {
  width: 256,
  normal: 0.8,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const across = Math.abs(v - 0.5) * 2;
    const mid = smooth(0.08, 0.03, across);
    const side = Math.abs(Math.sin((u * 6 - across * 1.8) * Math.PI));
    const vein = smooth(0.1, 0.02, side) * smooth(0.9, 0.3, across);
    let c = mix(hex('#4DB840'), hex('#2F8A2E'), smooth(0.1, 1, across));
    c = mix(c, hex('#9FE07A'), Math.max(mid, vein * 0.7));
    o.color = c;
    o.height = 0.5 - Math.max(mid, vein) * 0.1;
    o.rough = 0.3;
  },
};

export const pepper = {
  width: 128,
  normal: 0.3,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 2, scaleY: 1, octaves: 2, seed: 191 });
    o.color = mix(hex('#F43B2B'), hex('#D6261C'), smooth(-0.5, 0.5, n));
    o.height = 0.5;
    o.rough = 0.15;
  },
};

export const ham = {
  width: 256,
  normal: 0.5,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, octaves: 3, seed: 201 });
    const marble = ridged(u, v, { scale: 2, octaves: 2, seed: 203 });
    let c = mix(hex('#FBB0B0'), hex('#F09396'), smooth(-0.5, 0.6, n));
    c = mix(c, hex('#FFDCDA'), smooth(0.88, 0.97, marble) * 0.8);
    o.color = c;
    o.height = 0.5 + n * 0.03;
    o.rough = 0.38;
  },
};

// ─────────────────────────── package recipes ─────────────────────────────
// Each work package keeps its recipes in recipes/<package>.js and adds one
// re-export line here. Keys must be unique across all packages.
