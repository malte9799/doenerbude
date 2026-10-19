import * as THREE from 'three';
import { brand } from '../../brand/brand.js';
import { fluent, once, plain, textured, wet } from './index.js';

// Materials of the döner family (Dürüm, box, plate, lahmacun). Bread, meat
// and vegetables come from the shared library in ./index.js.

// Draws the brand wordmark (accent letter in `accent`) centred at cx, cy.
function wordmark(ctx, cx, cy, size, ink, accent) {
  const { before, accent: mid, after } = brand.wordmark;
  ctx.font = `800 ${size}px ${brand.fonts.display}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const w = [before, mid, after].map(s => ctx.measureText(s).width);
  let x = cx - (w[0] + w[1] + w[2]) / 2;
  [before, mid, after].forEach((s, i) => {
    ctx.fillStyle = i === 1 ? accent : ink;
    ctx.fillText(s, x, cy);
    x += w[i];
  });
}

function canvasMaterial(width, height, draw, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.wrapS = THREE.RepeatWrapping;
  // The wrapped surfaces start their u at the front (+z): centre the print there.
  map.offset.x = 0.5;
  return fluent(new THREE.MeshPhysicalMaterial({ map, roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), ...opts }), { rim: '#ffffff', rimStrength: 0.2 });
}

export const dfMaterials = {
  // Greaseproof wrap paper with the brand wordmark on the front. Lathe uv: u around, v up.
  paper: () =>
    once('dfPaper', () =>
      canvasMaterial(2048, 1024, (ctx, w, h) => {
        ctx.fillStyle = brand.colors.paper;
        ctx.fillRect(0, 0, w, h);
        // Fine grease-proof stripes plus small dots, then the wordmark.
        ctx.fillStyle = 'rgba(215,54,43,0.10)';
        for (let y = 40; y < h; y += 96) ctx.fillRect(0, y, w, 10);
        ctx.fillStyle = 'rgba(242,178,51,0.35)';
        for (let i = 0; i < 140; i++) {
          const x = (i * 331) % w;
          const y = (i * 197) % h;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, 7);
          ctx.fill();
        }
        for (const [cx, s] of [[w / 2, 0.66], [0, 0.55], [w, 0.55]]) {
          ctx.fillStyle = brand.colors.paper;
          ctx.fillRect(cx - 330 * s, h / 2 - 120 * s, 660 * s, 240 * s);
          wordmark(ctx, cx, h / 2, 150 * s, brand.colors.ink, brand.colors.red);
        }
      }, { roughness: 0.62, side: THREE.DoubleSide }),
    ),
  // Takeaway box: brand-red outside with a white wordmark band.
  boxPrint: () =>
    once('dfBoxPrint', () =>
      canvasMaterial(2048, 1024, (ctx, w, h) => {
        ctx.fillStyle = brand.colors.red;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 24, h);
        for (const [cx, s] of [[w / 2, 0.52], [0, 0.46], [w, 0.46], [w / 4, 0.34], [(3 * w) / 4, 0.34]]) {
          ctx.fillStyle = brand.colors.paper;
          ctx.beginPath();
          ctx.roundRect(cx - 530 * s, h * 0.3 - 130 * s, 1060 * s, 260 * s, 80 * s);
          ctx.fill();
          wordmark(ctx, cx, h * 0.3, 160 * s, brand.colors.ink, brand.colors.red);
        }
      }, { roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    ),
  kraft: () => once('dfKraftMat', () => textured('dfKraft', { rim: '#ffe2b0', rimStrength: 0.25, sheen: 0.2, side: THREE.DoubleSide })),
  yufka: () => once('dfYufkaMat', () => textured('dfYufka', { rim: '#fff0cc', rimStrength: 0.3, sheen: 0.5, side: THREE.DoubleSide })),
  fries: () => once('dfFriesMat', () => textured('dfFries', { rim: '#ffe17a', rimStrength: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.4 })),
  lahmacun: () => once('dfLahmacunMat', () => textured('dfLahmacun', { rim: '#ffc890', rimStrength: 0.3, sheen: 0.3, side: THREE.DoubleSide, clearcoat: 0.2, clearcoatRoughness: 0.5 })),
  lemon: () => once('dfLemonMat', () => textured('dfLemon', { rim: '#fff6a0', rimStrength: 0.45, ...wet })),
  plate: () => once('dfPlate', () => plain('#FFFBF2', '#ffffff', { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 })),
  plateRim: () => once('dfPlateRim', () => plain(brand.colors.red, '#ff9a8a', { roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 })),
  rice: () => once('dfRice', () => plain('#FFF6DC', '#ffffff', { roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.4 })),
};
