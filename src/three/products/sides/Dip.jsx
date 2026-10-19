import { useMemo } from 'react';
import { sides } from '../../materials/sides.js';
import { blobShape, deform, slab } from '../../geo.js';
import { lathe, memo } from './shared.js';
import * as THREE from 'three';

// Sauce dip cup: small clear cup with a variant-coloured sticker band, a
// swirled dome of sauce and a lid leaning behind it. variant: garlic (white),
// herb (white + herbs), hot (red), cocktail (pink).

const cupOuter = () =>
  memo('dipOuter', () =>
    lathe([
      [0.001, 0],
      [0.3, 0],
      [0.37, 0.04],
      [0.5, 0.56],
      [0.54, 0.6],
      [0.5, 0.63],
    ]),
  );
const cupInner = () =>
  memo('dipInner', () =>
    lathe([
      [0.48, 0.62],
      [0.47, 0.56],
      [0.35, 0.1],
      [0.001, 0.07],
    ]),
  );
// Sticker band follows the cone of the cup.
const band = () => memo('dipBand', () => lathe([[0.405, 0.15], [0.47, 0.42]], { smooth: false, segments: 72 }));

// Sauce with a swirl on top, rising over the rim.
const sauce = () =>
  memo('dipSauce', () => {
    const g = lathe(
      [
        [0.001, 0.08],
        [0.3, 0.08],
        [0.45, 0.5],
        [0.47, 0.58],
        [0.4, 0.66],
        [0.25, 0.72],
        [0.12, 0.745],
        [0.001, 0.76],
      ],
      { segments: 72, samples: 50 },
    );
    g.rotateY(Math.PI);
    return deform(g, p => {
      const r = Math.hypot(p.x, p.z);
      if (p.y > 0.6 && r > 1e-3) {
        const a = Math.atan2(p.x, p.z);
        p.y += 0.035 * Math.sin(a * 2 + r * 18) * Math.min(1, r * 4);
      }
    });
  });

const leaf = i =>
  memo(`dipLeaf${i}`, () => {
    const g = slab(blobShape({ w: 0.3, h: 0.15, p: 2.4, wobble: 0.04, seed: i }), { thickness: 0.02, bevel: 0.008, bevelSegments: 2, uvScale: 1 });
    return deform(g, p => void (p.y += 1.2 * p.z * p.z + 0.4 * p.x * p.x));
  });

const chili = () =>
  memo('dipChili', () => {
    const g = new THREE.CapsuleGeometry(0.06, 0.3, 6, 14);
    return deform(g, p => {
      const t = (p.y + 0.21) / 0.42;
      p.x *= 1 - 0.5 * t * t;
      p.z *= 1 - 0.5 * t * t;
      p.x += 0.12 * t * t;
    });
  });

const lid = () => memo('dipLid', () => slab(blobShape({ w: 1.12, h: 1.12, wobble: 0.01, seed: 1, points: 56 }), { thickness: 0.05, bevel: 0.02, bevelSegments: 3, uvScale: 1 }));

const hashVariant = () => {
  try {
    return new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('v');
  } catch {
    return null;
  }
};

export default function Dip({ variant }) {
  const v = ['garlic', 'herb', 'hot', 'cocktail'].includes(variant) ? variant : (hashVariant() ?? 'garlic');
  const key = ['garlic', 'herb', 'hot', 'cocktail'].includes(v) ? v : 'garlic';
  const m = useMemo(() => ({ cup: sides.cupClear(), sauce: sides.sauce(key), band: sides.dipBand(key), herb: sides.herb(), chili: sides.chiliPod(), lid: sides.cupClear() }), [key]);
  return (
    <group>
      <mesh geometry={sauce()} material={m.sauce} castShadow receiveShadow />
      <mesh geometry={cupInner()} material={m.cup} renderOrder={2} />
      <mesh geometry={cupOuter()} material={m.cup} renderOrder={2} />
      <mesh geometry={band()} material={m.band} castShadow />
      {(key === 'herb' || key === 'garlic') &&
        [0, 1, 2].map(i => (
          <mesh key={i} geometry={leaf(i + 1)} material={m.herb} position={[Math.sin(i * 2.1 + 0.5) * 0.14, 0.74, Math.cos(i * 2.1 + 0.5) * 0.14]} rotation={[0, i * 2.1, 0.1]} scale={0.7} />
        ))}
      {key === 'hot' && <mesh geometry={chili()} material={m.chili} position={[0, 0.82, 0]} rotation={[0, 0.4, 1.35]} castShadow />}
      {key === 'cocktail' &&
        [0, 1].map(i => (
          <mesh key={i} geometry={leaf(i + 4)} material={m.herb} position={[0.05 + i * 0.1, 0.83, 0.02 - i * 0.08]} rotation={[0, i * 2.6, 0.1]} />
        ))}
    </group>
  );
}
