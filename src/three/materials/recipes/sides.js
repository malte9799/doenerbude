import { clamp01, fbm, hex, lerp, mix, ridged, smooth, worley } from '../../tex/noise.js';

// Sides, sauces, dessert. Painted Fluent style: clear readable shapes
// (salt, seeds, pistachio, flecks), no photographic grain.

const ellipseE = (w, a, b, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = w.dx * c + w.dy * s;
  const y = -w.dx * s + w.dy * c;
  return (x / a) ** 2 + (y / b) ** 2;
};
const dome = e => (e < 1 ? Math.sqrt(1 - e) : 0);
const ink = (e, soft = 0.12) => smooth(1, 1 - soft, e);

// Fries: box faces, v along the stick. Golden, soft brown blisters, a paler
// streak and a few darker crisp spots.
export const sdFry = {
  width: 256,
  normal: 0.5,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 3, scaleY: 6, octaves: 3, seed: 301 });
    let c = mix(hex('#FFD45E'), hex('#F2A93A'), smooth(-0.5, 0.6, n));
    const streak = smooth(0.35, 0.8, fbm(u, v, { scale: 2, scaleY: 9, octaves: 2, seed: 303 }));
    c = mix(c, hex('#FFE69A'), streak * 0.5);
    const w = worley(u, v, { scale: 5, scaleY: 12, seed: 305, jitter: 0.8 });
    let h = 0.5 + n * 0.04;
    if (w.id < 0.3) {
      const e = ellipseE(w, 0.3, 0.2, w.id * 20);
      const k = ink(e, 0.4);
      c = mix(c, hex('#C9731F'), k * 0.8);
      h -= k * 0.05;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.5;
  },
};

// Börek pastry on a tube: u along the length, v around. Flaky golden skin
// with blisters, sesame and a few nigella seeds.
export const sdPastry = {
  width: 2048,
  height: 512,
  normal: 0.8,
  wrapV: true,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 10, scaleY: 3, octaves: 3, seed: 311 });
    const flake = ridged(u, v, { scale: 30, scaleY: 8, octaves: 2, seed: 313 });
    let c = mix(hex('#F9C870'), hex('#E39A45'), smooth(-0.5, 0.6, n));
    c = mix(c, hex('#FFE0A0'), smooth(0.8, 0.95, flake) * 0.35);
    const top = smooth(0.15, 0.5, 0.5 + 0.5 * Math.cos(v * Math.PI * 2));
    const browning = smooth(-0.1, 0.6, n) * top;
    c = mix(c, hex('#C06A28'), browning * 0.5);
    let h = 0.5 + n * 0.05 + flake * 0.03;
    let r = 0.5;
    const s = worley(u, v, { scale: 90, scaleY: 18, seed: 317, jitter: 0.75 });
    if (s.id < 0.55 * top + 0.05) {
      const dark = s.id < 0.1;
      const e = ellipseE(s, dark ? 0.2 : 0.3, dark ? 0.13 : 0.16, s.id * 40);
      const k = ink(e);
      if (k > 0) {
        c = mix(c, dark ? hex('#2A2420') : mix(hex('#F6E2B4'), hex('#FFF7E2'), clamp01(0.6 - s.dy * 2)), k);
        h += dome(e) * 0.4;
        r = lerp(r, 0.3, k);
      }
    }
    o.color = c;
    o.height = h;
    o.rough = r;
  },
};

// Börek cross-section (disc uv): spiral of thin layers around a soft white
// cheese filling with herb flecks, golden rind.
export const sdPastryCut = {
  width: 512,
  normal: 0.7,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 321 });
    const rind = smooth(0.82, 0.9, r);
    const spiral = 0.5 + 0.5 * Math.sin((r * 9 - a / (Math.PI * 2)) * Math.PI * 2);
    let c = mix(hex('#F6C56A'), hex('#FFE6A8'), smooth(0.3, 0.8, spiral));
    c = mix(c, hex('#E0963F'), rind);
    const fill = smooth(0.66, 0.58, r + n * 0.08);
    let fillC = mix(hex('#FFFDF6'), hex('#F0E8D4'), smooth(0.2, 0.7, worley(u, v, { scale: 7, seed: 323 }).f1));
    const w = worley(u, v, { scale: 16, seed: 325, jitter: 0.8 });
    if (w.id < 0.18) fillC = mix(fillC, hex('#5FA03A'), ink(ellipseE(w, 0.25, 0.14, w.id * 30)));
    c = mix(c, fillC, fill);
    o.color = c;
    o.height = 0.5 + spiral * 0.03 - fill * 0.02;
    o.rough = lerp(0.5, 0.6, fill);
  },
};

// Baklava side (v vertical): thin pastry layers with syrup between and a
// pistachio band.
export const sdBaklavaSide = {
  width: 256,
  height: 256,
  normal: 0.8,
  wrapV: false,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, scaleY: 2, octaves: 2, seed: 331 });
    const layers = 11;
    const t = (v * layers + n * 0.35) % 1;
    const gap = smooth(0.78, 0.9, t);
    let c = mix(hex('#F5C45C'), hex('#E9A93E'), smooth(0, 0.8, t));
    c = mix(c, hex('#B8661F'), gap * 0.75);
    const band = smooth(0.34, 0.4, v) * smooth(0.64, 0.58, v);
    const w = worley(u, v, { scale: 14, scaleY: 8, seed: 333, jitter: 0.8 });
    if (band > 0.5 && w.id < 0.7) c = mix(c, mix(hex('#8DC24F'), hex('#B6DC6E'), w.id), ink(ellipseE(w, 0.3, 0.2, w.id * 9), 0.3) * band);
    o.color = c;
    o.height = 0.5 - gap * 0.3;
    o.rough = 0.35;
  },
};

// Baklava top (planar): glossy syrup-soaked golden pastry with a scored
// diamond grid.
export const sdBaklavaTop = {
  width: 512,
  normal: 0.6,
  wrapU: false,
  wrapV: false,
  fn(u, v, o) {
    const x = u - 0.5;
    const y = v - 0.5;
    const n = fbm(u, v, { scale: 4, octaves: 3, seed: 341 });
    let c = mix(hex('#F7B73D'), hex('#D98424'), smooth(-0.5, 0.6, n) * 0.6 + Math.hypot(x, y) * 0.4);
    const sheen = smooth(0.4, 0.9, fbm(u, v, { scale: 3, octaves: 2, seed: 343 }));
    c = mix(c, hex('#FFD36E'), sheen * 0.4);
    const grid = Math.abs(Math.sin((x + y) * Math.PI * 4.5)) * Math.abs(Math.sin((x - y) * Math.PI * 4.5));
    const score = smooth(0.12, 0.02, grid);
    c = mix(c, hex('#B3601A'), score * 0.5);
    o.color = c;
    o.height = 0.5 - score * 0.1;
    o.rough = 0.25;
  },
};

// Sauce domes on a lathe (u around, v from the centre outwards).
const flecks = (base, spot, seed, density, big) => ({
  width: 512,
  normal: 0.3,
  fn(u, v, o) {
    const n = fbm(u, v, { scale: 4, scaleY: 2, octaves: 3, seed });
    let c = mix(hex(base[0]), hex(base[1]), smooth(-0.5, 0.6, n));
    const w = worley(u, v, { scale: 22, scaleY: 7, seed: seed + 3, jitter: 0.9 });
    let h = 0.5 + n * 0.03;
    if (w.id < density) {
      const e = ellipseE(w, big, big * 0.55, w.id * 40);
      const k = ink(e);
      c = mix(c, mix(hex(spot[0]), hex(spot[1]), w.id / density), k);
      h += dome(e) * 0.08 * k;
    }
    o.color = c;
    o.height = h;
    o.rough = 0.2;
  },
});
export const sdSauceHerb = flecks(['#FFFDF4', '#F4EFDC'], ['#4F9A33', '#79BC4A'], 351, 0.3, 0.3);
export const sdSauceHot = flecks(['#D22A1B', '#B71E14'], ['#FFB02E', '#8E1209'], 361, 0.28, 0.22);
export const sdSauceGarlic = flecks(['#FFFDF6', '#F6F0E0'], ['#E8DEBE', '#FFFFFF'], 371, 0.08, 0.2);
export const sdSauceCocktail = flecks(['#FF9E9A', '#F27B7B'], ['#FFD2C8', '#D95560'], 381, 0.12, 0.2);
