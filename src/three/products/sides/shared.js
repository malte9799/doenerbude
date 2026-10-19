import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const cache = {};
export const memo = (key, make) => (cache[key] ??= make());

// Lathe from a profile [[r, y], …] (ordered so normals face outwards: bottom
// centre → up the outside → back in along the top). The profile is smoothed
// with a spline; v follows the arc length (0 at the first point, 1 at the
// last) so painted wrap-around textures keep their proportions.
export function lathe(profile, { segments = 72, samples = 90, smooth = true } = {}) {
  const ctrl = profile.map(([x, y]) => new THREE.Vector2(x, y));
  const pts = smooth ? new THREE.SplineCurve(ctrl).getSpacedPoints(samples) : ctrl;
  const g = new THREE.LatheGeometry(pts, segments);
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = len[len.length - 1];
  const uv = g.attributes.uv;
  for (let i = 0; i <= segments; i++) for (let j = 0; j < pts.length; j++) uv.setY(i * pts.length + j, len[j] / total);
  return g;
}

// Horizontal angle (0 at +Z, growing towards +X, like the lathe seam).
export const angleOf = (x, z) => Math.atan2(x, z);

export function roundedBox(w, h, d, radius = 0.04, segments = 3) {
  return new RoundedBoxGeometry(w, h, d, segments, radius);
}

// A ring of n points with radius r, starting at `offset` radians.
export const ring = (n, r, offset = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * Math.PI * 2;
    return { a, p: [Math.sin(a) * r, 0, Math.cos(a) * r] };
  });
