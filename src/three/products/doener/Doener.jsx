import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from '../../materials/index.js';
import { blobShape, deform, jitter, merge, planarUV, ribbon, rng, slab, smoothNormals, splitByNormal } from '../../geo.js';
import Layer from '../Layer.jsx';

// Döner im Fladenbrot, opened towards the viewer. Units: 1 = 10 cm.
// Fluent style: few, big, plump pieces. Fillings stack on the bottom half in
// a fixed order; the lid rests on the pile at an angle that follows its height.

const L = 2.5; // bread length (x)
const D = 1.4; // bread depth (z)
const LID_ANGLE = 0.8; // fixed opening of the lid
const FILL_SHIFT = 0.13; // fillings sit towards the front of the pocket
const FILL = { x: 0.95, z: 0.45 }; // half extents of the filling area

export const doenerLayers = [
  { id: 'meatVeal', h: 0.3, default: true, price: 0 },
  { id: 'lettuce', h: 0.1, default: true, price: 0 },
  { id: 'tomato', h: 0.05, default: true, price: 0 },
  { id: 'cucumber', h: 0.04, default: true, price: 0 },
  { id: 'redCabbage', h: 0.07, default: true, price: 0 },
  { id: 'whiteCabbage', h: 0.07, default: true, price: 0 },
  { id: 'onion', h: 0.05, default: true, price: 0 },
  { id: 'feta', h: 0.1, default: false, price: 1.0 },
  { id: 'garlicSauce', h: 0, default: true, price: 0 },
  { id: 'chili', h: 0.02, default: false, price: 0 },
];

// ─────────────────────────────── geometry ────────────────────────────────

const cache = {};
const memo = (key, make) => (cache[key] ??= make());

// One half of the flatbread: a soft pillow with a flat cut face (crumb,
// group 1) and a domed, seeded crust (group 0). Origin: centre of the cut face.
const breadHalf = () =>
  memo('bread', () => {
    const shape = blobShape({ w: L, h: D, p: 2.5, wobble: 0.06, seed: 4 });
    let g = slab(shape, { thickness: 0.36, bevel: 0.16, bevelSegments: 8, tessellate: 0.09, uvScale: 0.42 });
    g = deform(g, v => {
      // Off-centre, uneven belly and a slightly wavy cut: hand-made bread.
      const inside = Math.max(0, 1 - ((v.x + 0.15) / (L / 2)) ** 2 - ((v.z - 0.05) / (D / 2)) ** 2);
      const lumps = 0.025 * Math.sin(v.x * 2.3 + 0.7) + 0.018 * Math.sin(v.z * 4.1 + v.x * 1.3);
      if (v.y < 0) v.y -= (0.14 + lumps) * inside; // belly
      else v.y += -0.03 * inside + 0.015 * Math.sin(v.x * 3.1 + v.z * 2.2); // wavy cut face
      v.y += 0.04 * Math.sin(v.x * 1.1 + 0.4) * 0.5 - 0.18; // gentle overall sag
    });
    return splitByNormal(g, new THREE.Vector3(0, 1, 0), 0.75);
  });

const meatPiece = seed =>
  memo(`meat${seed}`, () => {
    const r = rng(seed);
    const w = 0.75 + r() * 0.1;
    const h = 0.38 + r() * 0.07;
    const g = slab(blobShape({ w, h, p: 2.4, wobble: 0.12, seed }), { thickness: 0.09, bevel: 0.04, bevelSegments: 4, tessellate: 0.06, uvScale: [1 / w, 1 / h] });
    const ph = r() * 6;
    const curl = 0.3 + r() * 0.2;
    return deform(g, v => {
      v.y += 0.03 * Math.sin(v.x * 7 + ph) + curl * v.x * v.x + 0.4 * v.z * v.z;
    });
  });

const lettuceLeaf = seed =>
  memo(`lettuce${seed}`, () => {
    const r = rng(seed);
    const w = 0.72 + r() * 0.1;
    const h = 0.32;
    const g = slab(blobShape({ w, h, p: 2, wobble: 0.18, seed }), { thickness: 0.035, bevel: 0.014, bevelSegments: 3, tessellate: 0.04, uvScale: [1 / w, 1 / h] });
    const ph = r() * 6;
    return deform(g, v => {
      const edge = Math.min(1, Math.abs(v.z) / (h / 2));
      v.y += 0.05 * Math.sin(v.x * 13 + ph) * edge * edge + 0.5 * v.z * v.z + 0.12 * v.x * v.x;
    });
  });

const halfMoon = () =>
  memo('halfMoon', () => slab(blobShape({ w: 0.58, h: 0.58, wobble: 0.01, seed: 8, part: 0.5 }), { thickness: 0.09, bevel: 0.035, bevelSegments: 4, uvScale: 1 / 0.58 }));

const roundSlice = () =>
  memo('roundSlice', () => slab(blobShape({ w: 0.42, h: 0.42, wobble: 0.01, seed: 9 }), { thickness: 0.07, bevel: 0.028, bevelSegments: 4, uvScale: 1 / 0.42 }));

const onionRing = seed =>
  memo(`onion${seed}`, () => {
    const r = rng(seed);
    const g = new THREE.TorusGeometry(0.16 + r() * 0.04, 0.032, 14, 48, Math.PI * (1.3 + r() * 0.5));
    g.rotateX(Math.PI / 2);
    g.scale(1, 0.7, 1);
    return g;
  });

// Cabbage as thick, soft curls (a few dozen), merged into one mesh per layer.
const curls = (seed, count) =>
  memo(`curls${seed}`, () => {
    const r = rng(seed);
    const geos = [];
    const cols = Math.ceil(Math.sqrt(count * 2.2));
    const rows = Math.ceil(count / cols);
    for (let i = 0; i < count; i++) {
      const x = ((i % cols) / (cols - 1) - 0.5) * FILL.x * 1.8 + (r() - 0.5) * 0.12;
      const z = (Math.floor(i / cols) / Math.max(1, rows - 1) - 0.5) * FILL.z * 1.5 + (r() - 0.5) * 0.1;
      const a = r() * Math.PI;
      const len = 0.3 + r() * 0.15;
      const bend = 0.5 + r() * 0.4;
      const pts = [];
      for (let k = 0; k <= 4; k++) {
        const t = k / 4 - 0.5;
        const along = t * len;
        const side = bend * len * (0.25 - t * t);
        pts.push(new THREE.Vector3(x + Math.cos(a) * along - Math.sin(a) * side, 0.02 + r() * 0.025, z + Math.sin(a) * along + Math.cos(a) * side));
      }
      geos.push(ribbon(pts, { radius: 0.032, flat: 0.55, segments: 24, radial: 10 }));
    }
    return merge(geos);
  });

// Height of the bread's cut face (crumb) in bread-local coordinates; mirrors
// the deform in breadHalf so the sauce can follow the surface.
const crumbY = (x, z) => {
  const inside = Math.max(0, 1 - ((x + 0.15) / (L / 2)) ** 2 - ((z - 0.05) / (D / 2)) ** 2);
  return -0.03 * inside + 0.015 * Math.sin(x * 3.1 + z * 2.2) + 0.02 * Math.sin(x * 1.1 + 0.4);
};

// Thin, lumpy spread of sauce that follows the crumb (bread-local space).
const sauceSpread = seed =>
  memo(`spread${seed}`, () => {
    const g = slab(blobShape({ w: 1.95, h: 0.8, p: 2.6, wobble: 0.16, seed }), { thickness: 0.05, bevel: 0.022, bevelSegments: 4, tessellate: 0.07, uvScale: 0.6 });
    return deform(g, v => {
      const lump = 0.012 * Math.sin(v.x * 9 + seed) * Math.sin(v.z * 8 + seed * 2);
      v.y += crumbY(v.x, v.z) + 0.026 + lump;
    });
  });

// A few soft dollops that peek out of the front edge.
const sauceDollops = () =>
  memo('dollops', () => {
    const geos = [
      [-0.4, 0.6, 0.12],
      [0.3, 0.62, 0.15],
      [0.72, 0.56, 0.09],
    ].map(([x, z, r]) => {
      const g = new THREE.IcosahedronGeometry(r, 3);
      g.scale(1.5, 0.28, 1);
      g.translate(x, crumbY(x, 0.5) + 0.03, z);
      return g;
    });
    const g = merge(geos);
    planarUV(g, 0.8);
    return smoothNormals(g);
  });

const fetaCube = () => memo('feta', () => new RoundedBoxGeometry(0.2, 0.17, 0.2, 4, 0.06));

const flake = () =>
  memo('flake', () => {
    const g = new THREE.IcosahedronGeometry(0.035, 1);
    g.scale(1.3, 0.45, 1);
    return g;
  });

// ─────────────────────────────── layouts ─────────────────────────────────
// Fixed, tidy arrangements (no randomness at runtime).

const meatLayout = jitter(
  [
    ...[-0.72, -0.24, 0.24, 0.72].map((x, i) => ({ seed: 1 + i, p: [x, 0.05, i % 2 ? 0.0 : 0.2], r: [i % 2 ? 0.15 : 0.38, (i - 1.5) * 0.25, (i % 2 ? 1 : -1) * 0.12] })),
    ...[-0.48, 0, 0.48].map((x, i) => ({ seed: 5 + i, p: [x, 0.15, 0.02], r: [0.12, (1 - i) * 0.35, (i - 1) * 0.15] })),
  ],
  12,
  { pos: 0.08, y: 0.03, rot: 0.35, tilt: 0.08, scale: 0.12 },
);

const lettuceLayout = jitter(
  [-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => ({ seed: 30 + i, p: [x, 0.04, i % 2 ? -0.14 : 0.14], r: [i % 2 ? 0.1 : 0.3, (i - 2) * 0.3, 0] })),
  22,
  { pos: 0.08, y: 0.02, rot: 0.5, tilt: 0.15, scale: 0.15 },
);

// Tomatoes and cucumbers lean out of the front, tilted towards the viewer.
const tomatoLayout = jitter(
  [-0.62, -0.02, 0.6].map((x, i) => ({ p: [x, 0.05, FILL.z + 0.02], r: [0.65, (i - 1) * 0.1, 0] })),
  33,
  { pos: 0.05, y: 0.03, rot: 0.3, tilt: 0.16, scale: 0.12 },
);
const cucumberLayout = jitter(
  [-0.3, 0.32].map((x, i) => ({ p: [x, 0.08, FILL.z - 0.12], r: [0.75, 0, (i ? 1 : -1) * 0.12] })),
  34,
  { pos: 0.05, y: 0.02, rot: 0.4, tilt: 0.15, scale: 0.1 },
);

const onionLayout = jitter(
  [-0.6, -0.2, 0.2, 0.6].map((x, i) => ({ seed: 50 + i, p: [x, 0.02, i % 2 ? 0.12 : -0.12], r: [0, i * 1.7, 0] })),
  44,
  { pos: 0.1, y: 0.02, rot: 1, tilt: 0.25, scale: 0.15 },
);

const fetaLayout = jitter(
  Array.from({ length: 6 }, (_, i) => ({ p: [-0.55 + (i % 3) * 0.55, 0.08, -0.14 + Math.floor(i / 3) * 0.28] })),
  66,
  { pos: 0.12, y: 0.03, rot: Math.PI, tilt: 0.35, scale: 0.2 },
);

// ─────────────────────────────── component ───────────────────────────────

function Pieces({ layout, geometry, material }) {
  return layout.map((it, i) => (
    <mesh key={i} geometry={geometry(it)} material={material} position={it.p} rotation={it.r} scale={it.s ?? 1} castShadow receiveShadow />
  ));
}

function ChiliFlakes() {
  const count = 26;
  const onUpdate = mesh => {
    const r = rng(77);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      q.setFromEuler(new THREE.Euler(r() * 0.5, r() * 6.28, r() * 0.5));
      m.compose(new THREE.Vector3((r() * 2 - 1) * FILL.x * 0.85, r() * 0.02, (r() * 2 - 1) * FILL.z * 0.75), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + r() * 0.5));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh args={[flake(), materials.chili(), count]} onUpdate={onUpdate} castShadow />;
}

export default function Doener({ active }) {
  const on = id => active.includes(id);
  const bread = breadHalf();
  const breadMats = useMemo(() => [materials.breadCrust(), materials.breadCrumb()], []);

  // Resting height of every layer: the fillings are stuffed into the pocket,
  // so they only stack part of their thickness (pieces tuck into each other).
  const base = 0.5;
  let y = base + 0.03;
  const ys = {};
  for (const l of doenerLayers) {
    ys[l.id] = y;
    if (on(l.id)) y += l.h * 0.5;
  }

  const sauce = on('garlicSauce');
  const spread = sauceSpread(61);
  const spreadLid = sauceSpread(67);
  const sauceMat = materials.garlicSauce();

  return (
    <group>
      {/* bottom half, cut face up */}
      <group position={[0, base, 0]}>
        <mesh geometry={bread} material={breadMats} castShadow receiveShadow />
        <group visible={sauce}>
          <mesh geometry={spread} material={sauceMat} receiveShadow />
          <mesh geometry={sauceDollops()} material={sauceMat} castShadow />
        </group>
      </group>

      {/* lid, hinged at the back edge, resting at a fixed angle */}
      <group position={[0.03, base + 0.02, -D / 2 + 0.08]} rotation={[-LID_ANGLE, 0, 0]}>
        <group rotation={[Math.PI, 0.05, 0.035]} position={[0, 0.01, D / 2 - 0.08]}>
          <mesh geometry={bread} material={breadMats} castShadow receiveShadow />
          <group visible={sauce}>
            <mesh geometry={spreadLid} material={sauceMat} receiveShadow />
          </group>
        </group>
      </group>

      <group position={[0, 0, FILL_SHIFT]}>
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
        <mesh geometry={curls(101, 22)} material={materials.redCabbage()} castShadow receiveShadow />
      </Layer>
      <Layer active={on('whiteCabbage')} y={ys.whiteCabbage}>
        <mesh geometry={curls(202, 22)} material={materials.whiteCabbage()} castShadow receiveShadow />
      </Layer>
      <Layer active={on('onion')} y={ys.onion}>
        <Pieces layout={onionLayout} geometry={it => onionRing(it.seed)} material={materials.onion()} />
      </Layer>
      <Layer active={on('feta')} y={ys.feta}>
        <Pieces layout={fetaLayout} geometry={fetaCube} material={materials.feta()} />
      </Layer>
      <Layer active={on('chili')} y={ys.chili}>
        <ChiliFlakes />
      </Layer>
      </group>
    </group>
  );
}
