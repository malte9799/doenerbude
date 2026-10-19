import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Lathe with a rounded-rectangle (superellipse) cross-section: used for the
// paper wrap (p = 2, round), the box and the plate. A profile is a list of
// [scale, y] points; the cross-section is scaled by `scale` at every point.
// Profile direction decides the face side: walk bottom → up on the outside,
// over the rim, then down the inside (normal = (dy, -dr)).

// Corner rounding for a polyline: each inner vertex becomes a quadratic arc.
export function rounded(pts, radius, steps = 5) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [p0, p1, p2] = [pts[i - 1], pts[i], pts[i + 1]];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const r = Math.min(radius, l1 * 0.5, l2 * 0.5);
    const a = [p1[0] + ((p0[0] - p1[0]) / l1) * r, p1[1] + ((p0[1] - p1[1]) / l1) * r];
    const b = [p1[0] + ((p2[0] - p1[0]) / l2) * r, p1[1] + ((p2[1] - p1[1]) / l2) * r];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      out.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * p1[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * p1[1] + t * t * b[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function ring({ pts, a, b, p, segs, uRepeat, vRepeat }) {
  const cols = segs + 1;
  const pos = new Float32Array(pts.length * cols * 3);
  const uv = new Float32Array(pts.length * cols * 2);
  let len = 0;
  const lens = pts.map((q, i) => (len += i ? Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0));
  pts.forEach(([s, y], i) => {
    for (let j = 0; j < cols; j++) {
      const phi = (j / segs) * Math.PI * 2;
      const c = Math.cos(phi);
      const sn = Math.sin(phi);
      const k = Math.pow(Math.pow(Math.abs(c), p) + Math.pow(Math.abs(sn), p), -1 / p);
      const n = i * cols + j;
      pos.set([a * sn * k * s, y, b * c * k * s], n * 3);
      uv.set([(j / segs) * uRepeat, (lens[i] / len) * vRepeat], n * 2);
    }
  });
  const index = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const q0 = i * cols + j;
      const q1 = (i + 1) * cols + j;
      const q2 = (i + 1) * cols + j + 1;
      const q3 = i * cols + j + 1;
      index.push(q0, q3, q1, q2, q1, q3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

// Smooth normals, with the seam (first and last column) averaged.
export function seamNormals(g, cols) {
  g.computeVertexNormals();
  const n = g.attributes.normal;
  const rows = n.count / cols;
  const v = new THREE.Vector3();
  for (let i = 0; i < rows; i++) {
    const f = i * cols;
    const l = i * cols + cols - 1;
    v.set(n.getX(f) + n.getX(l), n.getY(f) + n.getY(l), n.getZ(f) + n.getZ(l)).normalize();
    n.setXYZ(f, v.x, v.y, v.z);
    n.setXYZ(l, v.x, v.y, v.z);
  }
  return g;
}

// paths: [{ pts, uRepeat?, vRepeat? }, …] → one geometry, one material group
// per path. `fn(v)` can deform the result before normals are rebuilt.
export function superLathe(paths, { a = 1, b = 1, p = 2, segs = 64, fn } = {}) {
  const geos = paths.map(path => {
    const g = ring({ a, b, p, segs, uRepeat: 1, vRepeat: 1, ...path });
    if (fn) {
      const pos = g.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        fn(v);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    return seamNormals(g, segs + 1);
  });
  return geos.length === 1 ? geos[0] : mergeGeometries(geos, true);
}
