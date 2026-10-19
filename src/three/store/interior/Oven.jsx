import { useMemo } from 'react';
import * as THREE from 'three';
import { intMaterials as M } from '../../materials/store-interior.js';
import { deform } from '../../geo.js';
import { PLAN } from './anchors.js';
import { Blob, BoxAt, Cyl, Rod } from './Parts.jsx';
import { memo } from './helpers.js';

// Dome pizza oven: mustard mosaic base, clay-brick dome, an arched mouth with
// a warm fire glow, a chimney through the ceiling, and a wooden shelf in front
// where the pizzas stand (anchors.oven).

const O = PLAN.oven;
const S = PLAN.ovenShelf;
const R = 5.5;
const DOME_Y = O.base + 0.3;
const MOUTH_W = 5.4;
const MOUTH_H = 3.6;
const FRONT = O.z + R; // front tip of the dome

// Arch outline: flat bottom, half-circle top. Optional hole for the frame.
function archShape(w, h, inset = 0) {
  const r = w / 2 - inset;
  const s = new THREE.Shape();
  s.moveTo(-r, inset);
  s.lineTo(r, inset);
  s.lineTo(r, h - w / 2 + 0.0);
  s.absarc(0, h - w / 2, r, 0, Math.PI, false);
  s.lineTo(-r, inset);
  return s;
}

const domeGeo = () =>
  memo('ovenDome', () => {
    const g = new THREE.SphereGeometry(R, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, (uv.getY(i) - 0.5) * 2 * 1.15);
    g.scale(1, 0.9, 1);
    return deform(g, v => {
      const a = Math.atan2(v.z, v.x);
      const f = 1 + 0.025 * Math.sin(3 * a + 0.8) + 0.018 * Math.sin(5 * a + v.y * 0.7);
      v.x *= f;
      v.z *= f;
      v.y *= 1 + 0.02 * Math.sin(2 * a + 1.1);
    });
  });

const frameGeo = () =>
  memo('ovenFrame', () => {
    const shape = archShape(MOUTH_W + 1.8, MOUTH_H + 0.9);
    const hole = archShape(MOUTH_W, MOUTH_H, 0);
    shape.holes.push(new THREE.Path(hole.getPoints(24).reverse()));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.28, bevelSize: 0.28, bevelSegments: 4, curveSegments: 24 });
    return g;
  });

const fireGeo = () =>
  memo('ovenFire', () => {
    const g = new THREE.ShapeGeometry(archShape(MOUTH_W + 0.1, MOUTH_H + 0.05), 24);
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (MOUTH_W + 0.1) + 0.5, p.getY(i) / (MOUTH_H + 0.05));
    return g;
  });

export default function Oven() {
  const dome = useMemo(domeGeo, []);
  const frame = useMemo(frameGeo, []);
  const fire = useMemo(fireGeo, []);
  const sx = (S.x0 + S.x1) / 2;
  const sw = S.x1 - S.x0;
  const legZ = [S.z0 + 0.5, S.z1 - 0.5];
  return (
    <group>
      <Blob x={O.x} z={O.z + 1} w={O.w + 4} d={O.d + 4} />
      <Blob x={sx} z={(S.z0 + S.z1) / 2} w={sw + 2} d={7} strength={0.6} />

      {/* base: mustard mosaic with a dark skirt and a steel cap */}
      <BoxAt x={[O.x - O.w / 2 + 0.3, O.x + O.w / 2 - 0.3]} y={[0, 0.9]} z={[O.z - O.d / 2 + 0.3, O.z + O.d / 2 - 0.3]} r={0.3} m={M.ink()} />
      <BoxAt x={[O.x - O.w / 2, O.x + O.w / 2]} y={[0.5, O.base]} z={[O.z - O.d / 2, O.z + O.d / 2]} r={0.5} uv={0.25} m={M.tileMustard()} />
      <BoxAt x={[O.x - O.w / 2 - 0.2, O.x + O.w / 2 + 0.2]} y={[O.base - 0.2, O.base + 0.35]} z={[O.z - O.d / 2 - 0.2, O.z + O.d / 2 + 0.2]} r={0.25} m={M.steel()} />

      {/* dome */}
      <mesh geometry={dome} material={M.brick()} position={[O.x, DOME_Y, O.z]} rotation={[0, 0.1, 0]} />

      {/* mouth */}
      <group position={[O.x - 0.2, DOME_Y + 0.1, FRONT - 2.3]}>
        <mesh geometry={frame} material={M.enamelCream()} position={[0, 0, 0.1]} />
        <mesh geometry={fire} material={M.fire()} position={[0, 0, 2.4]} />
      </group>
      {/* the glow lights the shelf and the pizzas */}
      <pointLight position={[O.x - 0.2, DOME_Y + 2, FRONT + 1.5]} color="#ff9a45" intensity={34} distance={0} decay={1.7} />

      {/* chimney through the ceiling */}
      <Rod r={0.95} y={[DOME_Y + 4, 30]} p={[O.x + 0.2, O.z - 1.2]} m={M.steel()} />
      <Cyl r={1.45} h={0.7} bevel={0.3} p={[O.x + 0.2, DOME_Y + 4.2, O.z - 1.2]} m={M.steel()} />

      {/* pizza shelf: oak board on a steel apron, steel legs, firewood below */}
      <BoxAt x={[S.x0, S.x1]} y={[S.top - 0.55, S.top]} z={[S.z0, S.z1]} r={0.25} m={M.wood()} />
      <BoxAt x={[S.x0 + 0.3, S.x1 - 0.3]} y={[S.top - 1.2, S.top - 0.5]} z={[S.z0 + 0.3, S.z1 - 0.3]} r={0.2} m={M.steel()} />
      {[S.x0 + 0.7, S.x1 - 0.7].flatMap(x => legZ.map(z => <Rod key={`${x}${z}`} r={0.28} y={[0, S.top - 1]} p={[x, z]} m={M.steel()} />))}
      <BoxAt x={[S.x0 + 0.5, S.x1 - 0.5]} y={[2.4, 2.8]} z={[S.z0 + 0.4, S.z1 - 0.4]} r={0.15} m={M.steel()} />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={i} position={[S.x1 - 3.2 + (i % 3) * 1.15, 3.35 + Math.floor(i / 3) * 0.95, (S.z0 + S.z1) / 2 + (i % 2) * 0.15]} rotation={[Math.PI / 2, 0, 0.1 * i]} material={i % 2 ? M.wood() : M.woodDark()}>
          <cylinderGeometry args={[0.48, 0.48, 3 + (i % 2) * 0.3, 14]} />
        </mesh>
      ))}
    </group>
  );
}
