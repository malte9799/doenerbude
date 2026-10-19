import { useMemo } from 'react';
import * as THREE from 'three';
import { sides } from '../../materials/sides.js';
import { blobShape, deform, slab } from '../../geo.js';
import { useI18n } from '../../../i18n/index.jsx';
import { lathe, memo } from './shared.js';

// Drinks. Fictional, generic packaging printed with the house brand.
// 1 unit = 10 cm: cup 11 cm, can 13 cm, bottles 28 cm.

const useName = id => {
  const i18n = useI18n();
  return i18n ? i18n.t(`products.${id}.name`) : id;
};

const disc = (key, d, t, seed = 1) => memo(key, () => slab(blobShape({ w: d, h: d, wobble: 0, seed, points: 56 }), { thickness: t, bevel: t * 0.4, bevelSegments: 3, uvScale: 1 / d }));

// ───────────────────────────────── Ayran ─────────────────────────────────

const cupBody = () =>
  memo('ayranCup', () =>
    lathe([
      [0.001, 0],
      [0.32, 0],
      [0.4, 0.03],
      [0.46, 0.4],
      [0.53, 1.1],
      [0.56, 1.14],
      [0.54, 1.18],
      [0.4, 1.12],
    ]),
  );
const tab = () => memo('tab', () => slab(blobShape({ w: 0.22, h: 0.14, p: 2.4, wobble: 0.04, seed: 5 }), { thickness: 0.04, bevel: 0.015, bevelSegments: 2, uvScale: 1 }));

export function Ayran() {
  const name = useName('ayran');
  const m = useMemo(() => ({ cup: sides.ayranCup(name), foil: sides.foil(), edge: sides.metal() }), [name]);
  return (
    <group>
      <mesh geometry={cupBody()} material={m.cup} castShadow receiveShadow />
      <mesh geometry={disc('foilDisc', 1.1, 0.06)} material={m.foil} position={[0, 1.16, 0]} castShadow />
      <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.55, 0.04, 10, 56]} />
        <primitive object={m.edge} attach="material" />
      </mesh>
      <mesh geometry={tab()} material={m.edge} position={[0.36, 1.21, 0.22]} rotation={[0.1, -0.6, 0.12]} castShadow />
    </group>
  );
}

// ───────────────────────────────── Cola ──────────────────────────────────

const canBody = () =>
  memo('can', () =>
    lathe(
      [
        [0.001, 0.02],
        [0.3, 0.02],
        [0.38, 0.06],
        [0.42, 0.14],
        [0.435, 0.3],
        [0.435, 1.0],
        [0.42, 1.14],
        [0.38, 1.22],
        [0.34, 1.26],
        [0.3, 1.275],
      ],
      { segments: 80 },
    ),
  );

export function Cola() {
  const name = useName('cola');
  const m = useMemo(() => ({ body: sides.can(name), metal: sides.metal() }), [name]);
  return (
    <group>
      <mesh geometry={canBody()} material={m.body} castShadow receiveShadow />
      <mesh geometry={disc('canLid', 0.64, 0.05)} material={m.metal} position={[0, 1.265, 0]} castShadow />
      <mesh position={[0, 1.27, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.33, 0.04, 10, 48]} />
        <primitive object={m.metal} attach="material" />
      </mesh>
      <mesh geometry={tab()} material={m.metal} position={[0.02, 1.31, 0.02]} rotation={[0, 0.4, 0]} scale={[1.3, 1, 1.3]} castShadow />
    </group>
  );
}

// ───────────────────────────── Bottles (shared) ───────────────────────────

const labelBand = (key, r, y0, y1) => memo(key, () => lathe([[r, y0], [r, y1]], { smooth: false, segments: 72 }));

// ───────────────────────────────── Wasser ────────────────────────────────

const waterShell = () =>
  memo('waterShell', () =>
    lathe(
      [
        [0.001, 0.01],
        [0.3, 0],
        [0.4, 0.05],
        [0.45, 0.2],
        [0.46, 0.5],
        [0.46, 1.5],
        [0.44, 1.8],
        [0.36, 2.05],
        [0.22, 2.25],
        [0.19, 2.4],
        [0.2, 2.52],
      ],
      { segments: 72 },
    ),
  );
const waterFill = () =>
  memo('waterFill', () =>
    lathe(
      [
        [0.001, 0.03],
        [0.3, 0.03],
        [0.39, 0.08],
        [0.43, 0.22],
        [0.435, 0.5],
        [0.435, 1.5],
        [0.415, 1.78],
        [0.34, 2.0],
        [0.001, 2.0],
      ],
      { segments: 72 },
    ),
  );
const waterCap = () =>
  memo('waterCap', () =>
    deform(
      lathe(
        [
          [0.001, 2.46],
          [0.2, 2.46],
          [0.25, 2.5],
          [0.255, 2.62],
          [0.23, 2.72],
          [0.001, 2.74],
        ],
        { segments: 48 },
      ),
      p => {
        const a = Math.atan2(p.x, p.z);
        const r = Math.hypot(p.x, p.z);
        if (r > 1e-3 && p.y < 2.7) {
          const k = 1 + 0.025 * Math.cos(a * 22);
          p.x *= k;
          p.z *= k;
        }
      },
    ),
  );

export function Wasser() {
  const name = useName('wasser');
  const m = useMemo(() => ({ shell: sides.bottleClear(), fill: sides.water(), label: sides.label('water', name), cap: sides.capBlue() }), [name]);
  return (
    <group>
      <mesh geometry={waterFill()} material={m.fill} renderOrder={1} />
      <mesh geometry={waterShell()} material={m.shell} renderOrder={3} castShadow />
      <mesh geometry={labelBand('waterLabel', 0.465, 0.55, 1.55)} material={m.label} renderOrder={2} castShadow />
      <mesh geometry={waterCap()} material={m.cap} castShadow />
    </group>
  );
}

// ────────────────────────────────── Limo ─────────────────────────────────

const limoShell = () =>
  memo('limoShell', () =>
    lathe(
      [
        [0.001, 0.0],
        [0.3, 0.0],
        [0.42, 0.05],
        [0.47, 0.25],
        [0.47, 1.2],
        [0.43, 1.55],
        [0.3, 1.85],
        [0.19, 2.1],
        [0.16, 2.35],
        [0.17, 2.5],
        [0.2, 2.56],
        [0.18, 2.62],
      ],
      { segments: 72 },
    ),
  );
const limoFill = () =>
  memo('limoFill', () =>
    lathe(
      [
        [0.001, 0.03],
        [0.3, 0.03],
        [0.4, 0.08],
        [0.44, 0.25],
        [0.44, 1.2],
        [0.405, 1.55],
        [0.28, 1.84],
        [0.17, 2.05],
        [0.14, 2.2],
        [0.001, 2.2],
      ],
      { segments: 72 },
    ),
  );
const crown = () =>
  memo('crown', () =>
    deform(
      lathe(
        [
          [0.17, 2.53],
          [0.27, 2.5],
          [0.26, 2.57],
          [0.22, 2.62],
          [0.12, 2.65],
          [0.001, 2.65],
        ],
        { segments: 64 },
      ),
      p => {
        const a = Math.atan2(p.x, p.z);
        const r = Math.hypot(p.x, p.z);
        if (r > 1e-3 && p.y < 2.58) {
          const k = 1 + 0.06 * Math.cos(a * 21) * ((2.58 - p.y) / 0.08);
          p.x *= k;
          p.z *= k;
        }
      },
    ),
  );

export function Limo() {
  const name = useName('limo');
  const m = useMemo(() => ({ shell: sides.glassYellow(), fill: sides.lemonade(), label: sides.label('lemon', name), cap: sides.capRed() }), [name]);
  return (
    <group>
      <mesh geometry={limoFill()} material={m.fill} renderOrder={1} />
      <mesh geometry={limoShell()} material={m.shell} renderOrder={3} castShadow />
      <mesh geometry={labelBand('limoLabel', 0.482, 0.3, 1.3)} material={m.label} renderOrder={2} castShadow />
      <mesh geometry={crown()} material={m.cap} castShadow />
    </group>
  );
}
