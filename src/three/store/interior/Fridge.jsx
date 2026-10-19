import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { intMaterials as M } from '../../materials/store-interior.js';
import { MOTION, approach } from '../../motion.js';
import { FRIDGE_SHELVES, PLAN } from './anchors.js';
import { Blob, Box, BoxAt, Rod } from './Parts.jsx';

// Drinks fridge in the back-left corner: mint enamel cabinet, glass shelves,
// a glass door on a hinge pivot (prop `open` 0..1, moved through approach()).

const F = PLAN.fridge;
const T = 0.7; // wall thickness
const DOOR_W = F.x1 - F.x0 - 0.2;
const DOOR_H = F.h - 2.2;
const DOOR_Y = 1.1;

export default function Fridge({ open = 0 }) {
  const hinge = useRef();
  const state = useRef({ open });
  useFrame((_, dt) => {
    const s = state.current;
    s.open = approach(s.open, open, MOTION.rates.lid, dt);
    if (hinge.current) hinge.current.rotation.y = -s.open * 1.9;
  });

  const cx = (F.x0 + F.x1) / 2;
  const cz = (F.z0 + F.z1) / 2;
  return (
    <group>
      <Blob x={cx} z={cz + 1} w={F.x1 - F.x0 + 3.5} d={F.z1 - F.z0 + 4} />

      {/* cabinet */}
      <BoxAt x={[F.x0, F.x1]} y={[0, 1.2]} z={[F.z0, F.z1 - 0.2]} r={0.3} m={M.ink()} />
      <BoxAt x={[F.x0, F.x1]} y={[F.h - 1.3, F.h]} z={[F.z0, F.z1]} r={0.5} m={M.enamelMint()} />
      <BoxAt x={[F.x0, F.x0 + T]} y={[1, F.h - 1]} z={[F.z0, F.z1]} r={0.25} m={M.enamelMint()} />
      <BoxAt x={[F.x1 - T, F.x1]} y={[1, F.h - 1]} z={[F.z0, F.z1]} r={0.25} m={M.enamelMint()} />
      <BoxAt x={[F.x0 + 0.2, F.x1 - 0.2]} y={[1, F.h - 1]} z={[F.z0, F.z0 + 0.6]} r={0.2} m={M.enamelCream()} />
      <BoxAt x={[F.x0 + 0.2, F.x1 - 0.2]} y={[0.9, 1.5]} z={[F.z0 + 0.3, F.z1 - 0.2]} r={0.15} m={M.steel()} />
      {/* red band across the top */}
      <BoxAt x={[F.x0 - 0.05, F.x1 + 0.05]} y={[F.h - 2.7, F.h - 1.6]} z={[F.z1 - 0.1, F.z1 + 0.3]} r={0.3} m={M.enamelRed()} />

      {/* shelves + cold light */}
      {FRIDGE_SHELVES.map(y => (
        <BoxAt key={y} x={[F.x0 + T, F.x1 - T]} y={[y - 0.25, y]} z={[F.z0 + 0.6, F.z1 - 0.5]} r={0.1} m={M.glassBlue()} />
      ))}
      {FRIDGE_SHELVES.map(y => (
        <BoxAt key={`e${y}`} x={[F.x0 + T, F.x1 - T]} y={[y - 0.3, y - 0.1]} z={[F.z1 - 0.7, F.z1 - 0.4]} r={0.08} m={M.steel()} />
      ))}
      <BoxAt x={[F.x0 + T + 0.2, F.x1 - T - 0.2]} y={[F.h - 2.4, F.h - 1.9]} z={[F.z1 - 1.6, F.z1 - 1]} r={0.1} m={M.stripLight()} />
      <pointLight position={[cx, F.h - 4, F.z1 - 2]} color="#e8f6ff" intensity={14} distance={12} decay={1.5} />

      {/* door on its hinge (left edge) */}
      <group ref={hinge} position={[F.x0 + 0.1, 0, F.z1]}>
        <group position={[0, DOOR_Y, 0.2]}>
          <BoxAt x={[0, DOOR_W]} y={[0, 0.9]} z={[-0.1, 0.5]} r={0.2} m={M.enamelMint()} />
          <BoxAt x={[0, DOOR_W]} y={[DOOR_H - 0.9, DOOR_H]} z={[-0.1, 0.5]} r={0.2} m={M.enamelMint()} />
          <BoxAt x={[0, 0.9]} y={[0, DOOR_H]} z={[-0.1, 0.5]} r={0.2} m={M.enamelMint()} />
          <BoxAt x={[DOOR_W - 0.9, DOOR_W]} y={[0, DOOR_H]} z={[-0.1, 0.5]} r={0.2} m={M.enamelMint()} />
          <mesh position={[DOOR_W / 2, DOOR_H / 2, 0.2]} material={M.glass()}>
            <planeGeometry args={[DOOR_W - 1.3, DOOR_H - 1.3]} />
          </mesh>
          {/* handle */}
          <Rod r={0.28} y={[DOOR_H * 0.3, DOOR_H * 0.75]} p={[DOOR_W - 0.45, 1.1]} m={M.steel()} />
          <Box s={[0.35, 0.35, 0.9]} p={[DOOR_W - 0.45, DOOR_H * 0.3 + 0.2, 0.75]} r={0.1} m={M.steel()} />
          <Box s={[0.35, 0.35, 0.9]} p={[DOOR_W - 0.45, DOOR_H * 0.75 - 0.2, 0.75]} r={0.1} m={M.steel()} />
        </group>
      </group>
    </group>
  );
}
