import { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { brand } from '../../../brand/brand.js';
import { pizzaExtras } from '../../materials/pizza-extras.js';
import Pizza from './Pizza.jsx';

// Open cardboard pizza box (33 cm inner), lid up at ~100 degrees. The lid
// carries the brand wordmark on both faces (outside, and inside facing the
// viewer when open), drawn into a CanvasTexture from src/brand/brand.js.

const INNER = 3.28;
const WALL = 0.06;
const WALL_H = 0.4;
const FLOOR = 0.05;
const OUT = INNER + WALL * 2;

const cache = {};
const box = (w, h, d, r = 0.02) =>
  (cache[`${w}|${h}|${d}`] ??= (() => {
    const g = new RoundedBoxGeometry(w, h, d, 3, r);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 3);
    return g;
  })());

function drawPrint(canvas) {
  const ctx = canvas.getContext('2d');
  const S = canvas.width;
  ctx.clearRect(0, 0, S, S);
  const { before, accent, after } = brand.wordmark;
  const font = size => `800 ${size}px ${brand.fonts.display}`;
  let size = S * 0.19;
  ctx.font = font(size);
  const parts = [before, accent, after];
  let widths = parts.map(p => ctx.measureText(p).width);
  const total = widths.reduce((a, b) => a + b, 0);
  if (total > S * 0.84) {
    size *= (S * 0.84) / total;
    ctx.font = font(size);
    widths = parts.map(p => ctx.measureText(p).width);
  }
  let x = (S - widths.reduce((a, b) => a + b, 0)) / 2;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const y = S * 0.46;
  parts.forEach((p, i) => {
    ctx.fillStyle = i === 1 ? brand.colors.red : brand.colors.ink;
    ctx.fillText(p, x, y);
    x += widths[i];
  });
  // Rule + slogan.
  ctx.fillStyle = brand.colors.ink;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(S * 0.3, S * 0.58, S * 0.4, S * 0.008);
  ctx.textAlign = 'center';
  ctx.font = `600 ${S * 0.04}px ${brand.fonts.body}`;
  ctx.fillText(brand.slogan, S / 2, S * 0.66, S * 0.8);
  ctx.globalAlpha = 1;
}

function usePrint() {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    drawPrint(canvas);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => {
    let live = true;
    const redraw = () => {
      if (!live) return;
      drawPrint(map.image);
      map.needsUpdate = true;
    };
    document.fonts?.ready.then(redraw);
    // Make sure the display face is actually loaded before drawing.
    document.fonts?.load(`800 64px ${brand.fonts.display}`).then(redraw, () => {});
    return () => {
      live = false;
    };
  }, [map]);
  return map;
}

// Pizza box props: `withPizza` puts a baked pizza inside; `active` are its
// toppings (defaults to the standard salami pizza); `lid` is the opening angle.
export default function PizzaBox({ active, withPizza = true, lid = 100 }) {
  const card = useMemo(() => pizzaExtras.cardboard(), []);
  const map = usePrint();
  const printMat = useMemo(() => pizzaExtras.print(map), [map]);
  useLayoutEffect(() => () => printMat.dispose(), [printMat]);
  const toppings = active?.length ? active : ['tomatoSauce', 'cheese', 'salami'];
  const half = OUT / 2 - WALL / 2;

  const part = (g, p, key) => <mesh key={key} geometry={g} material={card} position={p} castShadow receiveShadow />;

  return (
    <group>
      {part(box(OUT, FLOOR, OUT), [0, FLOOR / 2, 0], 'floor')}
      {part(box(OUT, WALL_H, WALL), [0, FLOOR + WALL_H / 2 - 0.01, half], 'front')}
      {part(box(OUT, WALL_H + 0.05, WALL), [0, FLOOR + (WALL_H + 0.05) / 2 - 0.01, -half], 'back')}
      {part(box(WALL, WALL_H, INNER), [half, FLOOR + WALL_H / 2 - 0.01, 0], 'right')}
      {part(box(WALL, WALL_H, INNER), [-half, FLOOR + WALL_H / 2 - 0.01, 0], 'left')}

      {withPizza && (
        <group position={[0, FLOOR - 0.005, 0.02]} rotation={[0, 0.5, 0]}>
          <Pizza active={toppings} baked />
        </group>
      )}

      {/* Lid hinged on the back wall; at 0° it would lie closed. */}
      <group position={[0, FLOOR + WALL_H + 0.04, -half - 0.02]} rotation={[-(lid * Math.PI) / 180, 0, 0]}>
        {part(box(OUT, 0.045, OUT), [0, 0.0225, OUT / 2], 'panel')}
        {part(box(OUT, 0.34, 0.045), [0, -0.15, OUT - 0.0225], 'flap')}
        <mesh position={[0, 0.047, OUT / 2]} rotation={[-Math.PI / 2, 0, 0]} material={printMat} renderOrder={2}>
          <planeGeometry args={[3.1, 3.1]} />
        </mesh>
        <mesh position={[0, -0.002, OUT / 2]} rotation={[Math.PI / 2, 0, 0]} material={printMat} renderOrder={2}>
          <planeGeometry args={[3.1, 3.1]} />
        </mesh>
      </group>
    </group>
  );
}
