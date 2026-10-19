import { useMemo } from 'react';
import * as THREE from 'three';
import { sides } from '../../materials/sides.js';
import { deform, jitter, merge, rng } from '../../geo.js';
import { lathe, memo, ring, roundedBox } from './shared.js';

// Pommes in a branded paper cone, Ø 12 cm at the mouth. Fat golden sticks
// fan out of the cone; a few lie over the front rim. Salt flakes on top.

const H = 1.25; // cone height
const frontDip = (x, z) => 0.16 * Math.max(0, z / Math.hypot(x, z)) ** 2;

// Cone shell, wavy rim and a lowered front like a torn-open paper bag.
const shape = (g, inner) =>
  deform(g, v => {
    const r = Math.hypot(v.x, v.z);
    if (r < 1e-4) return;
    const a = Math.atan2(v.x, v.z);
    const k = 1 + 0.025 * Math.sin(2 * a + 0.8) + 0.015 * Math.sin(5 * a);
    v.x *= k;
    v.z *= k;
    if (v.y > H - 0.35) v.y -= (frontDip(v.x, v.z) + 0.035 * Math.sin(3 * a + 1.2)) * ((v.y - (H - 0.35)) / 0.35) * (inner ? 1 : 1);
  });

const outer = () =>
  memo('coneOuter', () =>
    shape(
      lathe(
        [
          [0.001, 0],
          [0.2, 0],
          [0.3, 0.02],
          [0.36, 0.1],
          [0.5, 0.6],
          [0.66, H - 0.02],
          [0.68, H],
          [0.66, H + 0.014],
        ],
        { segments: 80 },
      ),
    ),
  );
const inner = () =>
  memo('coneInner', () =>
    shape(
      lathe(
        [
          [0.65, H + 0.014],
          [0.62, H - 0.02],
          [0.47, 0.62],
          [0.33, 0.12],
          [0.2, 0.05],
          [0.001, 0.05],
        ],
        { segments: 80 },
      ),
      true,
    ),
  );

// Fry sticks: fat rounded box, bent, tapered and a bit lumpy. Origin at the
// bottom end. Four variants with different length and bend.
const stick = v =>
  memo(`stick${v}`, () => {
    const r = rng(v * 13 + 5);
    const len = 0.95 + v * 0.1 + r() * 0.1;
    const w = 0.2 + r() * 0.03;
    const g = roundedBox(w, len, w * (0.9 + r() * 0.2), 0.05, 3);
    g.translate(0, len / 2, 0);
    const bend = (r() - 0.5) * 0.35;
    const twist = (r() - 0.5) * 0.9;
    return deform(g, p => {
      const t = p.y / len;
      const a = twist * t;
      const x = p.x * Math.cos(a) - p.z * Math.sin(a);
      const z = p.x * Math.sin(a) + p.z * Math.cos(a);
      const taper = 1 - 0.18 * Math.pow(2 * t - 1, 4) - 0.06 * t;
      p.x = x * taper + bend * t * t + 0.012 * Math.sin(p.y * 9 + v);
      p.z = z * taper + 0.01 * Math.sin(p.y * 7 + v * 2);
    });
  });

// A couple of salt flakes sitting on the stick (merged into one geometry).
const salt = v =>
  memo(`salt${v}`, () => {
    const r = rng(v * 31 + 9);
    const len = 0.95 + v * 0.1;
    const parts = Array.from({ length: 3 }, (_, i) => {
      const s = 0.035 + r() * 0.025;
      const g = roundedBox(s, s * 0.7, s * 1.2, s * 0.3, 2);
      g.rotateY(r() * 3);
      g.translate((r() - 0.5) * 0.1, len - 0.005 + i * 0.002, (r() - 0.5) * 0.1);
      return g;
    });
    return merge(parts);
  });

const L = { pos: 0.03, rot: 3, tilt: 0.05, scale: 0.08 };
const slots = [
  // tall middle
  ...jitter(
    ring(5, 0.08, 0.4).map(s => ({ p: [s.p[0], 0.3, s.p[2]], r: [0.06, s.a, 0] })),
    1,
    { ...L, pos: 0.02, scale: 0.05 },
  ),
  // middle ring
  ...jitter(
    ring(9, 0.18, 0.1).map(s => ({ p: [s.p[0], 0.28, s.p[2]], r: [0.14, s.a, 0] })),
    2,
    { ...L, tilt: 0.06, rot: 0.25 },
  ),
  // outer ring, fanned out
  ...jitter(
    ring(13, 0.27, 0.3).map(s => ({ p: [s.p[0], 0.3, s.p[2]], r: [0.26, s.a, 0] })),
    3,
    { ...L, tilt: 0.07, rot: 0.2 },
  ),
  // three over the front rim
  ...jitter(
    [-0.3, 0.05, 0.38].map(x => ({ p: [x * 0.7, 0.92, 0.46], r: [1.2 + x * 0.1, x * 0.6, 0] })),
    4,
    { pos: 0.03, rot: 0.1, tilt: 0.1, scale: 0.05 },
  ),
].map((s, i) => ({ ...s, v: i % 4 }));

export default function Pommes() {
  const mats = useMemo(() => ({ fry: sides.fry(), salt: sides.salt(), print: sides.cone(), inside: sides.paperPlain() }), []);
  return (
    <group>
      <mesh geometry={outer()} material={mats.print} castShadow receiveShadow />
      <mesh geometry={inner()} material={mats.inside} receiveShadow />
      {slots.map((s, i) => (
        <group key={i} position={s.p} rotation={[s.r[0], s.r[1], s.r[2], 'YXZ']} scale={s.s}>
          <mesh geometry={stick(s.v)} material={mats.fry} castShadow receiveShadow />
          {i % 3 !== 1 && <mesh geometry={salt(s.v)} material={mats.salt} />}
        </group>
      ))}
    </group>
  );
}
