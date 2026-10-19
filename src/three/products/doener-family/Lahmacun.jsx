import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { dfMaterials } from '../../materials/doener-family.js';
import { blobShape, deform, jitter, planarUV, slab } from '../../geo.js';
import Layer from '../Layer.jsx';
import { halfMoon, lettuceLeaf, memo, onionRing } from '../doener/Doener.jsx';
import { Pieces, drizzleGeo } from './shared.jsx';

// Lahmacun: thin round flatbread with a spicy minced topping. The left half
// lies flat, the right half is rolled up around salad. Lemon wedge beside it.
// Units: 1 = 10 cm, Ø 3.0.

export const lahmacunLayers = [
  { id: 'lahmacun', default: true, price: 0 },
  { id: 'lettuce', default: true, price: 0 },
  { id: 'tomato', default: true, price: 0 },
  { id: 'onion', default: true, price: 0 },
  { id: 'garlicSauce', default: false, price: 0.5 },
  { id: 'lemon', default: true, price: 0 },
];

const X0 = -0.25; // where the roll starts
const K0 = 2.2; // curvature at the start of the roll (1 / radius)
const KC = 1.6; // curvature growth: the spiral tightens
const T = 0.05; // dough thickness

// The rolled sheet's centre line as a spiral, sampled once.
const spiral = () =>
  memo('spiral', () => {
    const pts = [];
    let x = X0;
    let y = 0;
    const ds = 0.004;
    for (let s = 0; s <= 2; s += ds) {
      const th = K0 * s + (KC * s * s) / 2;
      pts.push({ s, x, y, th });
      x += Math.cos(th) * ds;
      y += Math.sin(th) * ds;
    }
    return pts;
  });

const rollCentre = () => {
  const pts = spiral().filter(p => p.th < Math.PI * 2);
  return pts.reduce((a, p) => [a[0] + p.x / pts.length, a[1] + p.y / pts.length], [0, 0]);
};

const dough = () =>
  memo('lahmacunDough', () => {
    let g = slab(blobShape({ w: 3.0, h: 2.8, p: 2.1, wobble: 0.035, seed: 41 }), { thickness: T, bevel: 0.02, bevelSegments: 3, tessellate: 0.06, uvScale: [1 / 3.0, 1 / 2.8] });
    // Underside and sides: plain dough (a corner of the texture outside the disc).
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) uv.setXY(i, 0.01, 0.01);
    const table = spiral();
    return deform(g, v => {
      // Hand-made unevenness, then the curl.
      v.y += 0.012 * Math.sin(v.x * 5 + v.z * 3);
      const s = v.x - X0;
      if (s <= 0) return;
      const i = Math.min(table.length - 2, Math.floor(s / 0.004));
      const a = table[i];
      const b = table[i + 1];
      const f = (s - a.s) / (b.s - a.s);
      const th = a.th + (b.th - a.th) * f;
      const px = a.x + (b.x - a.x) * f;
      const py = a.y + (b.y - a.y) * f;
      v.x = px - Math.sin(th) * v.y;
      v.y = py + Math.cos(th) * v.y;
    });
  });

const lemon = () =>
  memo('lemonWedge', () => {
    const g = slab(blobShape({ w: 0.78, h: 0.78, wobble: 0.015, seed: 8, part: 0.5 }), { thickness: 0.3, bevel: 0.07, bevelSegments: 5, uvScale: 1 / 0.78 });
    return g;
  });

export default function Lahmacun({ active }) {
  const on = id => active.includes(id);
  const [cx, cy] = rollCentre();
  // Leaves lie along the roll axis (z) and stick out of both open ends.
  const lettuce = jitter(
    [[0, 0, -1.0], [0.05, 0.03, 1.02], [0.02, 0.06, 0.05], [-0.03, -0.02, -0.5]].map(([x, y, z], i) => ({ seed: 30 + i, p: [cx + x, cy + y, z], r: [0.15, Math.PI / 2 + (i - 1.5) * 0.25, 0.2] })),
    22,
    { pos: 0.03, y: 0.02, rot: 0.2, tilt: 0.2, scale: 0.1 },
  );
  const tomatoEnds = jitter(
    [[0.08, 0.04, 1.2], [-0.05, 0, -1.18]].map(([x, y, z], i) => ({ p: [cx + x, cy + y, z], r: [0.4 * (i ? 1 : -1), i * 2.5, 0.1] })),
    33,
    { pos: 0.03, rot: 0.3, tilt: 0.1, scale: 0.08 },
  );
  const tomatoFlat = jitter(
    [[-0.95, -0.35], [-0.55, 0.45]].map(([x, z]) => ({ p: [x, 0.07, z] })),
    34,
    { pos: 0.06, rot: 1.5, tilt: 0.1, scale: 0.1 },
  );
  const onionFlat = jitter(
    [[-1.0, 0.3], [-0.6, -0.4], [-0.4, 0.05]].map(([x, z], i) => ({ seed: 50 + i, p: [x, 0.08, z], r: [0, i * 1.7, 0] })),
    44,
    { pos: 0.05, rot: 1, tilt: 0.2, scale: 0.12 },
  );
  const onionEnds = jitter(
    [[0.0, 0.0, 1.3]].map(([x, y, z], i) => ({ seed: 60 + i, p: [cx + x, cy + y, z], r: [Math.PI / 2, 0, 0] })),
    45,
    { pos: 0.02, rot: 0.3, tilt: 0.1, scale: 0.1 },
  );

  return (
    <group rotation={[0, -0.2, 0]}>
      <Layer active={on('lahmacun')} y={0.03}>
        <mesh geometry={dough()} material={dfMaterials.lahmacun()} castShadow receiveShadow />
      </Layer>
      <Layer active={on('lettuce')} y={0}>
        <Pieces layout={lettuce} geometry={it => lettuceLeaf(it.seed)} material={materials.lettuce()} s={1.55} order="XYZ" />
      </Layer>
      <Layer active={on('tomato')} y={0}>
        <Pieces layout={tomatoEnds} geometry={halfMoon} material={materials.tomatoSlice()} s={0.85} order="XYZ" />
        <Pieces layout={tomatoFlat} geometry={halfMoon} material={materials.tomatoSlice()} s={0.85} order="XYZ" />
      </Layer>
      <Layer active={on('onion')} y={0}>
        <Pieces layout={onionFlat} geometry={it => onionRing(it.seed)} material={materials.onion()} s={0.95} order="XYZ" />
        <Pieces layout={onionEnds} geometry={it => onionRing(it.seed)} material={materials.onion()} s={1} order="XYZ" />
      </Layer>
      <Layer active={on('garlicSauce')} y={0.1}>
        <group position={[-0.65, 0, 0]} rotation={[0, 0.5, 0]}>
          <mesh geometry={drizzleGeo('lahm', { halfW: 0.55, amp: 0.5, lines: 2, radius: 0.035, freq: 3 })} material={materials.garlicSauce()} castShadow />
        </group>
      </Layer>
      <Layer active={on('lemon')} y={0}>
        <mesh geometry={lemon()} material={dfMaterials.lemon()} position={[-0.85, 0.28, 1.7]} scale={0.72} rotation={[Math.PI / 2 - 0.35, 0.1, 0]} castShadow receiveShadow />
      </Layer>
    </group>
  );
}
