import { useMemo } from 'react';
import * as THREE from 'three';
import { sides } from '../../materials/sides.js';
import { blobShape, deform, jitter, rng, slab, splitByNormal } from '../../geo.js';
import { lathe, memo, roundedBox } from './shared.js';

// Baklava: three diamond pieces on a small plate. Layered sides, glossy
// syrup-soaked top, a puddle of syrup and pistachio crumbs.

const T = 0.42; // piece thickness
const W = 1.0;

const plate = () =>
  memo('plate', () =>
    lathe([
      [0.001, 0],
      [0.9, 0],
      [1.25, 0.03],
      [1.62, 0.16],
      [1.7, 0.26],
      [1.64, 0.28],
      [1.5, 0.15],
      [1.1, 0.07],
      [0.001, 0.06],
    ]),
  );

const puddle = () => memo('puddle', () => slab(blobShape({ w: 2.2, h: 2.0, wobble: 0.12, seed: 9, points: 64 }), { thickness: 0.04, bevel: 0.018, bevelSegments: 3, uvScale: 0.3 }));

// Diamond piece with a domed top; side faces get layer UVs (v = height).
const piece = v =>
  memo(`piece${v}`, () => {
    const g = slab(blobShape({ w: W, h: W, p: 1.25, wobble: 0.04, seed: 20 + v, points: 40 }), { thickness: T, bevel: 0.13, bevelSegments: 6, tessellate: 0.07, uvScale: 1 / W });
    deform(g, p => {
      if (p.y > 0) p.y += 0.07 * Math.max(0, 1 - (p.x * p.x + p.z * p.z) / 0.3);
    });
    const s = splitByNormal(g, new THREE.Vector3(0, 1, 0), 0.55);
    const pos = s.attributes.position;
    const uv = s.attributes.uv;
    const top = s.groups[1];
    const topStart = top.start;
    for (let i = 0; i < pos.count; i++) {
      if (i >= topStart) uv.setXY(i, pos.getX(i) / W + 0.5, -pos.getZ(i) / W + 0.5);
      else uv.setXY(i, (pos.getX(i) + pos.getZ(i)) * 0.9, (pos.getY(i) + T / 2) / (T + 0.06));
    }
    return s;
  });

const crumb = v =>
  memo(`crumb${v}`, () => {
    const r = rng(v * 17 + 3);
    const s = 0.05 + r() * 0.05;
    const g = roundedBox(s, s * 0.7, s * (0.8 + r() * 0.6), s * 0.3, 2);
    g.rotateY(r() * 3);
    return g;
  });

const nut = () =>
  memo('nut', () => {
    const g = new THREE.SphereGeometry(0.1, 16, 12);
    g.scale(1.1, 0.7, 0.85);
    return g;
  });

const crumbSlots = (seed, n, radius) => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = r() * 6.28;
    const d = Math.sqrt(r()) * radius;
    return { p: [Math.cos(a) * d, Math.sin(a) * d], v: i % 4, dark: r() > 0.5 };
  });
};

const pieces = jitter(
  [
    { p: [-0.62, 0.1, 0.4], r: [0, 0.2, 0] },
    { p: [0.62, 0.1, 0.45], r: [0, -0.15, 0] },
    { p: [0.0, 0.1, -0.5], r: [0, 0.1, 0] },
  ],
  3,
  { pos: 0.04, rot: 0.2, tilt: 0.02, scale: 0.03 },
).map((p, i) => ({ ...p, v: i }));
const crumbsOn = pieces.map((_, i) => crumbSlots(50 + i, 8, 0.25));
const plateCrumbs = crumbSlots(77, 22, 1.2);

export default function Baklava() {
  const m = useMemo(
    () => ({
      plate: sides.ceramic(),
      syrup: sides.syrup(),
      side: sides.baklavaSide(),
      top: sides.baklavaTop(),
      pist: sides.pistachio(),
      pistD: sides.pistachioDark(),
    }),
    [],
  );
  const topY = T / 2 + 0.06;
  return (
    <group>
      <mesh geometry={plate()} material={m.plate} castShadow receiveShadow />
      <mesh geometry={puddle()} material={m.syrup} position={[0, 0.08, 0]} receiveShadow />
      {pieces.map((p, i) => (
        <group key={i} position={[p.p[0], p.p[1] + T / 2, p.p[2]]} rotation={p.r} scale={p.s}>
          <mesh geometry={piece(p.v)} material={[m.side, m.top]} castShadow receiveShadow />
          {crumbsOn[i].map((c, j) => (
            <mesh key={j} geometry={crumb(c.v)} material={c.dark ? m.pistD : m.pist} position={[c.p[0], topY - 0.015, -c.p[1]]} castShadow />
          ))}
          <mesh geometry={nut()} material={m.pist} position={[0, topY, 0]} rotation={[0, 0.5 + i, 0]} castShadow />
        </group>
      ))}
      {plateCrumbs.map((c, j) => {
        const d = Math.hypot(c.p[0], c.p[1]);
        if (d < 0.9) return null;
        return <mesh key={j} geometry={crumb(c.v)} material={c.dark ? m.pistD : m.pist} position={[c.p[0], 0.11, c.p[1]]} rotation={[0, j, 0]} />;
      })}
    </group>
  );
}
