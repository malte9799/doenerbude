import { clamp01, fbm, hex, lerp, mix, ridged, smooth, worley } from '../../tex/noise.js';
import { brand } from '../../../brand/brand.js';

// Recipes of the shop exterior (keys prefixed `ext`). Painted look: clear
// shapes and soft colour patches, no photographic grain.

const C = brand.colors;
const lighten = (c, t) => mix(c, [1, 1, 1], t);
const darken = (c, t) => mix(c, [0, 0, 0], t);

// Rounded-rectangle distance field (negative inside).
const rrect = (x, y, hw, hh, r) => {
  const qx = Math.abs(x) - (hw - r);
  const qy = Math.abs(y) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};

// Warm hand-painted stucco: big soft patches plus a few darker blotches.
export const extPlaster = {
  width: 512,
  normal: 0.35,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, octaves: 3, seed: 301 });
    const m = fbm(u, v, { scale: 6, scaleY: 3, octaves: 2, seed: 307 });
    let c = mix(hex('#F6E7CF'), hex('#EAD0AA'), smooth(-0.5, 0.6, n));
    c = mix(c, hex('#FFF6E4'), smooth(0.2, 0.7, m) * 0.5);
    const d = worley(u, v, { scale: 9, seed: 311 });
    const spot = d.id < 0.25 ? smooth(0.2, 0.0, d.f1) : 0;
    c = mix(c, hex('#DDB985'), spot * 0.35);
    o.color = c;
    o.height = 0.5 + n * 0.05 + spot * 0.05;
    o.rough = 0.85;
  },
};

// Chunky subway tiles in brand green: soft bevel, light top-left edge.
export const extTiles = {
  width: 512,
  normal: 0.9,
  fn(u, v, o) {
    const cols = 4;
    const rows = 8;
    const row = Math.floor(v * rows);
    const x = u * cols + (row % 2) * 0.5;
    const cx = Math.floor(x);
    const fx = x - cx - 0.5;
    const fy = v * rows - row - 0.5;
    const d = rrect(fx, fy * 0.5, 0.48, 0.24, 0.1) * 2;
    const id = fbm(((cx + 8) % cols) / cols + 0.01, row / rows + 0.01, { scale: 4, octaves: 1, seed: 321 });
    const base = mix(darken(hex(C.herb), 0.38), lighten(hex(C.herb), 0.05), smooth(-0.6, 0.6, id + fx * 0.15 - fy * 0.1));
    const inside = smooth(0.02, -0.05, d);
    const edge = smooth(-0.22, -0.02, d);
    let c = mix(hex('#2D3A2A'), base, inside);
    c = mix(c, lighten(base, 0.3), edge * 0.55 * smooth(0.3, -0.3, fx + fy * 2));
    c = mix(c, lighten(base, 0.35), inside * smooth(0.12, 0.0, Math.abs(fx - fy * 0.5 + 0.1)) * 0.25);
    o.color = c;
    o.height = 0.2 + inside * 0.8 * (0.6 + 0.4 * (1 - edge));
    o.rough = lerp(0.9, 0.2, inside);
  },
};

// Pavement slabs: light warm grey, grout, a few painted cracks.
export const extPaving = {
  width: 512,
  normal: 0.8,
  fn(u, v, o) {
    const n = 2;
    const x = u * n;
    const y = v * n;
    const fx = x - Math.floor(x) - 0.5;
    const fy = y - Math.floor(y) - 0.5;
    const d = rrect(fx, fy, 0.47, 0.47, 0.05);
    const inside = smooth(0.0, -0.025, d);
    const id = worley(u, v, { scale: 2, seed: 331 }).id;
    const patch = fbm(u, v, { scale: 4, octaves: 3, seed: 333 });
    let c = mix(hex('#C9C1B6'), hex('#B7AEA2'), clamp01(id + patch * 0.3));
    c = mix(c, hex('#DAD3C8'), smooth(0.1, 0.7, fbm(u, v, { scale: 8, octaves: 2, seed: 337 })) * 0.4);
    const crack = smooth(0.03, 0.0, Math.abs(ridged(u, v, { scale: 3, octaves: 2, seed: 339 }) - 0.97));
    c = mix(c, hex('#8C847A'), crack * 0.6 * inside);
    c = mix(hex('#6F685F'), c, inside);
    o.color = c;
    o.height = 0.2 + inside * 0.8 - crack * 0.05;
    o.rough = 0.8;
  },
};

// Street: blue-grey asphalt with clear light pebbles.
export const extAsphalt = {
  width: 512,
  normal: 0.5,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 341 });
    let c = mix(hex('#4A4E58'), hex('#3A3E47'), smooth(-0.5, 0.6, n));
    const p = worley(u, v, { scale: 40, seed: 343 });
    let h = 0.5 + n * 0.04;
    if (p.id < 0.22) {
      const k = smooth(0.2, 0.08, p.f1);
      c = mix(c, hex('#9C9A98'), k * 0.55);
      h += k * 0.2;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.85;
  },
};

// Pedestal: dark terrazzo with big painted chips in brand colours.
export const extStone = {
  width: 512,
  normal: 0.5,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 2, seed: 351 });
    let c = mix(hex('#34302D'), hex('#403A36'), smooth(-0.5, 0.5, n));
    let h = 0.5;
    const w = worley(u, v, { scale: 10, seed: 353, jitter: 0.8 });
    if (w.id < 0.11) {
      const k = smooth(0.3, 0.2, w.f1 * (0.7 + w.id));
      const chip = w.id < 0.03 ? hex(C.mustard) : w.id < 0.06 ? hex(C.paper) : hex(C.red);
      c = mix(c, darken(chip, 0.12), k);
      h += k * 0.1;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.55;
  },
};

// Awning: wide brand stripes (u: one repeat = one red + one paper stripe)
// with slightly wavy edges and a soft canvas weave.
export const extAwning = {
  width: 512,
  height: 128,
  normal: 0.4,
  fn(u, v, o) {
    const wob = fbm(u, v, { scale: 4, scaleY: 2, octaves: 1, seed: 361 }) * 0.012;
    const s = (((u + wob) % 1) + 1) % 1;
    const red = s < 0.5;
    const edge = Math.min(Math.abs(s - 0.5), Math.min(s, 1 - s));
    let c = red ? hex(C.red) : hex(C.paper);
    c = mix(c, darken(c, red ? 0.12 : 0.07), smooth(-0.5, 0.6, fbm(u, v, { scale: 4, scaleY: 2, octaves: 2, seed: 363 })) * 0.7);
    const weave = Math.sin(u * 512 * 1.2) * Math.sin(v * 128 * 1.2) * 0.01;
    c = mix(c, red ? darken(hex(C.red), 0.25) : darken(hex(C.paper), 0.14), smooth(0.015, 0.0, edge) * 0.5);
    o.color = [c[0] + weave, c[1] + weave, c[2] + weave];
    o.height = 0.5 + weave * 4;
    o.rough = 0.8;
  },
};

// Painted wood planks (table top, bench): warm honey with clear grain strokes.
export const extWood = {
  width: 512,
  normal: 0.6,
  fn(u, v, o) {
    const planks = 4;
    const p = Math.floor(v * planks);
    const f = v * planks - p;
    const tone = fbm(p / planks + 0.03, 0.3, { scale: 4, octaves: 1, seed: 371 });
    let c = mix(hex('#E1A862'), hex('#C98643'), smooth(-0.6, 0.6, tone));
    const grain = ridged(u, v, { scale: 3, scaleY: 24, octaves: 3, seed: 373 });
    c = mix(c, hex('#A96A30'), smooth(0.85, 0.99, grain) * 0.6);
    const gap = smooth(0.04, 0.0, Math.min(f, 1 - f));
    c = mix(c, hex('#6A4020'), gap * 0.8);
    o.color = c;
    o.height = 0.5 - gap * 0.4 + grain * 0.03;
    o.rough = 0.55;
  },
};

// Blackboard of the menu stand: dusty slate, hand-drawn frame and rows of
// chalk squiggles (no text, so nothing language-specific is baked in).
export const extChalk = {
  width: 512,
  height: 512,
  normal: 0.3,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 381 });
    let c = mix(hex('#2B3430'), hex('#364039'), smooth(-0.6, 0.6, n));
    c = mix(c, hex('#6E7A73'), smooth(0.35, 0.8, fbm(u, v, { scale: 6, octaves: 2, seed: 383 })) * 0.22);
    let chalk = 0;
    const wob = Math.sin(u * 30 + v * 10) * 0.004;
    const fe = Math.min(u, 1 - u, v, 1 - v) + wob;
    chalk = Math.max(chalk, smooth(0.012, 0.006, Math.abs(fe - 0.06)));
    chalk = Math.max(chalk, smooth(0.02, 0.012, Math.abs(v - 0.2 - wob)) * (u > 0.15 && u < 0.85 ? 1 : 0));
    for (let i = 0; i < 4; i++) {
      const y = 0.34 + i * 0.13;
      const len = [0.55, 0.4, 0.5, 0.32][i];
      const yy = y + Math.sin(u * (46 + i * 7) + i) * 0.014;
      const dash = Math.sin(u * 90 + i * 3) > -0.1 ? 1 : 0;
      chalk = Math.max(chalk, smooth(0.012, 0.005, Math.abs(v - yy)) * (u > 0.14 && u < 0.14 + len ? 1 : 0) * dash);
      chalk = Math.max(chalk, smooth(0.04, 0.025, Math.hypot((u - 0.78) * 1.4, v - y)) * 0.8);
    }
    chalk = Math.max(chalk, smooth(0.012, 0.006, Math.abs(Math.hypot(u - 0.5, v - 0.13) - 0.055)));
    const dust = 0.75 + 0.25 * fbm(u, v, { scale: 16, octaves: 2, seed: 387 });
    c = mix(c, mix(hex('#F6F2E8'), hex(C.mustard), v < 0.25 ? 0.6 : 0), chalk * dust);
    o.color = c;
    o.height = 0.5 + chalk * 0.04;
    o.rough = lerp(0.9, 0.7, chalk);
  },
};

// Warm shop interior as seen through the window: gradient, ceiling lamp
// glow, shelf bands, hanging lamp blobs. Used unlit (emissive).
export const extWindowGlow = {
  width: 512,
  height: 512,
  normal: 0,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, octaves: 2, seed: 391 });
    let c = mix(hex('#FFD07A'), hex('#FF9A4A'), smooth(0.0, 1.0, v));
    c = mix(c, hex('#FFEBB8'), smooth(0.6, 0.0, Math.hypot((u - 0.5) * 0.8, v - 0.2)) * 0.7);
    c = mix(c, hex('#E6823A'), smooth(0.02, 0.0, Math.abs(v - 0.62)) * 0.5 + smooth(0.02, 0.0, Math.abs(v - 0.42)) * 0.4);
    for (const lx of [0.2, 0.5, 0.8]) {
      c = mix(c, hex('#FFFBE8'), smooth(0.09, 0.03, Math.hypot(u - lx, (v - 0.34) * 1.1)));
    }
    c = mix(c, hex('#D9742C'), smooth(0.7, 1.0, v) * 0.35 + n * 0.04);
    o.color = c;
    o.height = 0.5;
    o.rough = 1;
  },
};

// Soft radial falloff for additive light pools and blob shadows.
export const extSoft = {
  width: 128,
  normal: 0,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const k = smooth(1, 0, Math.hypot(u - 0.5, v - 0.5) * 2);
    o.color = [k, k, k];
    o.alpha = k;
    o.height = 0.5;
    o.rough = 1;
  },
};
