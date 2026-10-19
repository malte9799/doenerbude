import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { intMaterials as M } from '../../materials/store-interior.js';
import { deform } from '../../geo.js';
import { MOTION, approach } from '../../motion.js';
import { PLAN } from './anchors.js';
import { Box, Cyl, Rod } from './Parts.jsx';
import { memo } from './helpers.js';

// The döner spit: a plump, uneven meat cone on a skewer, a drip tray below and
// an infrared heater panel behind it. `spin` (0..1) is the target speed; the
// speed follows it through approach(). With motion off the cone just stands
// at a fixed, pleasant angle.

const MEAT_H = 8.4;

// Lathe from the tray up: wide and plump at the top, rounded at both ends,
// stacked discs give soft ridges, and every angle gets its own lumpiness.
const meatCone = () =>
  memo('spitMeat', () => {
    const pts = [];
    const n = 90;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      let r = 1.35 + 1.25 * Math.pow(t, 0.85) + 0.25 * Math.sin(t * 3.1);
      // rounded caps
      const e = Math.min(t, 1 - t);
      if (e < 0.04) r *= 0.12 + 0.88 * Math.sqrt(1 - (1 - e / 0.04) ** 2);
      // ridges where the discs meet
      r *= 1 + 0.035 * Math.abs(Math.sin(t * 16 * Math.PI)) - 0.02;
      pts.push(new THREE.Vector2(i === 0 || i === n ? 0.001 : r, t * MEAT_H));
    }
    const g = new THREE.LatheGeometry(pts, 56);
    return deform(g, v => {
      const a = Math.atan2(v.z, v.x);
      const t = v.y / MEAT_H;
      const f =
        1 +
        0.05 * Math.sin(3 * a + t * 5) +
        0.035 * Math.sin(5 * a - t * 9 + 1.3) +
        0.03 * Math.sin(2 * a + t * 3.3) * t;
      v.x *= f;
      v.z *= f;
      v.x += 0.06 * Math.sin(t * 7); // slightly crooked skewer stack
    });
  });

export default function Spit({ spin = 0 }) {
  const { x, y, z } = PLAN.spit;
  const geo = useMemo(meatCone, []);
  const turn = useRef();
  const state = useRef({ speed: 0, angle: 0.7 });

  useFrame((_, dt) => {
    const s = state.current;
    s.speed = approach(s.speed, spin, 3, dt);
    if (MOTION.enabled) s.angle += s.speed * 0.9 * dt;
    if (turn.current) turn.current.rotation.y = s.angle;
  });

  return (
    <group>
      <group position={[x, y, z]}>
        {/* tray + stand */}
        <Cyl r={3.7} h={0.7} bevel={0.3} m={M.steel()} />
        <Cyl r={3.2} h={0.25} bevel={0.1} p={[0, 0.55, 0]} m={M.steelWarm()} />
        <group ref={turn}>
          <Rod r={0.22} y={[0.4, MEAT_H + 2.4]} p={[0, 0]} m={M.steel()} />
          <mesh geometry={geo} material={M.spitMeat()} position={[0, 1.2, 0]} />
          <mesh position={[0, MEAT_H + 2.4, 0]} material={M.enamelRed()}>
            <sphereGeometry args={[0.55, 20, 14]} />
          </mesh>
          {/* meat cap */}
          <Cyl r={1.4} h={0.35} bevel={0.15} p={[0, MEAT_H + 1.15, 0]} m={M.steel()} />
        </group>
      </group>

      {/* heater panel on the back wall */}
      <group position={[x, y + 0.7, -39.45]}>
        <Box s={[7.2, 10.2, 1.1]} p={[0, 5.1, 0]} r={0.4} m={M.ink()} />
        <mesh position={[0, 5.1, 0.57]}>
          <planeGeometry args={[6.2, 9.1]} />
          <primitive object={M.heater()} attach="material" />
        </mesh>
      </group>
      <pointLight position={[x, y + 7, z - 1.4]} color="#ff9a4a" intensity={26} distance={0} decay={1.6} />
    </group>
  );
}
