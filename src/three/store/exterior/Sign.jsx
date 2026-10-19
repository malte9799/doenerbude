import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { brand } from '../../../brand/brand.js';
import { exteriorMaterials as M } from '../../materials/store-exterior.js';
import { rng } from '../../geo.js';
import { memo, rbox } from './shapes.js';

// Neon sign above the awning. The wordmark comes from brand.js, is painted to
// a canvas (brand display font once loaded, bold sans as fallback) and shown
// unlit, so it glows in any light. The accent letter is brand red.

export const SIGN = { x: 0.4, y: 26.7, w: 30, h: 5.6, d: 1.9 };
const CW = 2048;
const CH = Math.round((CW * (SIGN.h - 2)) / (SIGN.w - 2));

function paint(canvas) {
  const ctx = canvas.getContext('2d');
  const { before, accent, after } = brand.wordmark;
  const warm = '#FFE9C2';
  const red = brand.colors.red;
  const ink = brand.colors.ink;

  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0, '#2c2826');
  bg.addColorStop(1, '#171413');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  const family = brand.fonts.display;
  let size = CH * 0.78;
  const setFont = s => (ctx.font = `800 ${s}px ${family}`);
  setFont(size);
  const widths = [before, accent, after].map(t => ctx.measureText(t).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const fit = Math.min(1, (CW * 0.9) / total);
  size *= fit;
  setFont(size);
  const ws = [before, accent, after].map(t => ctx.measureText(t).width);
  let x = (CW - ws.reduce((a, b) => a + b, 0)) / 2;
  const y = CH * 0.5;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const parts = [
    [before, warm, '#FFB347', 0],
    [accent, '#FF8A78', red, 1],
    [after, warm, '#FFB347', 2],
  ];
  // Slight hand-set baseline jitter per segment.
  const r = rng(7);
  parts.forEach(([text, core, glow], i) => {
    const dy = (r() - 0.5) * 6;
    // glow
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.2;
    ctx.fillStyle = glow;
    ctx.fillText(text, x, y + dy);
    ctx.fillText(text, x, y + dy);
    ctx.restore();
    // tube body: dim fill + bright rounded outline
    ctx.fillStyle = i === 1 ? '#7a1d17' : '#7c5a3a';
    ctx.fillText(text, x, y + dy);
    ctx.strokeStyle = glow;
    ctx.lineWidth = size * 0.055;
    ctx.strokeText(text, x, y + dy);
    ctx.strokeStyle = core;
    ctx.lineWidth = size * 0.022;
    ctx.strokeText(text, x, y + dy);
    x += ws[i];
  });
  void ink;
}

export default function Sign() {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    paint(canvas);
    return { canvas, texture };
  }, []);

  useEffect(() => {
    let alive = true;
    const redraw = () => {
      if (!alive) return;
      paint(canvas);
      texture.needsUpdate = true;
    };
    const fonts = document.fonts;
    if (fonts?.load) {
      fonts
        .load(`800 120px ${brand.fonts.display}`, brand.wordmark.before + brand.wordmark.accent + brand.wordmark.after)
        .catch(() => {})
        .then(() => fonts.ready)
        .then(redraw, redraw);
    }
    return () => {
      alive = false;
    };
  }, [canvas, texture]);

  const faceMat = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture]);

  // Neon border tube: a hand-drawn rounded rectangle, a little irregular.
  const tube = useMemo(
    () =>
      memo('extSignTube', () => {
        const r = rng(11);
        const w = SIGN.w - 2.6;
        const h = SIGN.h - 2.6;
        const rad = 1.0;
        const pts = [];
        const corner = (cx, cy, a0) => {
          for (let i = 0; i <= 5; i++) {
            const a = a0 + (i / 5) * (Math.PI / 2);
            pts.push(new THREE.Vector3(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, (r() - 0.5) * 0.04));
          }
        };
        corner(w / 2 - rad, h / 2 - rad, 0);
        corner(-w / 2 + rad, h / 2 - rad, Math.PI / 2);
        corner(-w / 2 + rad, -h / 2 + rad, Math.PI);
        corner(w / 2 - rad, -h / 2 + rad, Math.PI * 1.5);
        const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
        return new THREE.TubeGeometry(curve, 160, 0.17, 10, true);
      }),
    [],
  );

  return (
    <group position={[SIGN.x, SIGN.y, 0]} rotation={[0, 0, 0.004]}>
      <mesh geometry={rbox(SIGN.w, SIGN.h, SIGN.d, 0.8, 5)} material={M.ink()} position={[0, 0, SIGN.d / 2]} />
      <mesh material={faceMat} position={[0, 0, SIGN.d + 0.02]}>
        <planeGeometry args={[SIGN.w - 2, SIGN.h - 2]} />
      </mesh>
      <mesh geometry={tube} material={M.neonRed()} position={[0, 0, SIGN.d + 0.1]} />
      <pointLight position={[0, -1.5, 6]} color="#ffb070" intensity={30} distance={26} decay={2} />
    </group>
  );
}
