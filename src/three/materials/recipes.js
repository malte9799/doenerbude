import { clamp01, fbm, hex, lerp, mix, ridged, smooth, worley } from '../tex/noise.js';

// Texture recipes: pure definitions { width, height, normal, wrapU, wrapV, fn }.
// They run inside Web Workers (see tex/textures.js) and contain no three.js.
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

// ───────────────────────────────── Bread ─────────────────────────────────

export const breadCrust = {
  width: 1024,
  normal: 1.6,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 5, octaves: 5, seed: 3 });
    const fine = fbm(u, v, { scale: 40, octaves: 3, seed: 5 });
    let c = mix(hex('#EDBE74'), hex('#B36A2A'), smooth(-0.35, 0.55, n));
    c = mix(c, hex('#F6DDAD'), smooth(0.35, 0.85, fine) * 0.35); // flour dust
    let h = 0.5 + n * 0.12 + fine * 0.04;
    let r = 0.48 + fine * 0.1;

    const p = worley(u, v, { scale: 64, seed: 9 });
    const pore = p.id < 0.45 ? smooth(0.28, 0.06, p.f1) : 0;
    c = mix(c, hex('#8A4E20'), pore * 0.45);
    h -= pore * 0.12;

    // Sesame (light, raised) and nigella (black, small) seeds.
    const s = worley(u, v, { scale: 13, seed: 11, jitter: 0.75 });
    if (s.id < 0.5) {
      const e = ellipseE(s, 0.17, 0.085, s.id * 40);
      const d = dome(e);
      if (d > 0) {
        c = mix(hex('#DDBF86'), hex('#FFF3D6'), Math.pow(d, 0.6));
        h += d * 0.3;
        r = 0.38;
      } else if (e < 1.9) {
        c = mix(c, hex('#8E5524'), (1 - (e - 1) / 0.9) * 0.35); // contact shadow
      }
    }
    const g = worley(u, v, { scale: 19, seed: 21, jitter: 0.75 });
    if (g.id < 0.28) {
      const d = dome(ellipseE(g, 0.11, 0.065, g.id * 31));
      if (d > 0) {
        c = mix(hex('#3C332D'), hex('#151212'), d);
        h += d * 0.22;
        r = 0.32;
      }
    }
    o.color = c;
    o.height = h;
    o.rough = r;
  },
};

export const breadCrumb = {
  width: 1024,
  normal: 0.9,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 6, octaves: 4, seed: 31 });
    let c = mix(hex('#FBF1DC'), hex('#EFDDB6'), smooth(-0.4, 0.6, n));
    let h = 0.6 + n * 0.05;
    // Airy crumb: many small, slightly stretched pores at three sizes.
    for (const [scale, seed, size, depth, amt] of [
      [34, 33, 0.34, 0.22, 0.5],
      [70, 35, 0.32, 0.14, 0.4],
      [140, 37, 0.3, 0.08, 0.3],
    ]) {
      const w = worley(u, v, { scale, scaleY: Math.round(scale * 0.8), seed });
      const hole = w.id < 0.6 ? smooth(size, size * 0.3, w.f1) : 0;
      h -= hole * depth;
      c = mix(c, hex('#DCC08E'), hole * amt);
    }
    o.color = c;
    o.height = h;
    o.rough = 0.9;
  },
};

// ─────────────────────────────── Döner fillings ───────────────────────────

export const doenerMeat = {
  width: 512,
  normal: 2.2,
  wrapV: false,
  fn(u, v, o) {
    const fibres = ridged(u, v, { scale: 3, scaleY: 36, octaves: 3, seed: 41 });
    const n = fbm(u, v, { scale: 4, octaves: 4, seed: 43 });
    const crisp = fbm(u, v, { scale: 24, octaves: 2, seed: 45 });
    // Caramelised, irregular edges; juicy lighter centre.
    const edgeDist = Math.min(v, 1 - v, u * 0.4, (1 - u) * 0.4);
    const char = smooth(0.14, 0.01, edgeDist + n * 0.06);
    let c = mix(hex('#D69A68'), hex('#B4693B'), smooth(-0.4, 0.5, n));
    c = mix(c, hex('#E8B486'), fibres * fibres * 0.3);
    c = mix(c, hex('#7A3A18'), char * (0.7 + crisp * 0.3));
    o.color = c;
    o.height = 0.5 + fibres * 0.22 + char * crisp * 0.25;
    o.rough = lerp(0.45, 0.28, smooth(0.1, 0.7, n)); // fat sheen
  },
};

export const lettuce = {
  width: 512,
  normal: 1.4,
  wrapV: false,
  fn(u, v, o) {
    const veins = ridged(u, v, { scale: 6, scaleY: 2, octaves: 3, seed: 51 });
    const n = fbm(u, v, { scale: 5, octaves: 4, seed: 53 });
    const edge = smooth(0.15, 0.5, Math.abs(v - 0.5) * 2 + n * 0.2);
    let c = mix(hex('#E6F2BE'), hex('#8CC452'), edge);
    c = mix(c, hex('#F5FAE2'), smooth(0.85, 0.98, veins) * 0.6);
    o.color = c;
    o.height = 0.5 + n * 0.25 + smooth(0.8, 1, veins) * 0.15;
    o.rough = 0.42;
  },
};

export const tomatoSlice = {
  width: 512,
  normal: 1.8,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const n = fbm(u, v, { scale: 6, octaves: 4, seed: 61 });
    // Four chambers separated by septa, wobbling.
    const sept = Math.abs(Math.cos(2 * (a + n * 0.25)));
    const septum = smooth(0.82, 0.96, sept);
    const core = smooth(0.24, 0.12, r + n * 0.04);
    const wall = smooth(0.66, 0.76, r + n * 0.03);
    const skin = smooth(0.92, 0.96, r);
    const chamber = (1 - wall) * (1 - septum) * (1 - core);

    let c = mix(hex('#EC4A33'), hex('#E33A28'), n * 0.5 + 0.5); // flesh
    c = mix(c, hex('#F58B6A'), chamber * 0.85); // jelly
    c = mix(c, hex('#F7A383'), core * 0.7);
    c = mix(c, hex('#C51F18'), skin);
    let h = 0.6 - chamber * 0.18;

    // Seeds sit in the jelly near the septa.
    const s = worley(u, v, { scale: 26, seed: 63, jitter: 0.6 });
    if (chamber > 0.5 && s.id < 0.7) {
      const d = dome(ellipseE(s, 0.24, 0.14, a));
      if (d > 0) {
        c = mix(c, hex('#F7DDA0'), Math.pow(d, 0.5));
        h += d * 0.12;
      }
    }
    o.color = c;
    o.height = h;
    o.rough = 0.22 + chamber * 0.05;
  },
};

export const cucumberSlice = {
  width: 512,
  normal: 1.6,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const n = fbm(u, v, { scale: 8, octaves: 3, seed: 71 });
    let c = mix(hex('#DDEDB2'), hex('#C7E08F'), smooth(0.2, 0.7, r));
    // Three-lobed seed bed.
    const lobe = Math.cos(3 * a) * 0.08;
    const bed = smooth(0.52, 0.42, r - lobe) * smooth(0.1, 0.18, r);
    c = mix(c, hex('#E8F2C8'), bed * 0.7);
    const skin = smooth(0.88, 0.93, r + n * 0.02);
    c = mix(c, mix(hex('#2F5E22'), hex('#4E8433'), smooth(-0.2, 0.4, n)), skin);
    let h = 0.6;
    const s = worley(u, v, { scale: 20, seed: 73, jitter: 0.5 });
    if (bed > 0.6 && s.id < 0.8) {
      const d = dome(ellipseE(s, 0.28, 0.13, a));
      if (d > 0) {
        c = mix(c, hex('#F4F8E2'), d * 0.9);
        h += d * 0.1;
      }
    }
    o.color = c;
    o.height = h + n * 0.03;
    o.rough = 0.25;
  },
};

export const onion = {
  width: 256,
  normal: 1,
  wrapV: true,
  fn(u, v, o) {
    // Torus uv: v around the tube. Outer side (v≈0) purple, inside white.
    const side = 0.5 + 0.5 * Math.cos(v * Math.PI * 2);
    const n = fbm(u, v, { scale: 16, scaleY: 2, octaves: 3, seed: 81 });
    let c = mix(hex('#F3E6EE'), hex('#8E3B78'), smooth(0.35, 0.75, side + n * 0.15));
    o.color = c;
    o.height = 0.5 + n * 0.1;
    o.rough = 0.3;
  },
};

export const redCabbage = {
  width: 256,
  normal: 1,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, scaleY: 1, octaves: 4, seed: 91 });
    const vein = smooth(0.35, 0.75, n);
    o.color = mix(hex('#6E2159'), hex('#E9D2E6'), vein * 0.8);
    o.height = 0.5 + n * 0.2;
    o.rough = 0.35;
  },
};

export const whiteCabbage = {
  width: 256,
  normal: 1,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, scaleY: 1, octaves: 4, seed: 93 });
    o.color = mix(hex('#D8E6A6'), hex('#F6F7E4'), smooth(-0.2, 0.6, n));
    o.height = 0.5 + n * 0.2;
    o.rough = 0.38;
  },
};

export const feta = {
  width: 256,
  normal: 2.4,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 6, octaves: 5, seed: 101 });
    const w = worley(u, v, { scale: 10, seed: 103 });
    const pit = w.id < 0.5 ? smooth(0.3, 0.08, w.f1) : 0;
    o.color = mix(mix(hex('#FBF8F0'), hex('#EDE6D4'), smooth(0, 0.8, n)), hex('#DDD3BC'), pit * 0.6);
    o.height = 0.5 + n * 0.3 - pit * 0.3;
    o.rough = 0.82;
  },
};

export const garlicSauce = {
  width: 256,
  normal: 0.6,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 8, scaleY: 2, octaves: 3, seed: 111 });
    const w = worley(u, v, { scale: 24, scaleY: 6, seed: 113 });
    const herb = w.id < 0.18 ? smooth(0.22, 0.12, w.f1) : 0;
    o.color = mix(mix(hex('#FBF7EC'), hex('#EFE8D5'), smooth(-0.3, 0.6, n)), hex('#5E7D35'), herb);
    o.height = 0.5 + n * 0.1;
    o.rough = 0.18;
  },
};

// ───────────────────────────────── Pizza ─────────────────────────────────

// Pizza base on a lathe: u around (periodic), v along the profile from the
// centre (0) over the rim (≈0.55–0.82) to the underside (1). `baked` toggles
// pale dough ↔ leopard-spotted crust.
const BASE_U = 64;
const BASE_V = 16;
const baseRecipe = baked => (u, v, o) => {
  const n = fbm(u, v, { scale: 10, scaleY: 3, octaves: 5, seed: 121 });
  const fine = fbm(u, v, { scale: 80, scaleY: 20, octaves: 2, seed: 123 });
  const rim = smooth(0.5, 0.6, v) * smooth(0.9, 0.8, v);
  const under = smooth(0.8, 0.9, v);
  const flour = smooth(0.3, 0.9, fine) * 0.45;
  let h = 0.5 + n * 0.12 + fine * 0.04;
  let c;
  let r = 0.7;
  if (!baked) {
    c = mix(hex('#F4E1B8'), hex('#EAD1A0'), smooth(-0.4, 0.6, n));
    c = mix(c, hex('#FFFBF1'), flour * (0.5 + under));
    r = 0.75;
  } else {
    const top = mix(hex('#F0D6A2'), hex('#E8C084'), n * 0.5 + 0.5);
    const crust = mix(hex('#E9A858'), hex('#B86A2C'), smooth(-0.2, 0.6, n + rim * 0.2));
    c = mix(top, crust, rim);
    c = mix(c, mix(hex('#C98A48'), hex('#9C5B27'), n * 0.5 + 0.5), under);
    // Leopard spots: char blisters on the rim.
    const warp = fbm(u, v, { scale: 20, scaleY: 5, octaves: 3, seed: 127 });
    const w = worley(u, v, { scale: BASE_U, scaleY: BASE_V, seed: 125 });
    if (w.id < 0.3) {
      const size = 0.08 + w.id * 0.55;
      const d = w.f1 + warp * 0.18 + fine * 0.05;
      const halo = smooth(size * 2.2, size, d) * (rim + under * 0.3);
      const blister = smooth(size, size * 0.4, d) * (rim + under * 0.3);
      c = mix(c, hex('#9A5422'), halo * 0.5);
      c = mix(c, mix(hex('#4A2814'), hex('#1E120C'), blister), blister * 0.92);
      h += blister * 0.1 + halo * 0.04;
    }
    c = mix(c, hex('#F7EBD3'), flour * under * 0.8);
    r = 0.62;
  }
  o.color = c;
  o.height = h;
  o.rough = r;
};
export const pizzaBaseRaw = { width: 2048, height: 512, normal: 1.4, wrapV: false, fn: baseRecipe(false) };
export const pizzaBaseBaked = { width: 2048, height: 512, normal: 1.4, wrapV: false, fn: baseRecipe(true) };

export const tomatoSauce = {
  width: 1024,
  normal: 1.4,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 6, octaves: 5, seed: 131 });
    const pulp = fbm(u, v, { scale: 30, octaves: 3, seed: 133 });
    let c = mix(hex('#C42A1E'), hex('#A01810'), smooth(-0.4, 0.5, n));
    c = mix(c, hex('#DE4B2E'), smooth(0.3, 0.8, pulp) * 0.6);
    let h = 0.5 + n * 0.08 + pulp * 0.08;
    const w = worley(u, v, { scale: 34, seed: 135, jitter: 0.8 });
    if (w.id < 0.14) {
      const d = dome(ellipseE(w, 0.16, 0.06, w.id * 50));
      if (d > 0) {
        c = mix(c, hex('#3F5C22'), Math.min(1, d * 2)); // oregano
        h += d * 0.05;
      }
    }
    o.color = c;
    o.height = h;
    o.rough = 0.26 + pulp * 0.05;
  },
};

// Melted mozzarella. Same relief raw/baked; baked browns the bubble tops.
// Melted mozzarella as one sheet over the pizza (disc UV, non-tiling).
// Alpha cuts the lobed edge and a few holes where the sauce shows through;
// height (also used for real displacement) melts down towards those edges.
// Same relief raw/baked; baked browns the bubble tops.
const cheeseRecipe = baked => (u, v, o) => {
  const x = (u - 0.5) * 2;
  const y = (v - 0.5) * 2;
  const r = Math.hypot(x, y);
  const n = fbm(u, v, { scale: 7, octaves: 4, seed: 145 });
  const lobes = fbm(u, v, { scale: 5, octaves: 3, seed: 147 });
  const edge = 0.9 + lobes * 0.09;
  const cover = smooth(edge, edge - 0.1, r);
  const holes = smooth(-0.32, -0.46, fbm(u, v, { scale: 6, octaves: 3, seed: 149 }));
  const coverage = cover * (1 - holes);
  const w = worley(u, v, { scale: 11, seed: 141 });
  const w2 = worley(u, v, { scale: 27, seed: 143 });
  const bubble = Math.pow(clamp01(1 - w.f1 * 1.2), 1.5);
  const small = Math.pow(clamp01(1 - w2.f1 * 1.3), 2);
  const relief = 0.45 + bubble * 0.4 + small * 0.12 + n * 0.06;
  const h = relief * smooth(0.2, 0.9, coverage);
  let c = mix(hex('#FFF7E0'), hex('#F7E4A6'), smooth(-0.3, 0.7, n) * 0.8 + (1 - coverage) * 0.4);
  if (baked) {
    c = mix(c, hex('#F6D47E'), 0.4);
    const brown = smooth(0.6, 0.82, relief + n * 0.12) * (w.id < 0.55 ? 1 : 0.35);
    c = mix(c, hex('#DD9C48'), brown);
    c = mix(c, hex('#A2602A'), smooth(0.84, 0.98, relief + n * 0.1) * brown);
  }
  o.color = c;
  o.alpha = smooth(0.3, 0.5, coverage);
  o.height = h;
  o.rough = baked ? 0.3 : 0.36;
};
export const cheeseRaw = { width: 1024, normal: 1.4, wrapU: false, wrapV: false, fn: cheeseRecipe(false) };
export const cheeseBaked = { width: 1024, normal: 1.4, wrapU: false, wrapV: false, fn: cheeseRecipe(true) };

export const salami = {
  width: 512,
  normal: 1.4,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const n = fbm(u, v, { scale: 5, octaves: 4, seed: 151 });
    let c = mix(hex('#C9393A'), hex('#9E2427'), smooth(-0.4, 0.5, n));
    let h = 0.5 + n * 0.05;
    let rough = 0.42;
    // Fat: irregular flecks of different sizes.
    const warp = fbm(u, v, { scale: 16, octaves: 2, seed: 155 }) * 0.18;
    const f = worley(u + warp * 0.05, v - warp * 0.05, { scale: 9, seed: 153 });
    if (f.id < 0.55) {
      const size = 0.16 + f.id * 0.22;
      const fat = smooth(size, size * 0.55, f.f1 + warp);
      c = mix(c, hex('#F7E1D8'), fat);
      h += fat * 0.06;
      rough = lerp(rough, 0.28, fat);
    }
    const p = worley(u, v, { scale: 22, seed: 157 });
    if (p.id < 0.07) {
      const d = dome(ellipseE(p, 0.16, 0.13, p.id * 60));
      c = mix(c, hex('#241818'), Math.min(1, d * 3));
      h += d * 0.08;
    }
    c = mix(c, hex('#6E2019'), smooth(0.86, 0.95, r));
    o.color = c;
    o.height = h;
    o.rough = rough;
  },
};

export const olive = {
  width: 128,
  normal: 0.8,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 161 });
    o.color = mix(hex('#3A2733'), hex('#1E1519'), smooth(-0.4, 0.5, n));
    o.height = 0.5 + n * 0.1;
    o.rough = 0.22;
  },
};

export const mushroom = {
  width: 256,
  normal: 1.2,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    // Fibres run vertically through the stem, fan out into the cap.
    // Disc-style UV over the slice: gills darken just under the cap.
    const fib = ridged(u, v, { scale: 18, scaleY: 4, octaves: 2, seed: 171 });
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 173 });
    const gills = smooth(0.62, 0.52, v) * smooth(0.38, 0.47, v) * smooth(0.12, 0.3, Math.abs(u - 0.5));
    let c = mix(hex('#F1E4CF'), hex('#E2CDAE'), smooth(-0.3, 0.6, n));
    c = mix(c, hex('#B99876'), gills * 0.7);
    c = mix(c, hex('#D9C2A0'), smooth(0.9, 1, fib) * 0.25);
    o.color = c;
    o.height = 0.5 + fib * 0.04 - gills * 0.05;
    o.rough = 0.55;
  },
};

export const basil = {
  width: 256,
  normal: 1.6,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const mid = smooth(0.035, 0, Math.abs(v - 0.5));
    // Side veins: diagonal lines leaving the midrib.
    const side = Math.abs(Math.sin((u * 7 - Math.abs(v - 0.5) * 3.5) * Math.PI));
    const vein = smooth(0.08, 0, side) * smooth(0.45, 0.1, Math.abs(v - 0.5));
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 181 });
    let c = mix(hex('#3E8E2E'), hex('#2A6B21'), smooth(-0.3, 0.6, n));
    c = mix(c, hex('#7CBF55'), Math.max(mid, vein * 0.6));
    o.color = c;
    o.height = 0.5 - Math.max(mid, vein) * 0.2 + n * 0.1;
    o.rough = 0.32;
  },
};

export const pepper = {
  width: 128,
  normal: 0.6,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, scaleY: 1, octaves: 3, seed: 191 });
    o.color = mix(hex('#D8301E'), hex('#B21E14'), smooth(-0.3, 0.5, n));
    o.height = 0.5 + n * 0.1;
    o.rough = 0.2;
  },
};

export const ham = {
  width: 256,
  normal: 1,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 4, seed: 201 });
    const marble = ridged(u, v, { scale: 3, octaves: 3, seed: 203 });
    let c = mix(hex('#EE9E9B'), hex('#E2837F'), smooth(-0.3, 0.6, n));
    c = mix(c, hex('#F8CFC8'), smooth(0.86, 0.97, marble) * 0.8);
    o.color = c;
    o.height = 0.5 + n * 0.1;
    o.rough = 0.42;
  },
};
