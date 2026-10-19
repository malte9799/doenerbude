import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { deform, rng } from '../../geo.js';

// Small geometry helpers of the exterior. Everything is rounded; nothing is
// cached across different parameters, so callers use `memo` with a key.

const cache = {};
export const memo = (key, make) => (cache[key] ??= make());

export const rbox = (w, h, d, r = 0.3, seg = 4) => memo(`rbox${w}_${h}_${d}_${r}_${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));

// Rounded rectangle path with its lower-left at (x, y). Corner radii r.
export function rrectPath(path, x, y, w, h, r) {
  const x1 = x + w;
  const y1 = y + h;
  path.moveTo(x + r, y);
  path.lineTo(x1 - r, y);
  path.absarc(x1 - r, y + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x1, y1 - r);
  path.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  path.lineTo(x + r, y1);
  path.absarc(x + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r);
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return path;
}

export const rrectShape = (x, y, w, h, r) => rrectPath(new THREE.Shape(), x, y, w, h, r);

// Extrudes a shape so that its front face lies at z = zFront and it runs back
// `depth` units (bevel included).
export function extrude(shape, { depth = 1, bevel = 0.2, segments = 3, zFront = 0, curve = 12 } = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, depth - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segments, curveSegments: curve });
  g.translate(0, 0, zFront - depth + bevel);
  return g;
}

// Frame ring around a rounded opening (x0,y0,w,h): outer grown by `grow`.
export function ringFrame({ x, y, w, h, r = 1.2, grow = 1, depth = 1.2, bevel = 0.3, zFront = depth }) {
  const outer = rrectShape(x - grow, y - grow, w + grow * 2, h + grow * 2, r + grow);
  outer.holes.push(rrectPath(new THREE.Path(), x, y, w, h, r));
  return extrude(outer, { depth, bevel, zFront });
}

// Rounded disc / puck lying on y = 0 (axis +Y), radius r, height h, rim b.
export function puck(r, h, b = 0.2, seg = 40) {
  const pts = [new THREE.Vector2(0.0001, 0)];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - b + Math.sin(a) * b, b - Math.cos(a) * b));
  }
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, h - b + Math.sin(a) * b));
  }
  pts.push(new THREE.Vector2(0.0001, h));
  return new THREE.LatheGeometry(pts, seg);
}

// Lumpy blob (foliage, bushes): an icosphere pushed around by seeded noise.
export function blob(radius, seed, { lump = 0.14, squash = 1, detail = 3 } = {}) {
  const r = rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6];
  const g = new THREE.IcosahedronGeometry(radius, detail);
  return deform(g, v => {
    const k = 1 + lump * (Math.sin(v.x * 2.1 / radius + ph[0]) * Math.sin(v.y * 1.9 / radius + ph[1]) + Math.sin(v.z * 2.7 / radius + ph[2]) * 0.6);
    v.multiplyScalar(k);
    v.y *= squash;
  });
}
