import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { blobShape, deform, jitter, merge, rng, slab } from '../../geo.js';
import { pizzaExtras } from '../../materials/pizza-extras.js';

// Extra pizza toppings: chicken, tuna, red onion, corn, jalapeños, rucola.
// Layout and geometry only; Pizza.jsx wires them in as layers.

const cache = {};
const memo = (key, make) => (cache[key] ??= make());

// Resting height of each topping's centre above the cheese top (`top` in
// Pizza.jsx). Flat, wide toppings sit lowest, thin or leafy ones on top, so
// overlaps stack in a believable order without z-fighting.
export const lifts = {
  salami: 0.03,
  ham: 0.038,
  tomatoSlices: 0.046,
  mushrooms: 0.054,
  chicken: 0.058,
  tuna: 0.044,
  corn: 0.085,
  jalapenos: 0.07,
  pepper: 0.082,
  redOnion: 0.092,
  olives: 0.1,
  basil: 0.118,
  rucola: 0.125,
};

// ─────────────────────────────── geometry ────────────────────────────────

export const chickenGeo = variant =>
  memo(`chicken${variant}`, () => {
    const w = 0.38;
    const g = slab(blobShape({ w, h: 0.28, p: 2.5, wobble: 0.13, seed: variant * 5 + 21 }), {
      thickness: 0.14,
      bevel: 0.055,
      bevelSegments: 5,
      tessellate: 0.06,
      uvScale: 1 / w,
    });
    return deform(g, v => {
      const k = Math.max(0, 1 - (v.x * v.x) / 0.04 - (v.z * v.z) / 0.022);
      v.y += (v.y > 0 ? 0.04 : 0.01) * k + 0.012 * Math.sin(v.x * 17 + variant * 2);
    });
  });

export const tunaGeo = variant =>
  memo(`tuna${variant}`, () => {
    const w = 0.32;
    const g = slab(blobShape({ w, h: 0.24, p: 2.3, wobble: 0.18, seed: variant * 9 + 44 }), {
      thickness: 0.11,
      bevel: 0.045,
      bevelSegments: 4,
      tessellate: 0.05,
      uvScale: 1 / w,
    });
    return deform(g, v => {
      v.y += 0.03 * Math.sin(v.x * 15 + variant) * Math.cos(v.z * 13 + variant * 3) + (v.y > 0 ? 0.02 : 0);
    });
  });

// Onion rings lie flat: single, double (concentric), half and three-quarter.
export const onionGeo = variant =>
  memo(`onion${variant}`, () => {
    const ring = (R, tube, arc) => {
      const g = new THREE.TorusGeometry(R, tube, 12, 44, arc);
      g.rotateX(Math.PI / 2);
      g.scale(1, 0.62, 1);
      return g;
    };
    const parts =
      variant === 0
        ? [ring(0.2, 0.03, Math.PI * 2)]
        : variant === 1
          ? [ring(0.21, 0.028, Math.PI * 2), ring(0.135, 0.024, Math.PI * 2)]
          : variant === 2
            ? [ring(0.2, 0.03, Math.PI)]
            : [ring(0.19, 0.03, Math.PI * 1.5)];
    const g = parts.length > 1 ? merge(parts) : parts[0];
    return deform(g, v => {
      const a = Math.atan2(v.z, v.x);
      const k = 1 + 0.05 * Math.sin(3 * a + variant) + 0.03 * Math.sin(5 * a);
      v.x *= k;
      v.z *= k;
      v.y += 0.012 * Math.sin(2 * a + variant);
    });
  });

export const jalapenoGeo = variant =>
  memo(`jalapeno${variant}`, () => {
    const d = 0.34;
    const g = slab(blobShape({ w: d * (1 + (variant - 1.5) * 0.02), h: d, wobble: 0.05, seed: variant * 7 + 71 }), {
      thickness: 0.065,
      bevel: 0.028,
      bevelSegments: 4,
      tessellate: d / 8,
      uvScale: 1 / d,
    });
    return deform(g, v => void (v.y += 0.012 * ((v.x * v.x + v.z * v.z) / (d * d * 0.25)) + 0.006 * Math.sin(v.z * 20 + variant)));
  });

// Pinnate, slightly lobed rucola leaf with a cupped, drooping tip.
export const rucolaGeo = variant =>
  memo(`rucola${variant}`, () => {
    const r = rng(variant * 13 + 5);
    const L = 0.54 + r() * 0.14;
    const W = 0.1 + r() * 0.03;
    const phase = r() * 6;
    const N = 22;
    const half = t => W * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.85) * (0.8 + 0.2 * Math.cos(t * Math.PI * 7 + phase));
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push(new THREE.Vector2((i / N - 0.5) * L, half(i / N)));
    for (let i = N - 1; i >= 1; i--) pts.push(new THREE.Vector2((i / N - 0.5) * L, -half(i / N)));
    const s = new THREE.Shape();
    s.setFromPoints(pts);
    s.closePath();
    const g = slab(s, { thickness: 0.02, bevel: 0.008, bevelSegments: 2, tessellate: 0.05, uvScale: [1 / L, 1 / (2 * W)] });
    return deform(g, v => void (v.y += 1.3 * v.z * v.z - 0.45 * v.x * v.x + 0.012 * Math.sin(v.x * 18 + variant)));
  });

const kernelGeo = () =>
  memo('kernel', () => {
    const g = new THREE.SphereGeometry(1, 14, 10);
    g.scale(0.052, 0.044, 0.042);
    return deform(g, v => {
      if (v.y > 0) v.y -= 0.014 * Math.max(0, 1 - (v.x * v.x + v.z * v.z) / 0.0006);
    });
  });

// ─────────────────────────────── slots ───────────────────────────────────

const ring = (n, r, offset = 0, extra = {}) =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * Math.PI * 2;
    return { p: [Math.cos(a) * r, 0, Math.sin(a) * r], r: [0, -a, 0], ...extra };
  });

// Hand-placed: rings are only the starting point; `y` staggers heights so
// pieces of one kind overlap without coplanar faces.
const hand = { pos: 0.1, y: 0.007, rot: Math.PI, tilt: 0.09, scale: 0.13 };

export const extraSlots = {
  chicken: jitter([...ring(6, 0.78, 0.25), ...ring(2, 0.24, 1.2)], 21, { ...hand, tilt: 0.1 }),
  tuna: jitter([...ring(7, 0.7, 0.6), ...ring(3, 0.3, 0.1)], 22, { ...hand, scale: 0.18 }),
  redOnion: jitter([...ring(7, 0.72, 0.45), ...ring(3, 0.28, 0.9)], 23, { ...hand, y: 0.01, tilt: 0.06, scale: 0.15 }),
  jalapenos: jitter([...ring(6, 0.9, 0.8), ...ring(2, 0.36, 2.4)], 24, { ...hand, scale: 0.1 }),
  rucola: jitter(
    Array.from({ length: 9 }, (_, i) => {
      const a = i * 2.39996;
      const rr = 0.18 + 0.78 * Math.sqrt((i + 0.5) / 9);
      return { p: [Math.cos(a) * rr, 0, Math.sin(a) * rr], r: [0, -a + 1.2, 0] };
    }),
    25,
    { pos: 0.08, y: 0.012, rot: 1.0, tilt: 0.2, scale: 0.12 },
  ),
};

// Corn: small clusters of plump kernels, scattered by hand.
const cornKernels = (() => {
  const r = rng(26);
  const out = [];
  const clusters = 9;
  for (let c = 0; c < clusters; c++) {
    const a = c * 2.39996 + 0.5;
    const rr = 0.2 + 0.72 * Math.sqrt((c + 0.5) / clusters);
    const cx = Math.cos(a) * rr;
    const cz = Math.sin(a) * rr;
    const n = 5 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const ka = r() * Math.PI * 2;
      const kr = 0.03 + Math.sqrt(r()) * 0.12;
      out.push({
        p: [cx + Math.cos(ka) * kr, (r() - 0.5) * 0.012, cz + Math.sin(ka) * kr],
        r: [(r() - 0.5) * 0.7, r() * Math.PI * 2, (r() - 0.5) * 0.7],
        s: 0.88 + r() * 0.28,
      });
    }
  }
  return out;
})();

export function Corn() {
  const ref = useRef();
  const mat = useMemo(() => pizzaExtras.corn(), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    cornKernels.forEach((k, i) => {
      e.set(...k.r);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(...k.p), q, new THREE.Vector3(k.s, k.s, k.s));
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[kernelGeo(), mat, cornKernels.length]} castShadow receiveShadow />;
}
