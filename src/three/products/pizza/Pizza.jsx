import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { blobShape, deform, jitter, planarUV, ribbon, rng, slab } from '../../geo.js';
import Layer from '../Layer.jsx';
import { MOTION, approach } from '../../motion.js';

// Pizza, Ø 30 cm (3 units). Base → sauce → cheese → toppings in fixed slots.
// Fluent style: a puffy rim and few, big, plump toppings.
// `baked` animates raw dough / pale cheese to a golden crust.

const TOP = 0.1; // height of the flat dough surface

export const pizzaLayers = [
  { id: 'tomatoSauce', default: true, price: 0 },
  { id: 'cheese', default: true, price: 0 },
  { id: 'salami', default: true, price: 1.5 },
  { id: 'ham', default: false, price: 1.5 },
  { id: 'tomatoSlices', default: false, price: 1.0 },
  { id: 'mushrooms', default: false, price: 1.0 },
  { id: 'pepper', default: false, price: 1.0 },
  { id: 'olives', default: false, price: 1.0 },
  { id: 'basil', default: false, price: 0.5 },
];

const cache = {};
const memo = (key, make) => (cache[key] ??= make());

// ─────────────────────────────── geometry ────────────────────────────────

// Lathe from the underside centre, out and up over the puffy rim, then back
// in along the top. Normals face outwards in that order. UV v is remapped so
// the rim always lands at v 0.55–0.85 of the base texture.
const base = () =>
  memo('base', () => {
    const ctrl = [
      [0.001, 0],
      [0.8, 0],
      [1.28, 0.006],
      [1.45, 0.05],
      [1.54, 0.16],
      [1.52, 0.3],
      [1.42, 0.38],
      [1.29, 0.35],
      [1.19, 0.22],
      [1.1, TOP + 0.01],
      [0.6, TOP],
      [0.001, TOP],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const pts = new THREE.SplineCurve(ctrl).getSpacedPoints(100);
    const segs = 160;
    const g = new THREE.LatheGeometry(pts, segs);

    // v per profile point: top centre 0 → rim start 0.55 → rim end 0.85 → underside centre 1.
    const outer = pts.reduce((m, p, i) => (p.x > pts[m].x ? i : m), 0);
    const rimStart = pts.findIndex((p, i) => i > outer && p.x < 1.16);
    const vs = pts.map((p, j) => {
      if (j >= rimStart) return 0.55 * (p.x / pts[rimStart].x);
      if (j >= outer) return 0.55 + 0.3 * ((rimStart - j) / (rimStart - outer));
      return 0.85 + 0.15 * (1 - p.x / pts[outer].x);
    });
    const uv = g.attributes.uv;
    for (let i = 0; i <= segs; i++) {
      for (let j = 0; j < pts.length; j++) uv.setY(i * pts.length + j, vs[j]);
    }

    // Hand-made look: a slightly oval base and a lumpy rim that rises and
    // falls around the pizza (periodic in the angle, so the seam closes).
    const pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k);
      const y = pos.getY(k);
      const z = pos.getZ(k);
      const r = Math.hypot(x, z);
      if (r < 1e-4) continue;
      const a = Math.atan2(z, x);
      const rim = THREE.MathUtils.smoothstep(r, 1.05, 1.3);
      const lump = 0.5 * Math.sin(3 * a + 1) + 0.3 * Math.sin(5 * a + 2.3) + 0.2 * Math.sin(8 * a + 0.7) + 0.12 * Math.sin(13 * a + 4.1);
      const oval = 1 + 0.015 * Math.cos(2 * a + 0.6);
      const k2 = (oval * (r + rim * lump * 0.022)) / r;
      pos.setXYZ(k, x * k2, y * (1 + rim * lump * 0.22), z * k2);
    }
    g.computeVertexNormals();
    return g;
  });

const sauce = () => memo('sauce', () => slab(blobShape({ w: 2.34, h: 2.38, wobble: 0.05, seed: 3, points: 96 }), { thickness: 0.05, bevel: 0.022, bevelSegments: 4, uvScale: 0.42 }));

// Cheese is a dense grid; its outline, holes and melted relief all come from
// the cheese texture (alpha cut-out + displacement), so raw and baked match.
const CHEESE = 2.42;
const cheese = () =>
  memo('cheese', () => {
    const g = new THREE.PlaneGeometry(CHEESE, CHEESE, 240, 240);
    g.rotateX(-Math.PI / 2);
    return planarUV(g, 1 / CHEESE);
  });

// Round slices, each variant a little out of round, with cupping (slices
// curl up at the rim in the oven) and a slight lean.
const disc = (key, d, t, cup = 0, variant = 0) =>
  memo(`${key}${variant}`, () => {
    const r = rng(variant * 31 + Math.round(d * 100));
    const g = slab(blobShape({ w: d * (1 + (r() - 0.5) * 0.08), h: d, wobble: 0.05, seed: variant * 7 + 3 }), {
      thickness: t,
      bevel: t * 0.42,
      bevelSegments: 5,
      tessellate: d / 10,
      uvScale: 1 / d,
    });
    const c = cup * (0.6 + r() * 0.8);
    const lean = (r() - 0.5) * 0.08;
    return deform(g, v => void (v.y += c * ((v.x * v.x + v.z * v.z) / ((d * d) / 4)) + lean * v.x + 0.01 * Math.sin(v.z * 20 + variant)));
  });

const olive = () =>
  memo('olive', () => {
    const g = new THREE.TorusGeometry(0.075, 0.038, 16, 32);
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.85, 1);
    return g;
  });

// Champignon cross-section: domed cap on a short stem.
const mushroomShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.06, -0.11);
  s.quadraticCurveTo(0, -0.125, 0.06, -0.11);
  s.quadraticCurveTo(0.07, -0.03, 0.085, -0.005);
  s.quadraticCurveTo(0.17, -0.01, 0.17, 0.05);
  s.bezierCurveTo(0.17, 0.2, -0.17, 0.2, -0.17, 0.05);
  s.quadraticCurveTo(-0.17, -0.01, -0.085, -0.005);
  s.quadraticCurveTo(-0.07, -0.03, -0.06, -0.11);
  return s;
};
const mushroom = () =>
  memo('mushroom', () => {
    const g = slab(mushroomShape(), { thickness: 0.055, bevel: 0.022, bevelSegments: 4, uvScale: 1 / 0.34 });
    return g.scale(1.4, 1, 1.4);
  });

const hamPiece = seed =>
  memo(`ham${seed}`, () => {
    const g = slab(blobShape({ w: 0.46, h: 0.38, p: 2.8, wobble: 0.1, seed }), { thickness: 0.055, bevel: 0.022, bevelSegments: 3, tessellate: 0.05, uvScale: 1 / 0.46 });
    return deform(g, v => {
      v.y += 0.03 * Math.sin(v.x * 8 + seed) + 0.25 * v.x * v.x;
    });
  });

const pepperStrip = seed =>
  memo(`pepper${seed}`, () => {
    const r = rng(seed);
    const len = 0.42 + r() * 0.08;
    const pts = [-1, -0.33, 0.33, 1].map(t => new THREE.Vector3((t * len) / 2, 0, (1 - t * t) * 0.07));
    return ribbon(pts, { radius: 0.05, flat: 0.5, segments: 32, radial: 12 });
  });

const basilLeaf = () =>
  memo('basil', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.22, 0);
    s.bezierCurveTo(-0.11, 0.15, 0.13, 0.13, 0.24, 0);
    s.bezierCurveTo(0.13, -0.13, -0.11, -0.15, -0.22, 0);
    const g = slab(s, { thickness: 0.022, bevel: 0.009, bevelSegments: 2, tessellate: 0.04, uvScale: [1 / 0.46, 1 / 0.28] });
    return deform(g, v => {
      v.y += 0.6 * v.z * v.z - 0.15 * v.x * v.x;
    });
  });

// ─────────────────────────────── slots ───────────────────────────────────
// Every topping owns its own ring/angle set so combinations stay tidy.

const ring = (n, r, offset = 0, extra = {}) =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * Math.PI * 2;
    return { p: [Math.cos(a) * r, 0, Math.sin(a) * r], r: [0, -a, 0], ...extra };
  });

// Rings give a readable base layout; jitter makes it look placed by hand.
const loose = { pos: 0.09, rot: Math.PI, tilt: 0.07, scale: 0.12 };
const slots = {
  salami: jitter([...ring(6, 0.8, 0.3), { p: [0.05, 0, -0.04], r: [0, 0.4, 0] }], 1, loose),
  ham: jitter(ring(4, 0.48, Math.PI / 4), 2, loose).map((s, i) => ({ ...s, seed: 1 + i })),
  tomatoSlices: jitter(ring(5, 0.5, Math.PI / 5), 3, loose),
  mushrooms: jitter(ring(6, 1.0, Math.PI / 6).map(s => ({ ...s, r: [0, s.r[1] + Math.PI / 2, 0] })), 4, { ...loose, rot: 0.5, scale: 0.18 }),
  pepper: jitter(ring(6, 0.66, Math.PI / 6), 5, { ...loose, rot: 0.8 }).map((s, i) => ({ ...s, seed: 10 + (i % 3) })),
  olives: jitter([...ring(5, 1.06, 0.2), { p: [-0.3, 0, 0.62] }, { p: [0.45, 0, -0.55] }], 6, { ...loose, pos: 0.12, tilt: 0.25, scale: 0.15 }),
  basil: jitter(ring(3, 0.24, Math.PI / 2), 7, { pos: 0.06, rot: 0.6, tilt: 0.15, scale: 0.15 }),
};

// ─────────────────────────────── component ───────────────────────────────

function Pieces({ items, geometry, material, y = 0 }) {
  return items.map((it, i) => (
    <mesh key={i} geometry={geometry(it)} material={material} position={[it.p[0], it.p[1] + y, it.p[2]]} rotation={it.r} scale={it.s ?? 1} castShadow receiveShadow />
  ));
}

export default function Pizza({ active, baked = false }) {
  const on = id => active.includes(id);
  // Base and cheese get their own material instances: they animate.
  const baseMat = useMemo(() => materials.pizzaBase(), []);
  const cheeseMat = useMemo(() => materials.cheese(), []);
  const mushroomMats = useMemo(() => [materials.mushroom(), materials.mushroomSkin()], []);
  const baseRef = useRef();
  const bake = useRef(baked ? 1 : 0);

  useFrame((_, dt) => {
    bake.current = approach(bake.current, baked ? 1 : 0, MOTION.rates.bake, dt);
    baseMat.userData.bake.value = bake.current;
    cheeseMat.userData.bake.value = bake.current;
    baseRef.current.scale.set(1 + bake.current * 0.01, 1 + bake.current * 0.1, 1 + bake.current * 0.01);
  });

  const sauceTop = TOP + (on('tomatoSauce') ? 0.05 : 0);
  const top = sauceTop + (on('cheese') ? 0.07 : 0);
  // Toppings lie at slightly increasing heights so overlaps never z-fight.
  const ty = id => top + 0.03 + Object.keys(slots).indexOf(id) * 0.008;

  return (
    <group>
      <mesh ref={baseRef} geometry={base()} material={baseMat} castShadow receiveShadow />
      <Layer active={on('tomatoSauce')} y={TOP + 0.025} drop={0.6}>
        <mesh geometry={sauce()} material={materials.tomatoSauce()} receiveShadow />
      </Layer>
      <Layer active={on('cheese')} y={sauceTop + 0.002} drop={0.6}>
        <mesh geometry={cheese()} material={cheeseMat} receiveShadow />
      </Layer>
      <Layer active={on('salami')} y={ty('salami')}>
        <Pieces items={slots.salami} geometry={it => disc('salami', 0.62, 0.1, 0.045, it.v)} material={materials.salami()} />
      </Layer>
      <Layer active={on('ham')} y={ty('ham')}>
        <Pieces items={slots.ham} geometry={it => hamPiece(it.seed)} material={materials.ham()} />
      </Layer>
      <Layer active={on('tomatoSlices')} y={ty('tomatoSlices')}>
        <Pieces items={slots.tomatoSlices} geometry={it => disc('tomato', 0.5, 0.08, 0.015, it.v)} material={materials.tomatoSlice()} />
      </Layer>
      <Layer active={on('mushrooms')} y={ty('mushrooms')}>
        <Pieces items={slots.mushrooms} geometry={mushroom} material={mushroomMats} />
      </Layer>
      <Layer active={on('pepper')} y={ty('pepper') + 0.02}>
        <Pieces items={slots.pepper} geometry={it => pepperStrip(it.seed)} material={materials.pepper()} />
      </Layer>
      <Layer active={on('olives')} y={ty('olives') + 0.03}>
        <Pieces items={slots.olives} geometry={olive} material={materials.olive()} />
      </Layer>
      <Layer active={on('basil')} y={ty('basil') + 0.04}>
        <Pieces items={slots.basil} geometry={basilLeaf} material={materials.basil()} />
      </Layer>
    </group>
  );
}
