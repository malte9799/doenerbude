import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { exteriorMaterials as M } from '../../materials/store-exterior.js';
import { MOTION, approach } from '../../motion.js';
import { STORE } from '../layout.js';
import { extrude, memo, rbox, rrectPath, rrectShape } from './shapes.js';

// Glass door. The group's pivot sits on the hinge edge (left), so rotating it
// around Y swings the leaf into the shop. doorOpen 0..1 → 0..100°.

const { door } = STORE;
const OPEN_ANGLE = (100 * Math.PI) / 180;

const leaf = () =>
  memo('extDoorLeaf', () => {
    const w = door.width - 0.3;
    const h = door.height - 0.2;
    const s = rrectShape(0.15, 0.1, w, h, 1.8);
    s.holes.push(rrectPath(new THREE.Path(), 1.35, 5.2, w - 2.4, h - 6.4, 1.2));
    return extrude(s, { depth: 0.9, bevel: 0.3, zFront: 0.45, curve: 10 });
  });

export default function Door({ doorOpen = 0 }) {
  const ref = useRef();
  const angle = useRef(doorOpen);
  const w = door.width - 0.3;
  const h = door.height - 0.2;

  useFrame((_, dt) => {
    angle.current = approach(angle.current, doorOpen, MOTION.rates.settle, dt);
    ref.current.rotation.y = angle.current * OPEN_ANGLE;
  });

  const geo = useMemo(() => leaf(), []);
  return (
    // Pivot: hinge edge of the opening, in the middle of the wall thickness.
    <group ref={ref} position={[door.x - door.width / 2, 0, -0.7]} rotation={[0, doorOpen * OPEN_ANGLE, 0]}>
      <mesh geometry={geo} material={M.red()} />
      {/* kick plate and glass */}
      <mesh geometry={rbox(w - 1.6, 3.4, 0.3, 0.14)} material={M.ink()} position={[0.15 + w / 2, 2.9, 0.5]} />
      <mesh position={[0.15 + w / 2, 5.2 + (h - 6.4) / 2 + 0.1, 0]} material={M.glass()} renderOrder={3}>
        <planeGeometry args={[w - 2.2, h - 6.2]} />
      </mesh>
      {/* chunky pull bar */}
      <group position={[w - 0.55, 10.2, 0.45]}>
        <mesh material={M.steel()} position={[0, 0, 0.5]}>
          <capsuleGeometry args={[0.28, 5.2, 6, 14]} />
        </mesh>
        <mesh material={M.steel()} position={[0, 2.2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.2, 0.5, 4, 10]} />
        </mesh>
        <mesh material={M.steel()} position={[0, -2.2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.2, 0.5, 4, 10]} />
        </mesh>
      </group>
    </group>
  );
}
