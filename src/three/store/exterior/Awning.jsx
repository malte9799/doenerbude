import { useMemo } from 'react';
import * as THREE from 'three';
import { exteriorMaterials as M } from '../../materials/store-exterior.js';
import { memo, rbox } from './shapes.js';

// Striped canvas awning in brand colours: sloping, a little saggy between the
// ribs, with a scalloped valance. One stripe = 4 units, texture repeat = 2 stripes.

export const AWNING = { x0: -24.2, x1: 24.6, yTop: 22.7, zOut: 9.2, drop: 4.2, stripe: 4 };

function awningGeometry() {
  const { x0, x1, yTop, zOut, drop, stripe } = AWNING;
  const nx = 120;
  const nt = 16;
  const nv = 6;
  const pos = [];
  const uv = [];
  const idx = [];
  const span = x1 - x0;
  const surface = (x, t) => {
    const f = (x - x0) / stripe;
    const rib = Math.cos(f * Math.PI * 2); // 1 on a stripe edge, -1 mid-stripe
    const sag = Math.sin(Math.PI * Math.min(1, t * 1.05)) * (0.28 * (0.5 - 0.5 * rib) + 0.45 * (1 - ((x - (x0 + x1) / 2) / (span / 2)) ** 2));
    const y = yTop - drop * Math.pow(t, 1.25) - sag * 0.5;
    const z = zOut * t + 0.35 * Math.sin(Math.PI * t) * Math.sin(x * 0.17 + 1);
    return [x + 0.12 * Math.sin(t * 5 + x * 0.3), y, z];
  };
  const push = (p, u, v) => {
    pos.push(...p);
    uv.push(u, v);
  };
  // slope
  for (let j = 0; j <= nt; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = x0 + (i / nx) * span;
      push(surface(x, j / nt), (x - x0) / (stripe * 2), (j / nt) * 0.3);
    }
  }
  const row = nx + 1;
  for (let j = 0; j < nt; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  // valance (scalloped), hanging from the front edge
  const base = pos.length / 3;
  for (let k = 0; k <= nv; k++) {
    const s = k / nv;
    for (let i = 0; i <= nx; i++) {
      const x = x0 + (i / nx) * span;
      const [px, py, pz] = surface(x, 1);
      const f = ((x - x0) / stripe) % 1;
      const scallop = 0.62 + 0.38 * Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));
      const hang = 1.9 * scallop;
      push([px, py - hang * s, pz + 0.55 * Math.sin(s * 1.5) * 0.9 + 0.1], (x - x0) / (stripe * 2), 0.3 + s * 0.3);
    }
  }
  for (let k = 0; k < nv; k++) {
    for (let i = 0; i < nx; i++) {
      const a = base + k * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export default function Awning() {
  const geo = useMemo(() => memo('extAwning', awningGeometry), []);
  const { x0, x1, yTop, zOut, drop } = AWNING;
  const arm = (x, tilt) => (
    <mesh key={x} geometry={rbox(0.7, 0.7, 10.2, 0.3)} material={M.steel()} position={[x, yTop - drop * 0.5 - 0.6, zOut * 0.5]} rotation={[Math.atan2(drop * 0.9, zOut) + tilt, 0, 0]} />
  );
  return (
    <group>
      <mesh geometry={geo} material={M.awning()} />
      {/* wall rail and front rolled edge */}
      <mesh geometry={rbox(x1 - x0 + 1.2, 1.1, 1.0, 0.4)} material={M.ink()} position={[(x0 + x1) / 2, yTop + 0.2, 0.55]} />
      {[x0 + 2, x1 - 2].map(x => arm(x, 0))}
    </group>
  );
}
