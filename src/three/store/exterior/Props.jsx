import { useMemo } from 'react';
import * as THREE from 'three';
import { jitter, merge, rng } from '../../geo.js';
import { exteriorMaterials as M } from '../../materials/store-exterior.js';
import { STORE } from '../layout.js';
import { blob, memo, puck, rbox } from './shapes.js';

// Small chunky props of the scene. Positions are in the shared store frame
// (z ≥ 0 is the sidewalk in front of the facade).

// Soft contact shadow blob lying on the ground.
export function Shadow({ x = 0, z = 0, w = 6, d = 6, y = 0.03, opacity = 1, rot = 0 }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, rot]} material={M.shadow()} renderOrder={1}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

// ───────────────────────────── A-frame menu stand ─────────────────────────────

export function MenuStand({ position = [0, 0, 0], rotation = 0 }) {
  const h = 8.6;
  const lean = 0.2;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Shadow x={0} z={-1.7} w={9} d={8} opacity={0.9} />
      {/* front board with chalk face */}
      <group rotation={[-lean, 0, 0]}>
        <mesh geometry={rbox(5.8, h, 0.55, 0.25)} material={M.wood()} position={[0, h / 2, 0]} />
        <mesh material={M.chalk()} position={[0, h / 2 - 0.1, 0.3]}>
          <planeGeometry args={[4.8, h - 1.2]} />
        </mesh>
      </group>
      {/* back leg */}
      <group position={[0.1, 0, -h * Math.sin(lean) * 2]} rotation={[lean * 1.05, 0, 0]}>
        <mesh geometry={rbox(5.4, h, 0.5, 0.25)} material={M.wood()} position={[0, h / 2, 0]} />
      </group>
      {/* top hinge cap */}
      <mesh geometry={rbox(6.2, 0.7, 1.4, 0.3)} material={M.mustard()} position={[0, h * Math.cos(lean) + 0.1, -h * Math.sin(lean)]} />
    </group>
  );
}

// ───────────────────────────── bistro set ─────────────────────────────

const chairParts = () =>
  memo('extChair', () => {
    const legGeo = (x, z, sx, sz) => {
      const g = new THREE.CapsuleGeometry(0.22, 4.1, 4, 10);
      g.translate(0, 2.15, 0);
      g.rotateZ(sx * 0.08);
      g.rotateX(-sz * 0.08);
      g.translate(x, 0, z);
      return g;
    };
    const legs = merge([legGeo(-1.3, -1.3, -1, 1), legGeo(1.3, -1.3, 1, 1), legGeo(-1.3, 1.3, -1, -1), legGeo(1.3, 1.3, 1, -1)]);
    const seat = puck(1.95, 0.55, 0.22);
    seat.translate(0, 4.3, 0);
    // curved back rest: a thick arc around the rear of the seat
    const back = new THREE.TorusGeometry(1.95, 0.42, 12, 28, Math.PI * 0.75);
    back.rotateX(-Math.PI / 2);
    back.rotateY(Math.PI * 0.625 - Math.PI / 2 + Math.PI);
    back.scale(1, 1.5, 1);
    back.translate(0, 6.9, 0);
    // two posts joining seat and back
    return { legs, seat, back };
  });

function Chair({ position, rotation = 0 }) {
  const c = chairParts();
  return (
    <group position={position} rotation={[0, rotation, 0.02]}>
      <mesh geometry={c.legs} material={M.ink()} />
      <mesh geometry={c.seat} material={M.mustard()} />
      <mesh geometry={c.back} material={M.mustard()} />
    </group>
  );
}

export function BistroSet({ position = [0, 0, 0], rotation = 0 }) {
  const top = useMemo(() => memo('extTableTop', () => puck(4.2, 0.7, 0.3, 48)), []);
  const base = useMemo(() => memo('extTableBase', () => puck(2.4, 0.6, 0.25)), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Shadow x={0} z={0.3} w={22} d={19} />
      <mesh geometry={base} material={M.ink()} />
      <mesh position={[0, 3.5, 0]} material={M.ink()}>
        <cylinderGeometry args={[0.42, 0.55, 7, 16]} />
      </mesh>
      <mesh geometry={top} material={M.wood()} position={[0, 6.9, 0]} rotation={[0, 0.4, 0.012]} />
      <Chair position={[-5.6, 0, 1.2]} rotation={-Math.PI / 2 - 0.12} />
      <Chair position={[5.3, 0, -0.9]} rotation={Math.PI / 2 + 0.35} />
      {/* a little mustard cup on the table */}
      <mesh position={[0.8, 7.9, 0.4]} material={M.red()}>
        <cylinderGeometry args={[0.5, 0.4, 1.0, 16]} />
      </mesh>
    </group>
  );
}

// ───────────────────────────── plants ─────────────────────────────

const potGeo = (r, h) =>
  memo(`extPot${r}_${h}`, () => {
    const pts = [
      [0.001, 0],
      [r * 0.62, 0],
      [r * 0.72, 0.12 * h],
      [r * 0.95, h * 0.78],
      [r * 1.05, h * 0.9],
      [r * 1.02, h * 0.98],
      [r * 0.9, h],
      [r * 0.8, h * 0.93],
      [0.001, h * 0.93],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(new THREE.SplineCurve(pts).getSpacedPoints(48), 36);
  });

const bush = (seed, n, spread, size) =>
  memo(`extBush${seed}`, () => {
    const r = rng(seed);
    const geos = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r();
      const rad = i === 0 ? 0 : spread * (0.6 + r() * 0.4);
      const g = blob(size * (0.75 + r() * 0.35), seed * 10 + i, { lump: 0.16, squash: 0.85 });
      g.translate(Math.cos(a) * rad, (i === 0 ? 0.9 : 0.2 + r() * 0.8) * size, Math.sin(a) * rad);
      geos.push(g);
    }
    return merge(geos);
  });

export function PlantPot({ position = [0, 0, 0], scale = 1, seed = 1, tree = false }) {
  const pot = potGeo(1.7, 3.1);
  const crown = bush(seed, tree ? 6 : 5, tree ? 1.5 : 1.1, tree ? 1.5 : 1.25);
  return (
    <group position={position} scale={scale}>
      <Shadow x={0.2} z={0.2} w={7.5 + (tree ? 2 : 0)} d={7.5 + (tree ? 2 : 0)} />
      <mesh geometry={pot} material={M.terracotta()} />
      <mesh position={[0, 2.78, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.soil()}>
        <circleGeometry args={[1.55, 24]} />
      </mesh>
      {tree && (
        <mesh position={[0.1, 5.4, 0]} rotation={[0, 0, 0.05]} material={M.wood()}>
          <cylinderGeometry args={[0.28, 0.4, 5.5, 12]} />
        </mesh>
      )}
      <mesh geometry={crown} material={M.leaf()} position={[0, tree ? 8.2 : 3.2, 0]} />
      <mesh geometry={bush(seed + 40, 3, tree ? 2.1 : 1.4, tree ? 1.1 : 0.9)} material={M.leafDark()} position={[0.2, tree ? 7.4 : 3.5, 0.1]} scale={0.92} />
    </group>
  );
}

// ───────────────────────────── wall lamp ─────────────────────────────

export function WallLamp({ position = [0, 0, 0], light = true }) {
  const shade = useMemo(
    () =>
      memo('extShade', () => {
        const g = new THREE.SphereGeometry(1.5, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
        g.scale(1, 0.85, 1);
        return g;
      }),
    [],
  );
  return (
    <group position={position}>
      <mesh geometry={rbox(1.3, 2.4, 0.7, 0.3)} material={M.ink()} position={[0, 0, 0.3]} />
      <mesh material={M.ink()} position={[0, 0.2, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.22, 2.2, 4, 10]} />
      </mesh>
      <mesh geometry={shade} material={M.ink()} position={[0, 0.1, 3.2]} rotation={[0, 0, 0]} />
      <mesh material={M.lampBulb()} position={[0, -0.55, 3.2]}>
        <sphereGeometry args={[0.7, 16, 12]} />
      </mesh>
      {light && <pointLight position={[0, -1.4, 4.2]} color="#ffc27a" intensity={14} distance={16} decay={2} />}
      {/* soft glow disc on the wall */}
      <mesh position={[0, -2.2, 0.12]} material={M.glowPool()}>
        <planeGeometry args={[9, 9]} />
      </mesh>
    </group>
  );
}

// ───────────────────────────── exhaust pipe ─────────────────────────────

// Roof exhaust; the steam package can attach to EXHAUST_TOP (store frame).
export const EXHAUST_TOP = [15.6, STORE.height + 13.2, -26];

export function ExhaustPipe({ position = [0, 0, 0] }) {
  return (
    <group position={position} rotation={[0, 0, 0.015]}>
      <mesh geometry={rbox(4.8, 1.6, 4.6, 0.6)} material={M.inkSoft()} position={[0, 0.8, 0]} />
      <mesh material={M.steel()} position={[0, 5.2, 0]}>
        <cylinderGeometry args={[1.0, 1.15, 7.2, 24]} />
      </mesh>
      <mesh material={M.ink()} position={[0, 2.4, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.55, 24]} />
      </mesh>
      <mesh material={M.ink()} position={[0, 6.4, 0]}>
        <cylinderGeometry args={[1.28, 1.28, 0.55, 24]} />
      </mesh>
      <mesh material={M.ink()} position={[0, 8.8, 0]}>
        <cylinderGeometry args={[1.28, 1.2, 0.5, 24]} />
      </mesh>
      {/* rain cap on a post */}
      <mesh material={M.ink()} position={[0, 9.7, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1.2, 8]} />
      </mesh>
      <mesh position={[0, 10.5, 0]} material={M.red()}>
        <coneGeometry args={[2.0, 1.2, 24]} />
      </mesh>
    </group>
  );
}

// ───────────────────────────── street lamp ─────────────────────────────

export function StreetLamp({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <Shadow x={0.3} z={0.3} w={5} d={5} />
      <mesh geometry={puck(1.3, 1.0, 0.35)} material={M.ink()} />
      <mesh material={M.ink()} position={[0, 10.5, 0]}>
        <cylinderGeometry args={[0.38, 0.55, 20, 14]} />
      </mesh>
      <mesh geometry={puck(1.0, 0.6, 0.2)} material={M.ink()} position={[0, 20.4, 0]} />
      <mesh material={M.lampBulb()} position={[0, 22.4, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[1.5, 24, 16]} />
      </mesh>
      <mesh geometry={puck(1.8, 0.7, 0.25)} material={M.ink()} position={[0, 24.3, 0]} />
      <pointLight position={[0, 21, 2]} color="#ffcf8a" intensity={55} distance={50} decay={2} />
    </group>
  );
}

export const roadDashes = () => {
  const items = jitter(
    Array.from({ length: 8 }, (_, i) => ({ p: [-35 + i * 10, 0, 0] })),
    77,
    { pos: 0.5, rot: 0.02, tilt: 0.0, scale: 0.12 },
  );
  return items;
};
