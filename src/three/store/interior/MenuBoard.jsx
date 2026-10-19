import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { brand } from '../../../brand/brand.js';
import { intMaterials as M } from '../../materials/store-interior.js';
import { PLAN } from './anchors.js';
import { Box } from './Parts.jsx';

// Menu board above the counter. The face is a canvas painted from the brand
// config (wordmark, accent colour, slogan, opening hours) with the brand font;
// it repaints once the fonts are ready.

const BW = 23;
const BH = 6.4;
const CW = 2048;
const CH = Math.round((CW * BH) / BW);

function paint(ctx) {
  const { colors, fonts, wordmark, slogan, hours } = brand;
  ctx.clearRect(0, 0, CW, CH);
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0, '#2E2926');
  bg.addColorStop(1, '#1D1917');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);
  // soft inner line
  ctx.strokeStyle = colors.mustard;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(28, 28, CW - 56, CH - 56, 40);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // wordmark, centred, with the accent letter in its own colour and a neon glow
  const size = 250;
  ctx.font = `800 ${size}px ${fonts.display}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const parts = [
    [wordmark.before, colors.paper],
    [wordmark.accent, colors.red],
    [wordmark.after, colors.paper],
  ];
  const widths = parts.map(([t]) => ctx.measureText(t).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = (CW - total) / 2;
  const y = CH * 0.52;
  parts.forEach(([text, color], i) => {
    ctx.shadowColor = color === colors.red ? colors.red : colors.mustard;
    ctx.shadowBlur = color === colors.red ? 60 : 26;
    ctx.fillStyle = color === colors.red ? '#FF6A57' : color;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color === colors.red ? colors.red : color;
    ctx.fillText(text, x, y);
    x += widths[i];
  });
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.fillStyle = colors.mustard;
  ctx.font = `700 74px ${fonts.display}`;
  ctx.fillText(slogan, CW / 2, CH * 0.72);

  ctx.fillStyle = '#CFC6BB';
  ctx.font = `500 50px ${fonts.body}`;
  ctx.fillText(hours.map(h => `${h.days}  ${h.time}`).join('     •     '), CW / 2, CH * 0.89);
}

export default function MenuBoard() {
  const c = PLAN.counter;
  const cx = (c.x0 + c.x1) / 2;
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    paint(canvas.getContext('2d'));
    return { canvas, texture };
  }, []);

  useEffect(() => {
    let live = true;
    const redraw = () => {
      if (!live) return;
      paint(canvas.getContext('2d'));
      texture.needsUpdate = true;
    };
    const f = document.fonts;
    if (f) {
      Promise.all([f.load(`800 100px ${brand.fonts.display}`), f.load(`500 40px ${brand.fonts.body}`)])
        .catch(() => {})
        .then(() => f.ready)
        .then(redraw);
    }
    return () => {
      live = false;
    };
  }, [canvas, texture]);

  const y = 26.2;
  return (
    <group position={[cx, y, -39.5]} rotation={[0, 0, 0.004]}>
      <Box s={[BW + 1.2, BH + 1.2, 0.8]} r={0.4} m={M.enamelMustard()} />
      <Box s={[BW + 0.2, BH + 0.2, 0.9]} r={0.3} p={[0, 0, 0.02]} m={M.ink()} />
      <mesh position={[0, 0, 0.5]}>
        <planeGeometry args={[BW, BH]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
