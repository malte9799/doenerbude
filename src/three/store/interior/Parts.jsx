import { useMemo } from 'react';
import * as THREE from 'three';
import { rbox, softCylinder } from './helpers.js';

// Rounded box from bounds (x0..x1, y0..y1, z0..z1) – matches how the plan is written.
export function BoxAt({ x, y, z, r = 0.2, uv = 0.25, m, rot, children, ...rest }) {
  const w = x[1] - x[0];
  const h = y[1] - y[0];
  const d = z[1] - z[0];
  return (
    <mesh geometry={rbox(w, h, d, r, uv)} material={m} position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]} rotation={rot} {...rest}>
      {children}
    </mesh>
  );
}

// Rounded box from size + centre.
export function Box({ s, p = [0, 0, 0], r = 0.2, uv = 0.25, m, rot, ...rest }) {
  return <mesh geometry={rbox(s[0], s[1], s[2], r, uv)} material={m} position={p} rotation={rot} {...rest} />;
}

// Soft-edged vertical cylinder standing on y = p[1].
export function Cyl({ r, h, bevel = 0.2, p = [0, 0, 0], m, rot, ...rest }) {
  return <mesh geometry={softCylinder(r, h, bevel)} material={m} position={p} rotation={rot} {...rest} />;
}

// Plain round rod between y0 and y1 (legs, poles).
export function Rod({ r = 0.25, y = [0, 1], p = [0, 0], m, rot, taper = 1, ...rest }) {
  const g = useMemo(() => new THREE.CylinderGeometry(r * taper, r, y[1] - y[0], 16), [r, y, taper]);
  return <mesh geometry={g} material={m} position={[p[0], (y[0] + y[1]) / 2, p[1]]} rotation={rot} {...rest} />;
}

// Soft contact shadow blob on the floor: fakes the ambient occlusion the
// shared studio light does not provide over a whole room.
let blobTexture;
const getBlob = () => {
  if (blobTexture) return blobTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, 'rgba(60,35,20,0.55)');
  grad.addColorStop(0.55, 'rgba(60,35,20,0.28)');
  grad.addColorStop(1, 'rgba(60,35,20,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  blobTexture = new THREE.CanvasTexture(c);
  blobTexture.colorSpace = THREE.SRGBColorSpace;
  return blobTexture;
};
let blobMaterial;
export function Blob({ x, z, w, d, strength = 1, rot = 0 }) {
  blobMaterial ??= new THREE.MeshBasicMaterial({ map: getBlob(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false });
  return <mesh material={blobMaterial} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, rot]} scale={[w, d, 1]} renderOrder={1} userData={{ strength }}><planeGeometry args={[1, 1]} /></mesh>;
}
