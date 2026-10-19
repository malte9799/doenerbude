import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { blobShape, deform, planarUV, ribbon, rng, slab } from '../../geo.js';
import Layer from '../Layer.jsx';

// Pizza, Ø 30 cm (3 units). Base → sauce → cheese → toppings in fixed slots.
// `baked` animates raw dough / pale cheese to a leopard-spotted crust.

const R = 1.5;
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
      [1.32, 0.005],
      [1.46, 0.04],
      [1.53, 0.13],
      [1.51, 0.25],
      [1.42, 0.31],
      [1.3, 0.28],
      [1.21, 0.18],
      [1.12, TOP + 0.005],
      [0.6, TOP],
      [0.001, TOP],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const pts = new THREE.SplineCurve(ctrl).getSpacedPoints(90);
    const segs = 160;
    const g = new THREE.LatheGeometry(pts, segs);

    // v per profile point: top centre 0 → rim start 0.55 → rim end 0.85 → underside centre 1.
    const outer = pts.reduce((m, p, i) => (p.x > pts[m].x ? i : m), 0);
    const rimStart = pts.findIndex((p, i) => i > outer && p.x < 1.18);
    const vs = pts.map((p, j) => {
      if (j >= rimStart) return 0.55 * (p.x / pts[rimStart].x);
      if (j >= outer) return 0.55 + 0.3 * ((rimStart - j) / (rimStart - outer));
      return 0.85 + 0.15 * (1 - p.x / pts[outer].x);
    });
    const uv = g.attributes.uv;
    for (let i = 0; i <= segs; i++) {
      for (let j = 0; j < pts.length; j++) uv.setY(i * pts.length + j, vs[j]);
    }
    // Lathe winds clockwise from above; flip u so the texture isn't mirrored.
    for (let k = 0; k < uv.count; k++) uv.setX(k, 1 - uv.getX(k));
    return g;
  });

const sauce = () => memo('sauce', () => slab(blobShape({ w: 2.44, h: 2.44, wobble: 0.025, seed: 3, points: 96 }), { thickness: 0.03, bevel: 0.012, uvScale: 0.42 }));

// Cheese is a dense grid; its outline, holes and melted relief all come from
// the cheese texture (alpha cut-out + displacement), so raw and baked match.
const CHEESE = 2.42;
const cheese = () =>
  memo('cheese', () => {
    const g = new THREE.PlaneGeometry(CHEESE, CHEESE, 240, 240);
    g.rotateX(-Math.PI / 2);
    return planarUV(g, 1 / CHEESE);
  });

const disc = (key, d, t, cup = 0) =>
  memo(key, () => {
    const g = slab(blobShape({ w: d, h: d, wobble: 0.015, seed: d * 100 }), { thickness: t, bevel: t * 0.35, tessellate: cup ? d / 10 : 0, uvScale: 1 / d });
    // Cupping: slices curl up at the rim (salami in the oven).
    return cup ? deform(g, v => void (v.y += cup * ((v.x * v.x + v.z * v.z) / (d * d / 4)))) : g;
  });

const olive = () =>
  memo('olive', () => {
    const g = new THREE.TorusGeometry(0.052, 0.022, 12, 28);
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.8, 1);
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
const mushroom = () => memo('mushroom', () => slab(mushroomShape(), { thickness: 0.045, bevel: 0.018, bevelSegments: 4, uvScale: 1 / 0.34 }));

const hamPiece = seed =>
  memo(`ham${seed}`, () => {
    let g = slab(blobShape({ w: 0.36, h: 0.3, p: 3, wobble: 0.12, seed }), { thickness: 0.025, bevel: 0.01, bevelSegments: 2, tessellate: 0.05, uvScale: 1 / 0.36 });
    return deform(g, v => {
      v.y += 0.04 * Math.sin(v.x * 9 + seed) * 0.5 + 0.12 * v.x * v.x;
    });
  });

const pepperStrip = seed =>
  memo(`pepper${seed}`, () => {
    const r = rng(seed);
    const len = 0.32 + r() * 0.08;
    const pts = [-1, -0.33, 0.33, 1].map((t, i) => new THREE.Vector3((t * len) / 2, 0, Math.sin(t * 1.4) * 0.05 + (i % 2) * 0.01));
    return ribbon(pts, { radius: 0.03, flat: 0.45, segments: 24, radial: 10 });
  });

const basilLeaf = seed =>
  memo(`basil${seed}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-0.14, 0);
    s.bezierCurveTo(-0.07, 0.09, 0.08, 0.08, 0.15, 0);
    s.bezierCurveTo(0.08, -0.08, -0.07, -0.09, -0.14, 0);
    let g = slab(s, { thickness: 0.012, bevel: 0.005, bevelSegments: 2, tessellate: 0.03, uvScale: [1 / 0.29, 1 / 0.18] });
    return deform(g, v => {
      v.y += 0.6 * v.z * v.z - 0.2 * v.x * v.x;
    });
  });

// ─────────────────────────────── slots ───────────────────────────────────
// Every topping owns its own ring/angle set so combinations stay tidy.

const ring = (n, r, offset = 0, extra = {}) => Array.from({ length: n }, (_, i) => {
  const a = offset + (i / n) * Math.PI * 2;
  return { p: [Math.cos(a) * r, 0, Math.sin(a) * r], r: [0, -a, 0], ...extra };
});

const slots = {
  salami: [...ring(8, 0.88, 0), ...ring(3, 0.36, Math.PI / 6)],
  ham: ring(6, 0.62, Math.PI / 6).map((s, i) => ({ ...s, seed: 1 + (i % 3) })),
  tomatoSlices: [...ring(6, 0.62, 0), { p: [0, 0, 0], r: [0, 0.4, 0] }],
  mushrooms: ring(8, 1.03, Math.PI / 8).map(s => ({ ...s, r: [0, s.r[1] + Math.PI / 2, 0] })),
  pepper: ring(8, 0.42, Math.PI / 8).map((s, i) => ({ ...s, seed: 10 + (i % 3), p: [s.p[0] * 1.6, 0, s.p[2] * 1.6] })),
  olives: [...ring(8, 1.1, Math.PI / 8), ...ring(4, 0.62, 0)],
  basil: [...ring(4, 0.3, Math.PI / 4).map((s, i) => ({ ...s, seed: i })), { p: [0, 0, 0], r: [0, 1, 0], seed: 4 }],
};

// ─────────────────────────────── component ───────────────────────────────

function Pieces({ items, geometry, material, y = 0 }) {
  return items.map((it, i) => (
    <mesh key={i} geometry={geometry(it)} material={material} position={[it.p[0], it.p[1] + y, it.p[2]]} rotation={it.r} castShadow receiveShadow />
  ));
}

export default function Pizza({ active, baked = false }) {
  const on = id => active.includes(id);
  // Base and cheese get their own material instances: they animate.
  const baseMat = useMemo(() => materials.pizzaBase(), []);
  const cheeseMat = useMemo(() => materials.cheese(), []);
  const baseRef = useRef();
  const bake = useRef(baked ? 1 : 0);

  useFrame((_, dt) => {
    bake.current = THREE.MathUtils.damp(bake.current, baked ? 1 : 0, 1.6, dt);
    baseMat.userData.bake.value = bake.current;
    cheeseMat.userData.bake.value = bake.current;
    baseRef.current.scale.set(1 + bake.current * 0.01, 1 + bake.current * 0.12, 1 + bake.current * 0.01);
  });

  const s = TOP + 0.015; // sauce centre height
  const top = TOP + (on('tomatoSauce') ? 0.03 : 0) + (on('cheese') ? 0.045 : 0);
  // Toppings lie at slightly increasing heights so overlaps never z-fight.
  const ty = id => top + 0.012 + Object.keys(slots).indexOf(id) * 0.004;

  return (
    <group>
      <mesh ref={baseRef} geometry={base()} material={baseMat} castShadow receiveShadow />
      <Layer active={on('tomatoSauce')} y={s} drop={0.6}>
        <mesh geometry={sauce()} material={materials.tomatoSauce()} receiveShadow />
      </Layer>
      <Layer active={on('cheese')} y={TOP + (on('tomatoSauce') ? 0.03 : 0) + 0.002} drop={0.6}>
        <mesh geometry={cheese()} material={cheeseMat} receiveShadow />
      </Layer>
      <Layer active={on('salami')} y={ty('salami')}>
        <Pieces items={slots.salami} geometry={() => disc('salami', 0.5, 0.05, 0.035)} material={materials.salami()} />
      </Layer>
      <Layer active={on('ham')} y={ty('ham')}>
        <Pieces items={slots.ham} geometry={it => hamPiece(it.seed)} material={materials.ham()} />
      </Layer>
      <Layer active={on('tomatoSlices')} y={ty('tomatoSlices')}>
        <Pieces items={slots.tomatoSlices} geometry={() => disc('tomato', 0.4, 0.04)} material={materials.tomatoSlice()} />
      </Layer>
      <Layer active={on('mushrooms')} y={ty('mushrooms')}>
        <MushroomPieces items={slots.mushrooms} />
      </Layer>
      <Layer active={on('pepper')} y={ty('pepper') + 0.01}>
        <Pieces items={slots.pepper} geometry={it => pepperStrip(it.seed)} material={materials.pepper()} />
      </Layer>
      <Layer active={on('olives')} y={ty('olives') + 0.015}>
        <Pieces items={slots.olives} geometry={olive} material={materials.olive()} />
      </Layer>
      <Layer active={on('basil')} y={ty('basil') + 0.02}>
        <Pieces items={slots.basil} geometry={it => basilLeaf(it.seed)} material={materials.basil()} />
      </Layer>
    </group>
  );
}

function MushroomPieces({ items }) {
  const mats = useMemo(() => [materials.mushroom(), materials.mushroomSkin()], []);
  return <Pieces items={items} geometry={mushroom} material={mats} />;
}

