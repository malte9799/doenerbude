import { useMemo } from 'react';
import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { sides } from '../../materials/sides.js';
import { blobShape, deform, jitter, slab } from '../../geo.js';
import { lathe, memo, ring, roundedBox } from './shared.js';

// Hirtensalat in a plump ceramic bowl. A mound of curly lettuce with big
// tomato wedges, cucumber slices, red onion rings, feta cubes and olives.

const outerBowl = () =>
  memo('bowlOuter', () =>
    lathe([
      [0.001, 0],
      [0.45, 0],
      [0.6, 0.05],
      [1.0, 0.34],
      [1.3, 0.72],
      [1.36, 0.82],
      [1.3, 0.88],
    ]),
  );
const innerBowl = () =>
  memo('bowlInner', () =>
    lathe([
      [1.26, 0.86],
      [1.2, 0.8],
      [0.96, 0.42],
      [0.5, 0.15],
      [0.001, 0.12],
    ]),
  );

// Height of the mound at radius r (inside the bowl, up to well over the rim).
const mound = r => 0.5 + 0.75 * Math.max(0, 1 - (r / 1.35) ** 2) ** 0.8;

const lettuceLeaf = v =>
  memo(`leaf${v}`, () => {
    const w = 0.95 + (v % 2) * 0.15;
    const h = 0.6 + (v % 3) * 0.06;
    const g = slab(blobShape({ w, h, p: 2.2, wobble: 0.14, seed: 40 + v, points: 40 }), { thickness: 0.04, bevel: 0.016, bevelSegments: 2, tessellate: 0.06, uvScale: [1 / w, 1 / h] });
    return deform(g, p => {
      p.y += 0.07 * Math.sin(p.x * 9 + v) * Math.cos(p.z * 7) + 0.3 * p.z * p.z - 0.08 * p.x * p.x;
    });
  });

const wedge = v =>
  memo(`wedge${v}`, () => {
    const g = slab(blobShape({ w: 0.62, h: 0.5, p: 2.6, wobble: 0.08, seed: 60 + v, points: 32 }), {
      thickness: 0.2,
      bevel: 0.08,
      bevelSegments: 4,
      tessellate: 0.06,
      uvScale: 1 / 0.62,
    });
    return deform(g, () => {});
  });

const cucumber = v =>
  memo(`cuc${v}`, () => {
    const g = slab(blobShape({ w: 0.5, h: 0.48, wobble: 0.05, seed: 80 + v }), { thickness: 0.13, bevel: 0.05, bevelSegments: 4, uvScale: 1 / 0.5 });
    return g;
  });

const onionRing = v =>
  memo(`onion${v}`, () => {
    const g = new THREE.TorusGeometry(0.2 + (v % 2) * 0.04, 0.035, 10, 28, Math.PI * (1.2 + (v % 3) * 0.25));
    return g;
  });

const feta = () => memo('feta', () => roundedBox(0.3, 0.27, 0.3, 0.07, 4));
const olive = () =>
  memo('olive', () => {
    const g = new THREE.SphereGeometry(0.13, 20, 14);
    g.scale(1, 0.85, 1.25);
    return g;
  });

const ringSlots = [
  ...ring(8, 0.92, 0.2).map(s => ({ ...s, y: 0.9 })),
  ...ring(5, 0.55, 0.5).map(s => ({ ...s, y: 0.95 })),
  ...ring(2, 0.15, 1.2).map(s => ({ ...s, y: 1.0 })),
];
const leaves = jitter(
  ringSlots.map(s => ({ p: [s.p[0], mound(Math.hypot(s.p[0], s.p[2])) - 0.1, s.p[2]], r: [-s.p[2] * 0.35, s.a + 1.57, s.p[0] * 0.35] })),
  11,
  { pos: 0.08, y: 0.04, rot: 0.9, tilt: 0.18, scale: 0.12 },
);

const toppingKinds = ['wedge', 'cuc', 'feta', 'onion', 'wedge', 'olive', 'cuc', 'feta', 'wedge', 'onion', 'cuc', 'olive', 'feta', 'wedge', 'onion', 'olive'];
const toppingSlots = jitter(
  [...ring(7, 0.88, 0.7), ...ring(5, 0.5, 0.1), ...ring(2, 0.12, 2.4)].map((s, i) => {
    const r = Math.hypot(s.p[0], s.p[2]);
    const kind = toppingKinds[i % toppingKinds.length];
    const lift = { wedge: 0.1, cuc: 0.12, feta: 0.12, onion: 0.1, olive: 0.1 }[kind];
    const tilt = kind === 'cuc' ? [0.9 * Math.cos(s.a), 0, 0.9 * Math.sin(s.a)] : [0.3 * Math.sin(s.a), 0, 0.3 * Math.cos(s.a)];
    return { kind, p: [s.p[0], mound(r) + lift, s.p[2]], r: [tilt[0], s.a * 2.3, tilt[2]] };
  }),
  21,
  { pos: 0.09, y: 0.03, rot: 1.2, tilt: 0.25, scale: 0.1 },
);

export default function Salat() {
  const m = useMemo(
    () => ({
      outer: sides.ceramicRed(),
      inner: sides.ceramic(),
      lettuce: materials.lettuce(),
      tomato: materials.tomatoSlice(),
      cuc: materials.cucumberSlice(),
      onion: materials.onion(),
      feta: materials.feta(),
      olive: sides.olive(),
    }),
    [],
  );
  const geo = { wedge, cuc: cucumber, onion: onionRing, feta, olive };
  const mat = { wedge: m.tomato, cuc: m.cuc, onion: m.onion, feta: m.feta, olive: m.olive };
  return (
    <group>
      <mesh geometry={outerBowl()} material={m.outer} castShadow receiveShadow />
      <mesh geometry={innerBowl()} material={m.inner} receiveShadow />
      {leaves.map((l, i) => (
        <mesh key={'l' + i} geometry={lettuceLeaf(l.v)} material={m.lettuce} position={l.p} rotation={l.r} scale={l.s} castShadow receiveShadow />
      ))}
      {toppingSlots.map((t, i) => (
        <mesh key={'t' + i} geometry={geo[t.kind](t.v)} material={mat[t.kind]} position={t.p} rotation={t.r} scale={t.s} castShadow receiveShadow />
      ))}
    </group>
  );
}
