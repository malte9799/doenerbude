import * as THREE from 'three';
import { jitter, merge, planarUV, ribbon, rng } from '../../geo.js';
import { flake, memo } from '../doener/Doener.jsx';

// Pieces shared by the döner-family models.

// Hand-placed pieces from a jittered layout. `s` scales every piece.
export function Pieces({ layout, geometry, material, s = 1, order = 'YXZ' }) {
  return layout.map((it, i) => (
    <mesh key={i} geometry={geometry(it)} material={material} position={it.p} rotation={[it.r[0], it.r[1], it.r[2], order]} scale={(it.s ?? 1) * s} castShadow receiveShadow />
  ));
}

// Items on a ring (or an arc of it). Yaw makes the piece's +z point outwards,
// `pitch` < 0 lifts that outer edge, so pieces stand up and lean out.
export function radial(n, rad, y, pitch, { from = 0, to = Math.PI * 2, seed = 1, jit = {} } = {}) {
  const items = Array.from({ length: n }, (_, i) => {
    const a = from + ((i + 0.5) / n) * (to - from);
    return { seed: seed + i, p: [Math.cos(a) * rad, y, Math.sin(a) * rad], r: [pitch, Math.PI / 2 - a, 0] };
  });
  return jitter(items, seed * 7 + 3, { pos: 0.04, y: 0.03, rot: 0.35, tilt: 0.2, scale: 0.14, ...jit });
}

// Wobbly sauce line lying along x with sideways swings; `lines` passes.
export const drizzleGeo = (key, { halfW = 0.4, amp = 0.2, lines = 2, radius = 0.04, freq = 3.2 } = {}) =>
  memo(`drizzle-${key}`, () => {
    const geos = Array.from({ length: lines }, (_, k) => {
      const r = rng(31 + k * 7);
      const z0 = (k - (lines - 1) / 2) * amp * 0.9;
      const ph = k * 1.9;
      let w = 1;
      const pts = [];
      for (let i = 0; i <= 36; i++) {
        const t = i / 36;
        w = Math.min(1.3, Math.max(0.6, w + (r() - 0.5) * 0.3));
        pts.push(new THREE.Vector3((t * 2 - 1) * halfW + (r() - 0.5) * 0.02, 0.02 * Math.sin(t * 9 + ph) + r() * 0.01, z0 + amp * 0.5 * w * Math.sin(t * freq * Math.PI + ph)));
      }
      return ribbon(pts, { radius, flat: 0.65, segments: 180, radial: 10 });
    });
    const g = merge(geos);
    planarUV(g, 0.8);
    return g;
  });

// Chili flakes scattered over an ellipse.
export function Flakes({ rx = 0.4, rz = 0.4, y = 0, count = 22, material }) {
  const onUpdate = mesh => {
    const r = rng(77);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      q.setFromEuler(new THREE.Euler(r() * 0.5, r() * 6.28, r() * 0.5));
      const a = r() * 6.28;
      const d = Math.sqrt(r());
      m.compose(new THREE.Vector3(Math.cos(a) * d * rx, y + r() * 0.02, Math.sin(a) * d * rz), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + r() * 0.5));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh args={[flake(), material, count]} onUpdate={onUpdate} castShadow />;
}

// Resting heights for stacked layers: `list` = [{ id, h }], compressed so that
// pieces tuck into each other. Returns { id: y }.
export function stack(list, active, base, squash = 0.5) {
  let y = base;
  const out = {};
  for (const l of list) {
    out[l.id] = y;
    if (active.includes(l.id)) y += l.h * squash;
  }
  return out;
}
