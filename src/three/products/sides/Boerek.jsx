import { useMemo } from 'react';
import * as THREE from 'three';
import { sides } from '../../materials/sides.js';
import { deform } from '../../geo.js';
import { memo } from './shared.js';

// Börek: a fat spiral of flaky pastry (sesame and nigella on top) and two
// cut pieces lying in front that show the white cheese filling.

const R = 0.25; // pastry rope radius
const TURNS = 1.9;

const spiralCurve = () => {
  const pts = [];
  const n = 140;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * TURNS * Math.PI * 2 + 0.4;
    const r = 0.34 + t * (1.25 - 0.34) + 0.04 * Math.sin(t * 17);
    pts.push(new THREE.Vector3(Math.sin(a) * r, R * (1 + 0.04 * Math.sin(t * 23)), Math.cos(a) * r));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
};

const rope = () =>
  memo('rope', () => {
    const c = spiralCurve();
    const g = new THREE.TubeGeometry(c, 320, R, 24, false);
    // Squash a little so it sits flatter and lumpier.
    return deform(g, p => {
      p.y = p.y * 0.92 + 0.012 * Math.sin(p.x * 11 + p.z * 7);
    });
  });

const cap = at =>
  memo(`cap${at}`, () => {
    const c = spiralCurve();
    const p = c.getPoint(at);
    const tan = c.getTangent(at);
    const g = new THREE.SphereGeometry(R, 20, 14);
    g.scale(1, 0.92, 1);
    g.translate(p.x, p.y, p.z);
    g.userData.tan = tan;
    return g;
  });

// A short cut piece lying on its side, cut face towards +Z.
const piece = () =>
  memo('piece', () => {
    const g = new THREE.CylinderGeometry(R * 1.08, R * 1.08, 0.62, 32, 4);
    g.rotateX(Math.PI / 2);
    // torso uv: swap so u runs along the length like the rope.
    const uv = g.attributes.uv;
    const torso = 33 * 5;
    for (let i = 0; i < torso; i++) {
      const u = uv.getX(i);
      uv.setXY(i, uv.getY(i), u);
    }
    return deform(g, p => {
      p.x *= 1 + 0.04 * Math.sin(p.z * 9);
    });
  });

export default function Boerek() {
  const m = useMemo(() => ({ pastry: sides.pastry(), cut: sides.pastryCut() }), []);
  return (
    <group>
      <mesh geometry={rope()} material={m.pastry} castShadow receiveShadow />
      <mesh geometry={cap(1)} material={m.pastry} castShadow />
      <mesh geometry={cap(0)} material={m.pastry} castShadow />
      <mesh geometry={piece()} material={[m.pastry, m.cut, m.cut]} position={[-0.75, R * 1.08, 1.95]} rotation={[0, 0.25, 0]} castShadow receiveShadow />
      <mesh geometry={piece()} material={[m.pastry, m.cut, m.cut]} position={[0.55, R * 1.08, 1.75]} rotation={[0, -0.3, 0]} castShadow receiveShadow />
    </group>
  );
}
