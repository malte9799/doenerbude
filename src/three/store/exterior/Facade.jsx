import { useMemo } from 'react';
import * as THREE from 'three';
import { deform } from '../../geo.js';
import { exteriorMaterials as M } from '../../materials/store-exterior.js';
import { STORE } from '../layout.js';
import { extrude, memo, rbox, ringFrame, rrectPath } from './shapes.js';

// The shopfront: chunky stucco wall with rounded openings, tiled plinth,
// window frames, side walls, back wall and a roof with parapet. All openings
// follow STORE (door centred at door.x, 9 × 21).

const { width: W, depth: D, height: H, door } = STORE;
const HW = W / 2;
const WALL = 1.5; // facade thickness (max 1.5 into z < 0)

// Window openings (x from, width) – symmetric around the door but not identical.
export const WINDOWS = [
  { x: -21.6, y: 6.5, w: 13.4, h: 11.8, r: 2.2 },
  { x: 8.4, y: 6.5, w: 13.0, h: 11.8, r: 2.4 },
];
const doorX0 = door.x - door.width / 2;
const doorX1 = door.x + door.width / 2;

// Front wall as one extrusion: outer outline with the door notch, window holes.
function wallGeometry() {
  const s = new THREE.Shape();
  const r = 2.2;
  s.moveTo(-HW, 0);
  s.lineTo(doorX0, 0);
  s.lineTo(doorX0, door.height - r);
  s.quadraticCurveTo(doorX0, door.height, doorX0 + r, door.height);
  s.lineTo(doorX1 - r, door.height);
  s.quadraticCurveTo(doorX1, door.height, doorX1, door.height - r);
  s.lineTo(doorX1, 0);
  s.lineTo(HW, 0);
  s.lineTo(HW, H);
  s.lineTo(-HW, H);
  s.closePath();
  for (const w of WINDOWS) s.holes.push(rrectPath(new THREE.Path(), w.x, w.y, w.w, w.h, w.r));
  let g = extrude(s, { depth: WALL, bevel: 0.4, segments: 3, curve: 10 });
  // Hand-made: the plaster bulges a little and nothing is perfectly straight.
  g = deform(g, v => {
    v.z += 0.1 * Math.sin(v.x * 0.21 + 0.6) * Math.sin(v.y * 0.3 + 1.1);
    v.x += 0.07 * Math.sin(v.y * 0.45 + 0.3);
    v.y += 0.06 * Math.sin(v.x * 0.37 + 1.9);
  });
  return g;
}

function doorFrameGeometry() {
  // Open-bottom U around the door opening.
  const g = 1.15;
  const r = 2.2;
  const s = new THREE.Shape();
  s.moveTo(doorX0 - g, 0);
  s.lineTo(doorX0 - g, door.height - r + g * 0.2);
  s.quadraticCurveTo(doorX0 - g, door.height + g, doorX0 + r - 0.3, door.height + g);
  s.lineTo(doorX1 - r + 0.3, door.height + g);
  s.quadraticCurveTo(doorX1 + g, door.height + g, doorX1 + g, door.height - r + g * 0.2);
  s.lineTo(doorX1 + g, 0);
  s.lineTo(doorX1, 0);
  s.lineTo(doorX1, door.height - r);
  s.quadraticCurveTo(doorX1, door.height, doorX1 - r, door.height);
  s.lineTo(doorX0 + r, door.height);
  s.quadraticCurveTo(doorX0, door.height, doorX0, door.height - r);
  s.lineTo(doorX0, 0);
  s.closePath();
  return extrude(s, { depth: 1.3, bevel: 0.32, zFront: 1.3, curve: 10 });
}

function roofRing() {
  const outerW = W + 3;
  const outerD = D + 3.5;
  const s = new THREE.Shape();
  rrectPath(s, -outerW / 2, -outerD / 2, outerW, outerD, 1.6);
  s.holes.push(rrectPath(new THREE.Path(), -outerW / 2 + 1.8, -outerD / 2 + 1.8, outerW - 3.6, outerD - 3.6, 1));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 3, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); // shape y → -z, extrusion → +y
  return g;
}

export default function Facade({ roof = true }) {
  const geo = useMemo(
    () => ({
      wall: memo('extWall', wallGeometry),
      doorFrame: memo('extDoorFrame', doorFrameGeometry),
      windowFrames: WINDOWS.map((w, i) => memo(`extWinFrame${i}`, () => ringFrame({ x: w.x, y: w.y, w: w.w, h: w.h, r: w.r, grow: 1.1, depth: 1.3, bevel: 0.35, zFront: 1.3 }))),
      roofRing: memo('extRoofRing', roofRing),
    }),
    [],
  );

  const cx = (a, w) => a + w / 2;
  const skirtL = doorX0 + HW - 0.1;
  const skirtR = HW - doorX1 - 0.1;

  return (
    <group>
      <mesh geometry={geo.wall} material={M.plaster()} />
      <mesh geometry={geo.doorFrame} material={M.trim()} />
      {geo.windowFrames.map((g, i) => (
        <mesh key={i} geometry={g} material={M.trim()} />
      ))}

      {/* Corner posts: chunky rounded pilasters. */}
      <mesh geometry={rbox(2.6, H + 0.2, 3.4, 0.9)} material={M.plaster()} position={[-HW + 1.3, H / 2, -0.1]} rotation={[0, 0, 0.002]} />
      <mesh geometry={rbox(2.5, H + 0.2, 3.3, 0.9)} material={M.plaster()} position={[HW - 1.25, H / 2, -0.05]} rotation={[0, 0, -0.003]} />

      {/* Tiled plinth left and right of the door, with a rounded cap rail. */}
      <mesh geometry={rbox(skirtL, 5.2, 1.0, 0.4)} material={M.tiles()} position={[-HW + skirtL / 2 + 0.2, 2.6, 0.25]} />
      <mesh geometry={rbox(skirtR, 5.2, 1.0, 0.4)} material={M.tiles()} position={[HW - skirtR / 2 - 0.2, 2.6, 0.25]} />
      <mesh geometry={rbox(skirtL + 0.6, 0.9, 1.8, 0.4)} material={M.trim()} position={[-HW + (skirtL + 0.6) / 2 + 0.1, 5.5, 0.4]} />
      <mesh geometry={rbox(skirtR + 0.6, 0.9, 1.8, 0.4)} material={M.trim()} position={[HW - (skirtR + 0.6) / 2 - 0.1, 5.5, 0.4]} />
      {/* Door step */}
      <mesh geometry={rbox(door.width + 3, 0.5, 3.4, 0.22)} material={M.paper()} position={[door.x, 0.12, 0.9]} />

      {/* Window glass + sills */}
      {WINDOWS.map((w, i) => (
        <group key={i}>
          <mesh geometry={rbox(w.w + 3.2, 0.9, 2.6, 0.35)} material={M.trim()} position={[cx(w.x, w.w) + (i ? 0.1 : -0.1), w.y - 0.6, 1.0]} />
          <mesh position={[cx(w.x, w.w), w.y + w.h / 2, -0.35]} material={M.glass()} renderOrder={2}>
            <planeGeometry args={[w.w + 0.2, w.h + 0.2]} />
          </mesh>
        </group>
      ))}

      {/* Side walls + back wall (shell for the diorama; the interior is a separate package). */}
      <mesh geometry={rbox(WALL, H, D, 0.5)} material={M.plaster()} position={[-HW + WALL / 2, H / 2, -D / 2]} />
      <mesh geometry={rbox(WALL, H, D, 0.5)} material={M.plaster()} position={[HW - WALL / 2, H / 2, -D / 2]} />
      <mesh geometry={rbox(W, H, WALL, 0.5)} material={M.plaster()} position={[0, H / 2, -D + WALL / 2]} />

      {roof && (
        <group>
          {/* Cornice, parapet and tar roof. */}
          <mesh geometry={rbox(W + 3.2, 2.3, D + 3.8, 0.9)} material={M.trim()} position={[0, H + 0.6, -D / 2 + 0.5]} />
          <mesh geometry={geo.roofRing} material={M.trim()} position={[0, H + 1.6, -D / 2 + 0.5]} />
          <mesh geometry={rbox(W - 1, 0.6, D - 0.5, 0.25)} material={M.roof()} position={[0, H + 1.6, -D / 2 + 0.5]} />
        </group>
      )}
    </group>
  );
}
