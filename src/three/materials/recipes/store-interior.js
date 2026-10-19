import { clamp01, fbm, hash2, hex, lerp, mix, ridged, smooth, worley } from '../../tex/noise.js';

// Store interior textures (keys prefixed `int`). Calm, painted surfaces: the
// products are the stars. v grows upwards on a plane (row 0 = bottom).
// Texture coverage (world units) is set by the uv scale in the interior helpers:
//   intFloorTile 4 · intWallTile 6 · intTileRed 4 · intTileMustard 4 · intWood 4
//   intSteel 4 · intPlaster 6 · intBrick: 4 bricks around the dome

const fract = x => x - Math.floor(x);
const edge = (lu, lv) => Math.min(lu, 1 - lu, lv, 1 - lv);

// ───────────────────────────── floor tiles ──────────────────────────────
export const intFloorTile = {
  width: 512,
  normal: 0.5,
  fn(u, v, o) {
    const n = 2; // tiles per texture side
    const cx = Math.floor(u * n);
    const cy = Math.floor(v * n);
    const lu = fract(u * n);
    const lv = fract(v * n);
    const dark = (cx + cy) % 2 === 0;
    const tint = hash2(cx, cy, 5);
    const e = edge(lu, lv);
    const grout = smooth(0.032, 0.014, e);
    let c = dark ? mix(hex('#E7BE8E'), hex('#DDA876'), tint) : mix(hex('#F7EBD3'), hex('#F0DEC0'), tint);
    c = mix(c, hex('#FFF8E8'), smooth(0.4, 0.05, Math.hypot(lu - 0.45, lv - 0.55)) * 0.25);
    c = mix(c, hex('#B7845A'), smooth(0.1, 0.04, e) * 0.18);
    const dia = Math.abs(lu - 0.5) + Math.abs(lv - 0.5);
    if (dark) {
      c = mix(c, hex('#F6E3C2'), smooth(0.2, 0.185, dia) * smooth(0.14, 0.155, dia));
      c = mix(c, hex('#C9894F'), smooth(0.07, 0.055, dia) * 0.8);
    }
    c = mix(c, hex('#CBB99A'), grout);
    o.color = c;
    o.height = 0.55 - grout * 0.35 + smooth(0, 0.2, e) * 0.04;
    o.rough = lerp(0.38, 0.8, grout);
  },
};

// ───────────────────────────── wall tiles ───────────────────────────────
export const intWallTile = {
  width: 512,
  normal: 0.6,
  fn(u, v, o) {
    const cols = 2;
    const rows = 4;
    const row = Math.floor(v * rows);
    const cu = u * cols + (row % 2) * 0.5;
    const col = Math.floor(cu);
    const lu = fract(cu);
    const lv = fract(v * rows);
    const tint = hash2(col + (row % 2) * 7, row, 11);
    const du = Math.min(lu, 1 - lu) * 0.5; // tiles are 2:1
    const dv = Math.min(lv, 1 - lv);
    const e = Math.min(du, dv);
    const grout = smooth(0.03, 0.012, e);
    let c = mix(hex('#B5D6A6'), hex('#9EC892'), tint);
    c = mix(c, hex('#E5F4D8'), smooth(0.2, 0, Math.min(1 - lv, lu * 0.5)) * 0.5);
    c = mix(c, hex('#7FAF75'), smooth(0.14, 0, Math.min(lv, (1 - lu) * 0.5)) * 0.4);
    const streak = lu * 0.5 + lv * 0.6 - 0.3;
    c = mix(c, hex('#F4FFEA'), smooth(0.05, 0, Math.abs(streak - 0.12 * tint)) * 0.35 * smooth(0, 0.1, e));
    c = mix(c, hex('#F1E9D6'), grout);
    o.color = c;
    o.height = 0.6 - grout * 0.4 + smooth(0, 0.18, e) * 0.08;
    o.rough = lerp(0.22, 0.75, grout);
  },
};

// ─────────────────────── square mosaic tiles (counter, oven) ────────────
const squareTiles = ({ base, alt, accent, seed, n = 4 }) => ({
  width: 512,
  normal: 0.6,
  fn(u, v, o) {
    const cx = Math.floor(u * n);
    const cy = Math.floor(v * n);
    const lu = fract(u * n);
    const lv = fract(v * n);
    const t = hash2(cx, cy, seed);
    const e = edge(lu, lv);
    const grout = smooth(0.05, 0.022, e);
    let c = mix(hex(base), hex(alt), t);
    c = mix(c, hex(accent), (t > 0.93 ? 1 : 0) * 0.85);
    c = mix(c, hex('#FFFFFF'), smooth(0.45, 0, Math.hypot(lu - 0.35, lv - 0.68)) * 0.16);
    c = mix(c, hex('#000000'), smooth(0.14, 0, Math.min(lv, 1 - lu)) * 0.12);
    c = mix(c, hex('#F4EBDA'), grout);
    o.color = c;
    o.height = 0.6 - grout * 0.4 + smooth(0, 0.25, e) * 0.12;
    o.rough = lerp(0.2, 0.75, grout);
  },
});
export const intTileRed = squareTiles({ base: '#D7362B', alt: '#C22B22', accent: '#F2B233', seed: 21 });
export const intTileMustard = squareTiles({ base: '#F2B233', alt: '#E8A22A', accent: '#D7362B', seed: 23, n: 8 });

// ──────────────────────────────── wood ──────────────────────────────────
export const intWood = {
  width: 512,
  normal: 0.5,
  fn(u, v, o) {
    const planks = 4;
    const p = Math.floor(v * planks);
    const lv = fract(v * planks);
    const tone = hash2(p, 3, 31);
    const jointU = hash2(p, 4, 33);
    const du = Math.abs(u - jointU);
    const joint = smooth(0.006, 0.002, Math.min(du, 1 - du));
    const seam = smooth(0.035, 0.012, Math.min(lv, 1 - lv));
    const n = fbm(u, v, { scale: 3, scaleY: 12, octaves: 3, seed: 35 });
    const grain = 0.5 + 0.5 * Math.sin((lv * 9 + n * 2.6 + tone * 6) * Math.PI);
    const fine = ridged(u, v, { scale: 4, scaleY: 80, octaves: 2, seed: 37 });
    let c = mix(hex('#E3B070'), hex('#CC9556'), tone);
    c = mix(c, hex('#B97F42'), smooth(0.55, 0.95, grain) * 0.4);
    c = mix(c, hex('#F0C88A'), smooth(0.7, 0.98, fine) * 0.25);
    const k = worley(u, v, { scale: 4, scaleY: 8, seed: 39, jitter: 0.6 });
    if (k.id < 0.3) {
      const d = Math.hypot(k.dx * 0.5, k.dy * 1.0);
      c = mix(c, hex('#A8703A'), smooth(0.2, 0.12, d) * 0.7);
      c = mix(c, hex('#8F5C2C'), smooth(0.07, 0.04, d) * 0.7);
    }
    c = mix(c, hex('#8C5A2B'), Math.max(seam, joint) * 0.8);
    o.color = c;
    o.height = 0.55 + grain * 0.03 - Math.max(seam, joint) * 0.3;
    o.rough = 0.55;
  },
};

// ─────────────────────────────── brushed steel ──────────────────────────
export const intSteel = {
  width: 256,
  normal: 0.25,
  fn(u, v, o) {
    const streak = fbm(u, v, { scale: 2, scaleY: 96, octaves: 3, seed: 41 });
    const broad = fbm(u, v, { scale: 2, scaleY: 3, octaves: 2, seed: 43 });
    let c = mix(hex('#C9D1D6'), hex('#E7ECEF'), smooth(-0.6, 0.6, streak));
    c = mix(c, hex('#B3BDC4'), smooth(0.1, 0.8, broad) * 0.5);
    o.color = c;
    o.height = 0.5 + streak * 0.05;
    o.rough = lerp(0.28, 0.42, smooth(-0.5, 0.5, streak));
  },
};

// ────────────────────────────── wall plaster ────────────────────────────
export const intPlaster = {
  width: 256,
  normal: 0.25,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, octaves: 3, seed: 51 });
    const arcs = fbm(u, v, { scale: 6, octaves: 2, seed: 53 });
    let c = mix(hex('#F8E2C2'), hex('#F2D2A8'), smooth(-0.5, 0.6, n));
    c = mix(c, hex('#FFF0DA'), smooth(0.25, 0.7, arcs) * 0.35);
    o.color = c;
    o.height = 0.5 + n * 0.04;
    o.rough = 0.88;
  },
};

// ─────────────────────────────── clay bricks ────────────────────────────
export const intBrick = {
  width: 512,
  normal: 0.9,
  fn(u, v, o) {
    const cols = 4;
    const rows = 8;
    const row = Math.floor(v * rows);
    const cu = u * cols + (row % 2) * 0.5;
    const col = Math.floor(cu);
    const lu = fract(cu);
    const lv = fract(v * rows);
    const tint = hash2(((col % cols) + cols) % cols, row, 61);
    const du = Math.min(lu, 1 - lu) * 0.5;
    const dv = Math.min(lv, 1 - lv);
    const e = Math.min(du, dv);
    const mortar = smooth(0.045, 0.022, e);
    const n = fbm(u, v, { scale: 6, octaves: 3, seed: 63 });
    let c = mix(hex('#EDB074'), hex('#DF9356'), tint);
    c = mix(c, hex('#F8CE98'), smooth(0.2, 0, Math.min(1 - lv, lu * 0.5)) * 0.5);
    c = mix(c, hex('#C97442'), smooth(0.18, 0, lv) * 0.35 + smooth(-0.3, 0.7, n) * 0.12);
    const s = worley(u, v, { scale: 28, scaleY: 56, seed: 65 });
    if (s.id < 0.14) c = mix(c, hex('#8E4A28'), smooth(0.22, 0.1, s.f1) * 0.55);
    c = mix(c, hex('#F7EBD3'), mortar);
    o.color = c;
    o.height = 0.65 - mortar * 0.5 + smooth(0, 0.2, e) * 0.12 + n * 0.02;
    o.rough = lerp(0.62, 0.85, mortar);
  },
};

// ─────────────────────────── oven fire (emissive) ───────────────────────
export const intFire = {
  width: 256,
  normal: 0.1,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const across = Math.abs(u - 0.5) * 2;
    let c = mix(hex('#4A1A0A'), hex('#A8380F'), smooth(0.9, 0.0, v) * 0.9);
    const tongue = (k, ph, amp) => {
      const s = Math.sin(u * k * Math.PI * 2 + ph);
      return amp * (0.6 + 0.4 * (1 - Math.abs(s))) * smooth(1.05, 0.2, across);
    };
    const layers = [
      { h: tongue(3, 0.4, 0.82), col: '#F0521A' },
      { h: tongue(4, 1.9, 0.62), col: '#FF8A1F' },
      { h: tongue(5, 3.3, 0.45), col: '#FFC53A' },
      { h: tongue(6, 5.1, 0.26), col: '#FFF0A8' },
    ];
    for (const l of layers) c = mix(c, hex(l.col), smooth(l.h + 0.04, l.h - 0.04, v) * 0.97);
    c = mix(c, hex('#FFB347'), smooth(0.14, 0.02, v) * 0.7);
    o.color = c;
    o.height = 0.5;
    o.rough = 0.8;
  },
};

// ───────────────────────── infrared heater (emissive) ───────────────────
export const intHeater = {
  width: 256,
  normal: 0.1,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const rows = 9;
    const r = fract(v * rows);
    const rod = smooth(0.34, 0.2, Math.abs(r - 0.5));
    const hot = smooth(0.14, 0.0, Math.abs(r - 0.5));
    const pulse = 0.85 + 0.15 * Math.sin(u * 20 + Math.floor(v * rows) * 2.1);
    let c = mix(hex('#2C2724'), hex('#FF6A1A'), rod * pulse);
    c = mix(c, hex('#FFC46A'), hot * 0.9);
    const frame = smooth(0.05, 0.03, Math.min(u, 1 - u, v, 1 - v));
    c = mix(hex('#5B534E'), c, frame);
    const bracket = smooth(0.012, 0.006, Math.abs(u - 0.5)) + smooth(0.012, 0.006, Math.abs(u - 0.2)) * 0.6 + smooth(0.012, 0.006, Math.abs(u - 0.8)) * 0.6;
    c = mix(c, hex('#3A3430'), clamp01(bracket) * 0.8);
    o.color = c;
    o.height = 0.5;
    o.rough = 0.5;
  },
};

// ───────────────────────────── döner spit meat ──────────────────────────
export const intSpitMeat = {
  width: 512,
  normal: 0.9,
  wrapV: false,
  fn(u, v, o) {
    // v: bottom → top. Stacked meat discs with darker seams and a roasted rim.
    const bands = 16;
    const b = Math.floor(v * bands);
    const lv = fract(v * bands);
    const tone = hash2(b, 2, 71);
    const n = fbm(u, v, { scale: 4, scaleY: 6, octaves: 3, seed: 73 });
    const fibres = ridged(u, v, { scale: 24, scaleY: 3, octaves: 2, seed: 75 });
    const seam = smooth(0.14, 0.04, Math.min(lv, 1 - lv));
    let c = mix(hex('#D98F55'), hex('#BF6E3A'), tone);
    c = mix(c, hex('#F0B27C'), smooth(0.55, 0.95, fibres) * 0.45);
    c = mix(c, hex('#E8A56C'), smooth(-0.3, 0.6, n) * 0.3);
    const f = worley(u, v, { scale: 16, scaleY: 40, seed: 77 });
    if (f.id < 0.4) c = mix(c, hex('#FFE0B8'), smooth(0.3, 0.14, f.f1) * 0.7);
    const crust = smooth(0.62, 0.98, v + n * 0.12);
    c = mix(c, hex('#7E3D1B'), crust * 0.7);
    c = mix(c, hex('#9A5026'), seam * 0.9);
    o.color = c;
    o.height = 0.5 + fibres * 0.05 - seam * 0.25;
    o.rough = lerp(0.35, 0.5, seam);
  },
};
