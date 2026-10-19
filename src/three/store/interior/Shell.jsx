import { useMemo } from 'react';
import * as THREE from 'three';
import { intMaterials as M } from '../../materials/store-interior.js';
import { jitter, rng } from '../../geo.js';
import { STORE } from '../layout.js';
import { BoxAt, Box, Cyl, Rod } from './Parts.jsx';
import { wallPlane } from './helpers.js';

// Floor, walls, ceiling, beams, lamps and a few friendly extras. The front
// (z = 0) stays open: the exterior package builds the facade there.

const { width: W, depth: D, height: H } = STORE;
const TILE_H = 12; // wall tiles end here, plaster above

function Wall({ pos, rot, w }) {
  return (
    <group position={pos} rotation={rot}>
      <mesh geometry={wallPlane(w, TILE_H, 1 / 6)} material={M.wallTile()} position={[0, TILE_H / 2, 0]} />
      <mesh geometry={wallPlane(w, H - TILE_H, 1 / 6)} material={M.plaster()} position={[0, TILE_H + (H - TILE_H) / 2, 0]} />
      {/* rail where tile meets plaster */}
      <Box s={[w, 0.9, 0.7]} p={[0, TILE_H + 0.1, 0.3]} r={0.3} m={M.trim()} />
    </group>
  );
}

function Lamp({ x, z, drop, color, size = 2.6, light }) {
  const top = H - 1.4;
  const y = top - drop;
  const shade = useMemo(() => new THREE.SphereGeometry(size, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2), [size]);
  return (
    <group position={[x, 0, z]}>
      <Rod r={0.07} y={[y, top]} m={M.ink()} />
      <Cyl r={0.5} h={0.4} bevel={0.15} p={[0, top - 0.1, 0]} m={M.ink()} />
      <mesh geometry={shade} material={color} position={[0, y, 0]} scale={[1, 0.85, 1]} rotation={[0, 0, 0]} />
      <mesh position={[0, y - 0.1, 0]}>
        <sphereGeometry args={[size * 0.32, 20, 12]} />
        <primitive object={M.bulb()} attach="material" />
      </mesh>
      {light && <pointLight position={[0, y - 1, 0]} color="#ffd9a0" intensity={light} distance={0} decay={1.6} />}
    </group>
  );
}

// A potted plant: pot + a handful of plump leaves, seeded.
function Plant({ x, z, seed = 1, scale = 1 }) {
  const leaves = useMemo(() => {
    const r = rng(seed);
    return jitter(
      Array.from({ length: 9 }, (_, i) => ({ p: [Math.cos(i * 2.4) * 0.5, 3.4 + (i % 3) * 0.5, Math.sin(i * 2.4) * 0.5], r: [0.55 + (i % 3) * 0.25, i * 2.4, 0] })),
      seed,
      { pos: 0.15, y: 0.3, rot: 0.4, tilt: 0.15, scale: 0.25 },
    ).map(l => ({ ...l, dark: r() > 0.5 }));
  }, [seed]);
  return (
    <group position={[x, 0, z]} scale={scale}>
      <Cyl r={1.4} h={2.8} bevel={0.45} m={M.terracotta()} />
      <Cyl r={1.25} h={0.2} bevel={0.05} p={[0, 2.7, 0]} m={M.soil()} />
      {leaves.map((l, i) => (
        <group key={i} position={l.p} rotation={[0, l.r[1], 0]}>
          <mesh rotation={[l.r[0], 0, l.r[2]]} position={[0, 1.2 * l.s, 0.2]} scale={[0.55 * l.s, 1.7 * l.s, 0.16 * l.s]} material={l.dark ? M.leafDark() : M.leaf()}>
            <sphereGeometry args={[1, 20, 14]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Clock({ x, y, z }) {
  return (
    <group position={[x, y, z]} rotation={[0, -Math.PI / 2, 0]}>
      <Cyl r={2.2} h={0.6} bevel={0.25} m={M.enamelRed()} rot={[Math.PI / 2, 0, 0]} />
      <Cyl r={1.75} h={0.25} bevel={0.08} p={[0, 0, 0.45]} m={M.enamelCream()} rot={[Math.PI / 2, 0, 0]} />
      <Box s={[0.18, 1.3, 0.1]} p={[0, 0.5, 0.7]} r={0.05} m={M.ink()} />
      <Box s={[0.18, 0.9, 0.1]} p={[0.4, -0.1, 0.72]} r={0.05} rot={[0, 0, 1.2]} m={M.ink()} />
    </group>
  );
}

export default function Shell() {
  return (
    <group>
      {/* floor + slab */}
      <mesh geometry={wallPlane(W, D, 1 / 4)} material={M.floor()} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -D / 2]} />
      <BoxAt x={[-W / 2 - 1.6, W / 2 + 1.6]} y={[-1.4, -0.02]} z={[-D - 1.6, 0]} r={0.3} m={M.plaster()} />

      {/* walls */}
      <Wall pos={[0, 0, -D]} rot={[0, 0, 0]} w={W} />
      <Wall pos={[-W / 2, 0, -D / 2]} rot={[0, Math.PI / 2, 0]} w={D} />
      <Wall pos={[W / 2, 0, -D / 2]} rot={[0, -Math.PI / 2, 0]} w={D} />
      {/* wall thickness, seen from outside and from above */}
      <BoxAt x={[-W / 2 - 1.6, W / 2 + 1.6]} y={[0, H + 1.4]} z={[-D - 1.6, -D - 0.03]} r={0.35} uv={1 / 6} m={M.plaster()} />
      <BoxAt x={[-W / 2 - 1.6, -W / 2 - 0.03]} y={[0, H + 1.4]} z={[-D, 0]} r={0.35} uv={1 / 6} m={M.plaster()} />
      <BoxAt x={[W / 2 + 0.03, W / 2 + 1.6]} y={[0, H + 1.4]} z={[-D, 0]} r={0.35} uv={1 / 6} m={M.plaster()} />

      {/* ceiling + roof slab */}
      <mesh geometry={wallPlane(W, D, 1 / 6)} material={M.ceiling()} rotation={[Math.PI / 2, 0, 0]} position={[0, H, -D / 2]} />
      <BoxAt x={[-W / 2 - 1.6, W / 2 + 1.6]} y={[H + 0.03, H + 1.4]} z={[-D - 1.6, 0]} r={0.35} uv={1 / 6} m={M.plaster()} />
      {/* beams, a little off-square */}
      {[-9, -22.5, -35].map((z, i) => (
        <BoxAt key={z} x={[-W / 2, W / 2]} y={[H - 1.8, H]} z={[z - 1.2, z + 1.2]} r={0.4} m={M.woodDark()} rot={[0, 0, (i - 1) * 0.0015]} />
      ))}

      {/* lamps: hung at slightly different heights */}
      <Lamp x={-8.5} z={-27} drop={9.8} color={M.enamelMustard()} light={150} />
      <Lamp x={4.5} z={-24.5} drop={10.4} color={M.enamelRed()} light={110} />
      <Lamp x={-12.4} z={-16.3} drop={8.2} color={M.enamelMustard()} size={2.9} light={90} />
      <Lamp x={14.2} z={-14.4} drop={7.2} color={M.enamelRed()} size={2.4} light={80} />

      {/* extras */}
      <Plant x={-22.2} z={-3.5} seed={5} scale={1.15} />
      <Plant x={22.4} z={-4.2} seed={9} scale={1} />
      <Clock x={W / 2 - 0.6} y={21} z={-20} />
      {/* door mat */}
      <Box s={[7.5, 0.35, 4.4]} p={[0.3, 0.15, -3]} r={0.15} m={M.ink()} rot={[0, 0.03, 0]} />
      <Box s={[6.3, 0.1, 3.2]} p={[0.3, 0.34, -3]} r={0.04} m={M.enamelRed()} rot={[0, 0.03, 0]} />
    </group>
  );
}
