import { materials } from '../../materials/index.js';
import { dfMaterials } from '../../materials/doener-family.js';
import { jitter } from '../../geo.js';
import Layer from '../Layer.jsx';
import { curls, fetaCube, halfMoon, lettuceLeaf, meatPiece, memo, onionRing, roundSlice, doenerLayers } from '../doener/Doener.jsx';
import { Flakes, Pieces, drizzleGeo, radial, stack } from './shared.jsx';
import { rounded, superLathe } from './superLathe.js';

// Dürüm: rolled yufka standing in its paper wrap, top open with the fillings
// piled in the opening. Same layers as the döner. Units: 1 = 10 cm.

export const duerumLayers = doenerLayers.map(l => ({ ...l }));

const TOP = 2.1; // rim height of the roll
const FILL_Y = 1.9; // where the fillings start in the opening

const roll = () =>
  memo('duerumRoll', () =>
    superLathe(
      [{ pts: rounded([[0, 0], [0.5, 0], [0.62, TOP], [0.54, TOP + 0.01], [0.46, 1.4], [0, 1.3]], 0.1, 6), uRepeat: 3, vRepeat: 2.5 }],
      {
        segs: 72,
        fn: v => {
          const ang = Math.atan2(v.x, v.z);
          const k = 1 + 0.035 * Math.sin(ang * 2 + v.y * 1.4) + 0.02 * Math.sin(ang * 3 - v.y * 2.7 + 1) + 0.03 * Math.max(0, Math.sin(ang - 1.2)) * (v.y / TOP);
          v.x *= k;
          v.z *= k;
          // Uneven rim of a hand-rolled wrap.
          if (v.y > TOP - 0.15) v.y += 0.045 * Math.sin(ang * 3 + 0.5) + 0.02 * Math.sin(ang * 7);
        },
      },
    ),
  );

// Paper cuff around the lower half, with a folded-down, ragged top edge.
const paper = () =>
  memo('duerumPaper', () =>
    superLathe([{ pts: rounded([[0, 0], [0.58, 0], [0.68, 1.15], [0.78, 1.3], [0.72, 1.4]], 0.07, 6), uRepeat: 1, vRepeat: 1 }], {
      segs: 72,
      fn: v => {
        const ang = Math.atan2(v.x, v.z);
        const k = 1 + 0.03 * Math.sin(ang * 9 + v.y * 4) + 0.025 * Math.sin(ang * 5 - v.y * 2) + 0.03 * Math.sin(ang * 13 + 2) * (v.y / 1.4);
        v.x *= k;
        v.z *= k;
        if (v.y > 1.1) v.y += 0.07 * Math.sin(ang * 4 + 1) - 0.1 * Math.max(0, Math.cos(ang)) ;
      },
    }),
  );

const sauceMesh = () => drizzleGeo('duerum', { halfW: 0.34, amp: 0.3, lines: 2, radius: 0.035, freq: 3.4 });

const lay = (n, rad, pitch, seed, opts) => radial(n, rad, 0, pitch, { seed, ...opts });
const L = {
  meat: lay(6, 0.2, -0.7, 1),
  lettuce: lay(5, 0.28, -1.0, 11),
  tomato: lay(3, 0.3, -0.9, 21, { from: 0.3, to: Math.PI - 0.3 }),
  cucumber: lay(3, 0.3, -0.8, 31, { from: Math.PI + 0.2, to: Math.PI * 2 - 0.2 }),
  onion: jitter([[-0.15, 0, 0.1], [0.15, 0, -0.12], [0.02, 0, 0.2]].map(([x, y, z], i) => ({ seed: 50 + i, p: [x, y, z], r: [0, i * 1.7, 0] })), 44, { pos: 0.06, rot: 1, tilt: 0.3, scale: 0.15 }),
  feta: jitter([[-0.18, 0, -0.05], [0.15, 0, 0.12], [0.1, 0, -0.18], [-0.05, 0, 0.2]].map(([x, y, z]) => ({ p: [x, y, z] })), 66, { pos: 0.05, rot: Math.PI, tilt: 0.4, scale: 0.2 }),
};

export default function Duerum({ active }) {
  const on = id => active.includes(id);
  const ys = stack(duerumLayers, active, FILL_Y, 0.5);
  return (
    <group rotation={[0.07, 0.35, -0.06]}>
      <mesh geometry={roll()} material={dfMaterials.yufka()} castShadow receiveShadow />
      <mesh geometry={paper()} material={dfMaterials.paper()} castShadow receiveShadow />

      <Layer active={on('meatVeal')} y={ys.meatVeal}>
        <Pieces layout={L.meat} geometry={it => meatPiece(it.seed)} material={materials.doenerMeat()} s={0.62} />
      </Layer>
      <Layer active={on('lettuce')} y={ys.lettuce}>
        <Pieces layout={L.lettuce} geometry={it => lettuceLeaf(it.seed)} material={materials.lettuce()} s={0.62} />
      </Layer>
      <Layer active={on('tomato')} y={ys.tomato}>
        <Pieces layout={L.tomato} geometry={halfMoon} material={materials.tomatoSlice()} s={0.78} />
      </Layer>
      <Layer active={on('cucumber')} y={ys.cucumber}>
        <Pieces layout={L.cucumber} geometry={roundSlice} material={materials.cucumberSlice()} s={0.8} />
      </Layer>
      <Layer active={on('redCabbage')} y={ys.redCabbage}>
        <mesh geometry={curls(301, 12, 0.5, 0.4)} material={materials.redCabbage()} scale={0.8} castShadow receiveShadow />
      </Layer>
      <Layer active={on('whiteCabbage')} y={ys.whiteCabbage}>
        <mesh geometry={curls(302, 12, 0.5, 0.4)} material={materials.whiteCabbage()} scale={0.8} castShadow receiveShadow />
      </Layer>
      <Layer active={on('onion')} y={ys.onion}>
        <Pieces layout={L.onion} geometry={it => onionRing(it.seed)} material={materials.onion()} s={0.8} />
      </Layer>
      <Layer active={on('feta')} y={ys.feta}>
        <Pieces layout={L.feta} geometry={fetaCube} material={materials.feta()} s={0.9} />
      </Layer>
      <Layer active={on('garlicSauce')} y={ys.garlicSauce + 0.05}>
        <mesh geometry={sauceMesh()} material={materials.garlicSauce()} castShadow />
      </Layer>
      <Layer active={on('chili')} y={ys.chili + 0.1}>
        <Flakes rx={0.4} rz={0.4} material={materials.chili()} />
      </Layer>
    </group>
  );
}
