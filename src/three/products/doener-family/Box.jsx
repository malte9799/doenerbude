import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from '../../materials/index.js';
import { dfMaterials } from '../../materials/doener-family.js';
import { jitter, merge, rng } from '../../geo.js';
import Layer from '../Layer.jsx';
import { halfMoon, lettuceLeaf, meatPiece, memo } from '../doener/Doener.jsx';
import { Flakes, Pieces, drizzleGeo } from './shared.jsx';
import { rounded, superLathe } from './superLathe.js';

// Dönerbox: branded takeaway box, fries, meat on top, sauce, optional salad.

export const boxLayers = [
  { id: 'fries', default: true, price: 0 },
  { id: 'meatVeal', default: true, price: 0 },
  { id: 'lettuce', default: false, price: 0.5 },
  { id: 'tomato', default: false, price: 0.5 },
  { id: 'garlicSauce', default: true, price: 0 },
  { id: 'chili', default: false, price: 0 },
];

const H = 0.95; // box height
const FLOOR = 0.1;

// Tapered open tray: narrower at the bottom, folded-over rounded rim.
const tray = () =>
  memo('boxTray', () =>
    superLathe(
      [
        { pts: rounded([[0, 0], [0.8, 0], [1.0, H], [1.0, H + 0.03]], 0.1, 6), uRepeat: 1, vRepeat: 1 },
        { pts: rounded([[1.0, H + 0.03], [0.93, H + 0.05], [0.9, H], [0.78, FLOOR], [0, FLOOR]], 0.05, 5), uRepeat: 2, vRepeat: 1 },
      ],
      { a: 0.92, b: 0.66, p: 5, segs: 96 },
    ),
  );

const friesGeo = () =>
  memo('fries', () => {
    const r = rng(9);
    const geos = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < 46; i++) {
      const x = (r() * 2 - 1) * 0.6;
      const z = (r() * 2 - 1) * 0.3;
      const len = 0.62 + r() * 0.2;
      const g = new RoundedBoxGeometry(0.12 + r() * 0.02, len, 0.12 + r() * 0.02, 3, 0.04);
      // Longer sticks lean outwards a little, as if piled in the box.
      q.setFromEuler(new THREE.Euler(z * 0.5 + (r() - 0.5) * 0.25, r() * 6.28, -x * 0.4 + (r() - 0.5) * 0.25, 'YXZ'));
      m.compose(new THREE.Vector3(x, FLOOR + 0.05 + len / 2 + r() * 0.25, z), q, new THREE.Vector3(1, 1, 1));
      geos.push(g.applyMatrix4(m));
    }
    return merge(geos);
  });

const meatLayout = jitter(
  [[-0.6, 0, 0.12], [-0.2, 0.05, -0.15], [0.25, 0, 0.15], [0.62, 0.04, -0.08], [0.02, 0.12, 0.06]].map(([x, y, z], i) => ({ seed: 1 + i, p: [x, y, z], r: [0.1, i * 1.3, 0] })),
  15,
  { pos: 0.06, y: 0.02, rot: 0.4, tilt: 0.1, scale: 0.1 },
);
const lettuceLayout = jitter(
  [-0.5, 0, 0.5].map((x, i) => ({ seed: 30 + i, p: [x, 0, -0.42], r: [-0.55, i * 0.3 - 0.3, 0] })),
  22,
  { pos: 0.05, rot: 0.3, tilt: 0.15, scale: 0.12 },
);
const tomatoLayout = jitter(
  [-0.35, 0.3, 0.7].map((x, i) => ({ p: [x, 0.02, 0.45], r: [0.5, i * 0.5, 0] })),
  33,
  { pos: 0.05, rot: 0.5, tilt: 0.14, scale: 0.12 },
);

export default function Box({ active }) {
  const on = id => active.includes(id);
  const top = on('fries') ? FLOOR + 0.95 : FLOOR + 0.12;
  const meatY = top;
  const saucY = meatY + (on('meatVeal') ? 0.2 : 0.06);
  const seatY = on('meatVeal') ? meatY + 0.08 : top;
  return (
    <group rotation={[0, 0.3, 0]}>
      <mesh geometry={tray()} material={[dfMaterials.boxPrint(), dfMaterials.kraft()]} castShadow receiveShadow />

      <Layer active={on('fries')} y={0}>
        <mesh geometry={friesGeo()} material={dfMaterials.fries()} castShadow receiveShadow />
      </Layer>
      <Layer active={on('meatVeal')} y={meatY}>
        <Pieces layout={meatLayout} geometry={it => meatPiece(it.seed)} material={materials.doenerMeat()} s={0.85} order="XYZ" />
      </Layer>
      <Layer active={on('lettuce')} y={top + 0.1}>
        <Pieces layout={lettuceLayout} geometry={it => lettuceLeaf(it.seed)} material={materials.lettuce()} s={0.9} order="XYZ" />
      </Layer>
      <Layer active={on('tomato')} y={seatY + 0.05}>
        <Pieces layout={tomatoLayout} geometry={halfMoon} material={materials.tomatoSlice()} s={0.85} order="XYZ" />
      </Layer>
      <Layer active={on('garlicSauce')} y={saucY}>
        <mesh geometry={drizzleGeo('box', { halfW: 0.62, amp: 0.34, lines: 2, radius: 0.04, freq: 3.4 })} material={materials.garlicSauce()} castShadow />
      </Layer>
      <Layer active={on('chili')} y={saucY + 0.04}>
        <Flakes rx={0.6} rz={0.3} material={materials.chili()} count={28} />
      </Layer>
    </group>
  );
}
