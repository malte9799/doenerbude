import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Small building blocks for the room: soft boxes with world-scaled UVs, so a
// tile or plank texture keeps the same size on every piece of furniture.

const cache = new Map();
export const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

// Box-projected UVs from the local position; `scale` = texture repeats per unit.
export function boxUV(g, scale) {
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    let u;
    let v;
    if (ny >= nx && ny >= nz) {
      u = pos.getX(i);
      v = pos.getZ(i);
    } else if (nx >= nz) {
      u = pos.getZ(i);
      v = pos.getY(i);
    } else {
      u = pos.getX(i);
      v = pos.getY(i);
    }
    uv[i * 2] = u * scale;
    uv[i * 2 + 1] = v * scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

// Rounded box, w × h × d, bevel r. Textured pieces pass `uv` (repeats / unit).
export const rbox = (w, h, d, r = 0.2, uv = 0.25, seg = 4) =>
  memo(`rb${w}|${h}|${d}|${r}|${uv}|${seg}`, () => boxUV(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), uv));

// Plane in the XY plane (faces +Z) with UVs scaled to world units.
export const wallPlane = (w, h, uv) =>
  memo(`wp${w}|${h}|${uv}`, () => {
    const g = new THREE.PlaneGeometry(w, h);
    const t = g.attributes.uv;
    for (let i = 0; i < t.count; i++) t.setXY(i, t.getX(i) * w * uv, t.getY(i) * h * uv);
    return g;
  });

// Cylinder with soft top/bottom edge via a lathe profile.
export const softCylinder = (r, h, bevel = 0.2, seg = 40) =>
  memo(`sc${r}|${h}|${bevel}|${seg}`, () => {
    const b = Math.min(bevel, r * 0.9, h / 2);
    const pts = [new THREE.Vector2(0, 0)];
    const arc = 5;
    for (let i = 0; i <= arc; i++) {
      const a = (i / arc) * (Math.PI / 2);
      pts.push(new THREE.Vector2(r - b + Math.sin(a) * b, b - Math.cos(a) * b));
    }
    for (let i = 0; i <= arc; i++) {
      const a = (i / arc) * (Math.PI / 2);
      pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, h - b + Math.sin(a) * b));
    }
    pts.push(new THREE.Vector2(0, h));
    const g = new THREE.LatheGeometry(pts, seg);
    return g;
  });
