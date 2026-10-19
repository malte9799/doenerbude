import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from '../../materials/index.js';
import { dfMaterials } from '../../materials/doener-family.js';
import { jitter, merge, planarUV, rng, smoothNormals } from '../../geo.js';
import Layer from '../Layer.jsx';
import { halfMoon, lettuceLeaf, meatPiece, memo, onionRing, roundSlice } from '../doener/Doener.jsx';
import { Pieces } from './shared.jsx';
import { rounded, superLathe } from './superLathe.js';

// Dönerteller: plate with rice (or fries), meat, salad, tomato / cucumber and
// two sauce dollops. Units: 1 = 10 cm, plate Ø 3.4.

export const tellerLayers = [
  { id: 'rice', default: true, price: 0 },
  { id: 'fries', default: false, price: 0 },
  { id: 'meatVeal', default: true, price: 0 },
  { id: 'lettuce', default: true, price: 0 },
  { id: 'tomato', default: true, price: 0 },
  { id: 'cucumber', default: true, price: 0 },
  { id: 'onion', default: true, price: 0 },
  { id: 'garlicSauce', default: true, price: 0 },
];

const FLOOR = 0.1;
const MOUND = { x: -0.45, z: 0.02, rx: 0.72, rz: 0.66, h: 0.42 };

const plate = () =>
  memo('plate', () =>
    superLathe(
      [
        { pts: rounded([[0, 0], [0.6, 0], [0.99, 0.19], [1, 0.24]], 0.05, 5) },
        { pts: rounded([[1, 0.24], [0.97, 0.26], [0.91, 0.21]], 0.02, 4) },
        { pts: rounded([[0.91, 0.21], [0.72, 0.12], [0, FLOOR]], 0.1, 6) },
      ],
      { a: 1.7, b: 1.7, p: 2, segs: 96 },
    ),
  );

// Rice: a dome of small grains over a pale core.
function Rice() {
  const count = 760;
  const onUpdate = mesh => {
    const r = rng(5);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    const A = new THREE.Color('#FFF8E4');
    const B = new THREE.Color('#F4DFA0');
    for (let i = 0; i < count; i++) {
      const th = r() * Math.PI * 2;
      const ph = Math.acos(r() * 0.97);
      const f = i < 120 ? 0.6 + r() * 0.3 : 0.93 + r() * 0.1;
      const x = MOUND.x + Math.sin(ph) * Math.cos(th) * MOUND.rx * f;
      const z = MOUND.z + Math.sin(ph) * Math.sin(th) * MOUND.rz * f;
      const y = FLOOR + Math.cos(ph) * MOUND.h * f + 0.01;
      q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6));
      const s = 0.85 + r() * 0.4;
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.copy(A).lerp(B, r() * r()));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  };
  const grain = memo('grain', () => {
    const g = new THREE.IcosahedronGeometry(0.05, 2);
    g.scale(1.9, 0.62, 0.62);
    return g;
  });
  return (
    <group>
      <instancedMesh args={[grain, dfMaterials.rice(), count]} onUpdate={onUpdate} castShadow receiveShadow />
      <mesh position={[MOUND.x, FLOOR, MOUND.z]} scale={[MOUND.rx * 0.9, MOUND.h * 0.88, MOUND.rz * 0.9]} material={dfMaterials.rice()}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

// A pile of fries lying down on the left.
const friesGeo = () =>
  memo('tellerFries', () => {
    const r = rng(12);
    const geos = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < 30; i++) {
      const row = i % 3;
      const x = MOUND.x + (r() * 2 - 1) * 0.35;
      const z = MOUND.z + (r() * 2 - 1) * 0.5;
      const len = 0.62 + r() * 0.2;
      const g = new RoundedBoxGeometry(len, 0.12 + r() * 0.02, 0.12 + r() * 0.02, 3, 0.04);
      q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, (r() - 0.5) * 1.6 + 0.2, (r() - 0.5) * 0.3, 'YXZ'));
      const y = FLOOR + 0.07 + row * 0.12 + (1 - Math.min(1, ((x - MOUND.x) / 0.4) ** 2 + ((z - MOUND.z) / 0.55) ** 2)) * 0.07;
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1));
      geos.push(g.applyMatrix4(m));
    }
    return merge(geos);
  });

// Soft sauce dollop with a little swirled peak.
const dollops = () =>
  memo('dollops2', () => {
    const geos = [
      [0.15, 1.05, 0.2],
      [0.75, 0.9, 0.17],
    ].flatMap(([x, z, r]) => {
      const base = new THREE.SphereGeometry(r, 32, 16);
      base.scale(1.1, 0.42, 1);
      base.translate(x, FLOOR + r * 0.38, z);
      const mid = new THREE.SphereGeometry(r * 0.62, 24, 12);
      mid.scale(1, 0.55, 1);
      mid.translate(x + 0.01, FLOOR + r * 0.85, z);
      const tip = new THREE.SphereGeometry(r * 0.3, 16, 8);
      tip.scale(0.8, 0.9, 0.8);
      tip.translate(x + 0.02, FLOOR + r * 1.3, z);
      return [base, mid, tip];
    });
    const g = merge(geos);
    planarUV(g, 0.8);
    return smoothNormals(g);
  });

const meatItems = hasRice =>
  jitter(
    [[-0.78, 0.1], [-0.45, -0.18], [-0.1, 0.12], [-0.6, 0.3], [-0.25, -0.3], [0.15, -0.02], [-0.8, -0.2]].map(([x, z], i) => {
      const dome = hasRice ? Math.max(0, 1 - ((x - MOUND.x) / MOUND.rx) ** 2 - ((z - MOUND.z) / MOUND.rz) ** 2) * MOUND.h * 0.85 : 0;
      return { seed: 1 + i, p: [x, FLOOR + 0.1 + dome + (i > 4 ? 0.06 : 0), z], r: [x - MOUND.x < 0 ? 0.1 : -0.2, i * 1.2, (z > 0 ? -1 : 1) * 0.2] };
    }),
    15,
    { pos: 0.05, y: 0.02, rot: 0.4, tilt: 0.08, scale: 0.1 },
  );
const lettuceLayout = jitter(
  [[0.55, -0.55], [0.95, -0.25], [0.45, -0.05]].map(([x, z], i) => ({ seed: 30 + i, p: [x, FLOOR + 0.06 + i * 0.03, z], r: [0.08, i * 1.1 + 0.3, 0.05] })),
  22,
  { pos: 0.05, y: 0.02, rot: 0.4, tilt: 0.12, scale: 0.12 },
);
const tomatoLayout = jitter(
  [[0.45, 0.5], [0.85, 0.35]].map(([x, z], i) => ({ p: [x, FLOOR + 0.12, z], r: [0.3, i * 1.4 - 0.4, 0.1] })),
  33,
  { pos: 0.04, rot: 0.4, tilt: 0.14, scale: 0.12 },
);
const cucumberLayout = jitter(
  [[0.7, 0.62], [0.25, 0.72], [1.0, 0.1]].map(([x, z], i) => ({ p: [x, FLOOR + 0.17, z], r: [0.15, i, 0.05] })),
  34,
  { pos: 0.04, rot: 0.4, tilt: 0.12, scale: 0.1 },
);
const onionLayout = jitter(
  [[0.6, -0.3], [0.9, 0.05]].map(([x, z], i) => ({ seed: 50 + i, p: [x, FLOOR + 0.22, z], r: [0, i * 1.7, 0] })),
  44,
  { pos: 0.04, rot: 1, tilt: 0.2, scale: 0.12 },
);

export default function Teller({ active }) {
  const on = id => active.includes(id);
  const bed = on('rice') || on('fries');
  const meat = meatItems(on('rice') || on('fries'));
  // Meat and rice share the left half; fries sit lower than rice.
  const meatY = on('rice') ? 0 : on('fries') ? 0.12 : 0;
  return (
    <group rotation={[0, 0.15, 0]}>
      <mesh geometry={plate()} material={[dfMaterials.plate(), dfMaterials.plateRim(), dfMaterials.plate()]} castShadow receiveShadow />

      <Layer active={on('rice')} y={0}>
        <Rice />
      </Layer>
      <Layer active={on('fries')} y={0}>
        <mesh geometry={friesGeo()} material={dfMaterials.fries()} castShadow receiveShadow />
      </Layer>
      <Layer active={on('meatVeal')} y={bed ? meatY : 0}>
        <Pieces layout={meat} geometry={it => meatPiece(it.seed)} material={materials.doenerMeat()} s={0.9} order="XYZ" />
      </Layer>
      <Layer active={on('lettuce')} y={0}>
        <Pieces layout={lettuceLayout} geometry={it => lettuceLeaf(it.seed)} material={materials.lettuce()} s={1} order="XYZ" />
      </Layer>
      <Layer active={on('tomato')} y={0}>
        <Pieces layout={tomatoLayout} geometry={halfMoon} material={materials.tomatoSlice()} s={0.95} order="XYZ" />
      </Layer>
      <Layer active={on('cucumber')} y={0}>
        <Pieces layout={cucumberLayout} geometry={roundSlice} material={materials.cucumberSlice()} s={0.95} order="XYZ" />
      </Layer>
      <Layer active={on('onion')} y={0}>
        <Pieces layout={onionLayout} geometry={it => onionRing(it.seed)} material={materials.onion()} s={0.95} order="XYZ" />
      </Layer>
      <Layer active={on('garlicSauce')} y={0}>
        <mesh geometry={dollops()} material={materials.garlicSauce()} castShadow />
      </Layer>
    </group>
  );
}
