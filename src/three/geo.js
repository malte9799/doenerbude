import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { rng } from './tex/noise.js';

// Geometry helpers shared by all models. Everything is soft: bevels on every
// edge, enough segments for a smooth silhouette (style bible §6).

// Organic closed outline: a superellipse (p ≈ 2 circle, p > 2 rounder box)
// with low-frequency wobble.
export function blobShape({ w = 1, h = 1, p = 2, wobble = 0.06, seed = 1, points = 48, part = 1 } = {}) {
  const r = rng(seed);
  const phases = [r() * 6.28, r() * 6.28, r() * 6.28];
  const pts = [];
  // part < 1 keeps only an arc (e.g. 0.5 = half moon) and closes it straight.
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2 * part;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const k = Math.pow(Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p), -1 / p);
    const wob = 1 + wobble * (Math.sin(2 * a + phases[0]) * 0.6 + Math.sin(3 * a + phases[1]) * 0.3 + Math.sin(5 * a + phases[2]) * 0.1);
    pts.push(new THREE.Vector2((c * k * w * wob) / 2, (s * k * h * wob) / 2));
  }
  if (part >= 1) pts.pop();
  const shape = new THREE.Shape();
  shape.setFromPoints(pts);
  shape.closePath();
  return shape;
}

// Flat slab from an outline, lying in XZ with thickness along +Y, rounded
// edges, centred at y = 0. `uvScale` maps world XZ → texture (disc textures
// use 1 / diameter so the slice fills the texture).
export function slab(shape, { thickness = 0.05, bevel = 0.02, bevelSegments = 4, curveSegments = 48, tessellate = 0, uvScale = 0.5, uvCenter = [0, 0] } = {}) {
  let g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.0001, thickness - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments,
    curveSegments,
  });
  g.translate(0, 0, -(thickness - bevel * 2) / 2);
  g.rotateX(-Math.PI / 2);
  if (tessellate > 0) {
    g = g.index ? g.toNonIndexed() : g;
    g.deleteAttribute('normal');
    g = new TessellateModifier(tessellate, 8).modify(g);
  }
  planarUV(g, uvScale, uvCenter);
  return g;
}

// Projects UVs from world XZ (top view). v grows towards -Z so textures read
// the right way up from the front. `scale` is a number or [scaleX, scaleZ].
export function planarUV(g, scale = 0.5, [cx, cz] = [0, 0]) {
  const [sx, sz] = Array.isArray(scale) ? scale : [scale, scale];
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - cx) * sx + 0.5;
    uv[i * 2 + 1] = -(pos.getZ(i) - cz) * sz + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

// Moves every vertex by fn(position) and rebuilds smooth normals.
export function deform(g, fn) {
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    fn(v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  return smoothNormals(g);
}

export function smoothNormals(g) {
  if (g.attributes.normal) g.deleteAttribute('normal');
  const merged = mergeVertices(g, 1e-4);
  merged.computeVertexNormals();
  return merged;
}

// Splits a geometry into two material groups by face direction: faces whose
// normal points along `dir` (dot > threshold) go to group 1, the rest to 0.
export function splitByNormal(g, dir, threshold = 0.6) {
  const src = g.index ? g.toNonIndexed() : g.clone();
  const pos = src.attributes.position;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  const groups = [[], []];
  for (let t = 0; t < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t);
    b.fromBufferAttribute(pos, t + 1);
    c.fromBufferAttribute(pos, t + 2);
    n.subVectors(c, b).cross(a.sub(b)).normalize();
    groups[n.dot(dir) > threshold ? 1 : 0].push(t);
  }
  const order = [...groups[0], ...groups[1]];
  const out = new THREE.BufferGeometry();
  for (const name of Object.keys(src.attributes)) {
    const attr = src.attributes[name];
    const size = attr.itemSize;
    const arr = new attr.array.constructor(order.length * 3 * size);
    order.forEach((t, k) => {
      for (let j = 0; j < 3 * size; j++) arr[k * 3 * size + j] = attr.array[t * size + j];
    });
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  out.addGroup(0, groups[0].length * 3, 0);
  out.addGroup(groups[0].length * 3, groups[1].length * 3, 1);
  if (!out.attributes.normal) out.computeVertexNormals();
  return out;
}

// Ribbon along a curve (shreds, drizzles): a tube flattened to `flat`.
export function ribbon(points, { radius = 0.02, flat = 1, segments = 32, radial = 8 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const g = new THREE.TubeGeometry(curve, segments, radius, radial, false);
  if (flat !== 1) g.scale(1, flat, 1);
  return g;
}

export const merge = geos => mergeGeometries(geos, false);
export { rng };

// Natural variation for hand-placed slots: deterministic (seeded) offsets in
// position, spin, tilt and size, plus a geometry variant index `v` (0..3).
// Keeps layouts readable while nothing sits on a perfect grid or ring.
export function jitter(items, seed, { pos = 0.05, y = 0, rot = 0.3, tilt = 0.06, scale = 0.1 } = {}) {
  const r = rng(seed);
  const d = amount => (r() - 0.5) * 2 * amount;
  return items.map(it => ({
    ...it,
    p: [it.p[0] + d(pos), it.p[1] + d(y), it.p[2] + d(pos)],
    r: [(it.r?.[0] ?? 0) + d(tilt), (it.r?.[1] ?? 0) + d(rot), (it.r?.[2] ?? 0) + d(tilt)],
    s: (it.s ?? 1) * (1 + d(scale)),
    v: Math.floor(r() * 4),
  }));
}
