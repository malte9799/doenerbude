import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from '../../materials/index.js';
import { blobShape, deform, merge, planarUV, ribbon, rng, slab, splitByNormal } from '../../geo.js';
import Layer from '../Layer.jsx';

// Döner im Fladenbrot, opened towards the viewer. Units: 1 = 10 cm.
// Fillings stack on the bottom half in a fixed order; the lid rests on the
// pile at an angle that follows the pile height.

const L = 2.4; // bread length (x)
const D = 1.3; // bread depth (z)
const FILL = { x: 0.95, z: 0.42 }; // half extents of the filling area

export const doenerLayers = [
  { id: 'meatVeal', h: 0.27, default: true, price: 0 },
  { id: 'lettuce', h: 0.07, default: true, price: 0 },
  { id: 'tomato', h: 0.03, default: true, price: 0 },
  { id: 'cucumber', h: 0.03, default: true, price: 0 },
  { id: 'redCabbage', h: 0.06, default: true, price: 0 },
  { id: 'whiteCabbage', h: 0.06, default: true, price: 0 },
  { id: 'onion', h: 0.035, default: true, price: 0 },
  { id: 'feta', h: 0.07, default: false, price: 1.0 },
  { id: 'garlicSauce', h: 0.03, default: true, price: 0 },
  { id: 'chili', h: 0.01, default: false, price: 0 },
];

// ─────────────────────────────── geometry ────────────────────────────────

const cache = {};
const memo = (key, make) => (cache[key] ??= make());

// One half of the flatbread: a pillow with a flat cut face (crumb, group 1)
// and a domed, seeded crust (group 0). Origin: centre of the cut face.
const breadHalf = () =>
  memo('bread', () => {
    const shape = blobShape({ w: L, h: D, p: 3.2, wobble: 0.025, seed: 4 });
    let g = slab(shape, { thickness: 0.3, bevel: 0.13, bevelSegments: 7, tessellate: 0.09, uvScale: 0.42 });
    g = deform(g, v => {
      const inside = Math.max(0, 1 - (v.x / (L / 2)) ** 2 - (v.z / (D / 2)) ** 2);
      if (v.y < 0) v.y -= 0.09 * inside; // belly
      else v.y -= 0.025 * inside; // slight pocket in the cut face
      v.y -= 0.15;
    });
    return splitByNormal(g, new THREE.Vector3(0, 1, 0), 0.75);
  });

const meatPiece = seed =>
  memo(`meat${seed}`, () => {
    const r = rng(seed);
    const w = 0.5 + r() * 0.14;
    const h = 0.22 + r() * 0.08;
    let g = slab(blobShape({ w, h, p: 2.3, wobble: 0.16, seed }), { thickness: 0.05, bevel: 0.02, bevelSegments: 3, tessellate: 0.04, uvScale: [1 / w, 1 / h] });
    const ph = r() * 6;
    const curl = 0.5 + r() * 0.5;
    return deform(g, v => {
      v.y += 0.04 * Math.sin(v.x * 10 + ph) + curl * v.x * v.x + 0.35 * v.z * v.x + 0.6 * v.z * v.z;
    });
  });

const lettuceLeaf = seed =>
  memo(`lettuce${seed}`, () => {
    const r = rng(seed);
    const w = 0.5 + r() * 0.15;
    const g = slab(blobShape({ w, h: 0.11, p: 2, wobble: 0.25, seed }), { thickness: 0.016, bevel: 0.006, bevelSegments: 2, tessellate: 0.035, uvScale: [1 / w, 1 / 0.11] });
    const ph = r() * 6;
    return deform(g, v => {
      v.y += 0.03 * Math.sin(v.x * 14 + ph) + 0.15 * v.x * v.x;
    });
  });

const halfMoon = () =>
  memo('halfMoon', () => slab(blobShape({ w: 0.44, h: 0.44, wobble: 0.015, seed: 8, part: 0.5 }), { thickness: 0.05, bevel: 0.016, uvScale: 1 / 0.44 }));

const roundSlice = () => memo('roundSlice', () => slab(blobShape({ w: 0.32, h: 0.32, wobble: 0.01, seed: 9 }), { thickness: 0.04, bevel: 0.014, uvScale: 1 / 0.32 }));

const onionArc = seed =>
  memo(`onion${seed}`, () => {
    const r = rng(seed);
    const g = new THREE.TorusGeometry(0.1 + r() * 0.06, 0.016, 10, 40, Math.PI * (1 + r() * 0.5));
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.6, 1);
    return g;
  });

// Shreds of cabbage: many thin curved ribbons merged into one mesh per layer.
const shreds = (seed, count) =>
  memo(`shreds${seed}`, () => {
    const r = rng(seed);
    const geos = [];
    for (let i = 0; i < count; i++) {
      const x = (r() * 2 - 1) * FILL.x * 0.95;
      const z = (r() * 2 - 1) * FILL.z * 0.9;
      const a = r() * Math.PI;
      const len = 0.14 + r() * 0.18;
      const dx = Math.cos(a) * len;
      const dz = Math.sin(a) * len;
      const bend = (r() - 0.5) * 0.5;
      const lift = r() * 0.04;
      const pts = [
        new THREE.Vector3(x - dx / 2, lift + r() * 0.015, z - dz / 2),
        new THREE.Vector3(x - dx / 6 - dz * bend * 0.5, lift + 0.015 + r() * 0.02, z - dz / 6 + dx * bend * 0.5),
        new THREE.Vector3(x + dx / 6 + dz * bend * 0.3, lift + 0.015 + r() * 0.02, z + dz / 6 - dx * bend * 0.3),
        new THREE.Vector3(x + dx / 2, lift + r() * 0.015, z + dz / 2),
      ];
      geos.push(ribbon(pts, { radius: 0.013, flat: 0.45, segments: 16, radial: 6 }));
    }
    return merge(geos);
  });

// Two loose, wavy lines of sauce running along the döner.
const drizzle = () =>
  memo('drizzle', () => {
    const lines = [
      { z: 0.12, amp: 0.1, freq: 4.2, ph: 0 },
      { z: -0.1, amp: 0.08, freq: 5.1, ph: 1.7 },
    ].map(({ z, amp, freq, ph }) => {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = (t * 2 - 1) * FILL.x * 0.85;
        pts.push(new THREE.Vector3(x, 0.015 * Math.sin(t * 17 + ph), z + amp * Math.sin(t * freq * Math.PI + ph)));
      }
      return ribbon(pts, { radius: 0.022, flat: 0.55, segments: 260, radial: 10 });
    });
    const g = merge(lines);
    planarUV(g, 0.8);
    return g;
  });

const fetaCube = () => memo('feta', () => new RoundedBoxGeometry(0.13, 0.11, 0.13, 3, 0.03));

const flake = () =>
  memo('flake', () => {
    const g = new THREE.IcosahedronGeometry(0.018, 0);
    g.scale(1.3, 0.35, 1);
    return g;
  });

// ─────────────────────────────── layouts ─────────────────────────────────
// Fixed, tidy arrangements (no randomness at runtime).

const meatLayout = (() => {
  const out = [];
  const r = rng(12);
  // Three tiers of shingled, curled slices; the front row leans over the edge.
  const tiers = [
    { rows: 3, cols: 6, y: 0.03, spread: 1 },
    { rows: 2, cols: 5, y: 0.1, spread: 0.85 },
    { rows: 1, cols: 4, y: 0.17, spread: 0.65 },
  ];
  tiers.forEach((tier, t) => {
    for (let row = 0; row < tier.rows; row++) {
      for (let col = 0; col < tier.cols; col++) {
        const fx = col / (tier.cols - 1) - 0.5;
        const fz = tier.rows === 1 ? 0 : row / (tier.rows - 1) - 0.5;
        const front = t === 0 && row === tier.rows - 1;
        out.push({
          seed: 1 + ((t * 7 + row * 3 + col) % 6),
          p: [fx * 1.7 * tier.spread + (r() - 0.5) * 0.08, tier.y + (col % 2) * 0.025, fz * 0.75 * tier.spread + (front ? 0.08 : 0)],
          r: [front ? 0.35 : (r() - 0.5) * 0.25, (r() - 0.5) * 0.7, (r() - 0.5) * 0.3],
        });
      }
    }
  });
  return out;
})();

const lettuceLayout = (() => {
  const out = [];
  const r = rng(22);
  for (let i = 0; i < 18; i++) {
    out.push({ seed: 30 + (i % 5), p: [-0.85 + (i % 6) * 0.34, 0.02 + r() * 0.03, -0.3 + Math.floor(i / 6) * 0.3], r: [0, r() * Math.PI, (r() - 0.5) * 0.3] });
  }
  return out;
})();

// Tomatoes and cucumbers lean out of the front, tilted towards the viewer.
const tomatoLayout = [-0.72, -0.24, 0.24, 0.72].map((x, i) => ({ p: [x, 0.04, FILL.z + 0.02], r: [0.7, (i - 1.5) * 0.08, 0] }));
const cucumberLayout = [-0.48, 0, 0.48].map((x, i) => ({ p: [x, 0.07, FILL.z - 0.1], r: [0.8, 0, (i - 1) * 0.1] }));

const onionLayout = (() => {
  const r = rng(44);
  return Array.from({ length: 7 }, (_, i) => ({ seed: 50 + i, p: [-0.75 + i * 0.25, 0.01, (r() - 0.5) * 0.5], r: [0, r() * 6.28, 0] }));
})();

const fetaLayout = (() => {
  const r = rng(66);
  return Array.from({ length: 10 }, (_, i) => ({ p: [-0.72 + (i % 5) * 0.36, 0.05, -0.12 + Math.floor(i / 5) * 0.24], r: [(r() - 0.5) * 0.5, r() * 1.5, (r() - 0.5) * 0.5] }));
})();

// ─────────────────────────────── component ───────────────────────────────

function Pieces({ layout, geometry, material }) {
  return layout.map((it, i) => <mesh key={i} geometry={geometry(it)} material={material} position={it.p} rotation={it.r} castShadow receiveShadow />);
}

function ChiliFlakes() {
  const count = 70;
  const onUpdate = mesh => {
    const r = rng(77);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      q.setFromEuler(new THREE.Euler(r() * 0.6, r() * 6.28, r() * 0.6));
      m.compose(new THREE.Vector3((r() * 2 - 1) * FILL.x * 0.9, r() * 0.02, (r() * 2 - 1) * FILL.z * 0.8), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.7 + r() * 0.6));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh args={[flake(), materials.chili(), count]} onUpdate={onUpdate} />;
}

export default function Doener({ active }) {
  const on = id => active.includes(id);
  const bread = breadHalf();
  const breadMats = useMemo(() => [materials.breadCrust(), materials.breadCrumb()], []);

  // Resting height of every layer = bread surface + all active layers below.
  const base = 0.4;
  let y = base;
  const ys = {};
  for (const l of doenerLayers) {
    ys[l.id] = y;
    if (on(l.id)) y += l.h;
  }
  const pile = y - base;

  const lid = useRef();
  const lidState = useRef({ y: base, a: 0.4 });
  useFrame((_, dt) => {
    const s = lidState.current;
    s.y = THREE.MathUtils.damp(s.y, base + pile * 0.45, 5, dt);
    s.a = THREE.MathUtils.damp(s.a, 0.32 + pile * 0.45, 5, dt);
    lid.current.position.y = s.y;
    lid.current.rotation.x = -s.a;
  });

  return (
    <group>
      {/* bottom half, cut face up */}
      <mesh geometry={bread} material={breadMats} position={[0, base, 0]} castShadow receiveShadow />

      {/* lid, hinged at the back edge */}
      <group ref={lid} position={[0, base, -D / 2 + 0.06]}>
        <mesh geometry={bread} material={breadMats} rotation={[Math.PI, 0, 0]} position={[0, 0.01, D / 2 - 0.06]} castShadow receiveShadow />
      </group>

      <Layer active={on('meatVeal')} y={ys.meatVeal}>
        <Pieces layout={meatLayout} geometry={it => meatPiece(it.seed)} material={materials.doenerMeat()} />
      </Layer>
      <Layer active={on('lettuce')} y={ys.lettuce}>
        <Pieces layout={lettuceLayout} geometry={it => lettuceLeaf(it.seed)} material={materials.lettuce()} />
      </Layer>
      <Layer active={on('tomato')} y={ys.tomato}>
        <Pieces layout={tomatoLayout} geometry={halfMoon} material={materials.tomatoSlice()} />
      </Layer>
      <Layer active={on('cucumber')} y={ys.cucumber}>
        <Pieces layout={cucumberLayout} geometry={roundSlice} material={materials.cucumberSlice()} />
      </Layer>
      <Layer active={on('redCabbage')} y={ys.redCabbage}>
        <mesh geometry={shreds(101, 160)} material={materials.redCabbage()} castShadow receiveShadow />
      </Layer>
      <Layer active={on('whiteCabbage')} y={ys.whiteCabbage}>
        <mesh geometry={shreds(202, 160)} material={materials.whiteCabbage()} castShadow receiveShadow />
      </Layer>
      <Layer active={on('onion')} y={ys.onion}>
        <Pieces layout={onionLayout} geometry={it => onionArc(it.seed)} material={materials.onion()} />
      </Layer>
      <Layer active={on('feta')} y={ys.feta}>
        <Pieces layout={fetaLayout} geometry={fetaCube} material={materials.feta()} />
      </Layer>
      <Layer active={on('garlicSauce')} y={ys.garlicSauce}>
        <mesh geometry={drizzle()} material={materials.garlicSauce()} castShadow />
      </Layer>
      <Layer active={on('chili')} y={ys.chili}>
        <ChiliFlakes />
      </Layer>
    </group>
  );
}
