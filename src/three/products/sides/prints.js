import { brand } from '../../../brand/brand.js';

// Canvas drawings for paper, cans and labels. Everything brand-specific
// (wordmark, colours, fonts) is read from brand.js. Each draw function paints
// into a 2D context of the given size. Wrap-around textures put the front
// (+Z) in the middle of the canvas (the material shifts u by 0.5).

const C = brand.colors;
export const font = (weight, size) => `${weight} ${size}px ${brand.fonts.display}`;

// Text that shrinks to fit a maximum width.
export function fit(ctx, text, x, y, size, maxW, weight = 800) {
  ctx.font = font(weight, size);
  const w = ctx.measureText(text).width;
  if (w > maxW) ctx.font = font(weight, Math.floor((size * maxW) / w));
  ctx.fillText(text, x, y);
}

// "DönerBude" with the accented letter in its own colour.
export function wordmark(ctx, cx, cy, size, { ink = C.ink, accent = C.red } = {}) {
  const { before, accent: mid, after } = brand.wordmark;
  ctx.font = font(800, size);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const wb = ctx.measureText(before).width;
  const wm = ctx.measureText(mid).width;
  const wa = ctx.measureText(after).width;
  let x = cx - (wb + wm + wa) / 2;
  ctx.fillStyle = ink;
  ctx.fillText(before, x, cy);
  x += wb;
  ctx.fillStyle = accent;
  ctx.fillText(mid, x, cy);
  x += wm;
  ctx.fillStyle = ink;
  ctx.fillText(after, x, cy);
  ctx.textAlign = 'center';
  return wb + wm + wa;
}

const wave = (ctx, w, y, amp, len, phase = 0) => {
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin((x / len) * Math.PI * 2 + phase) * amp);
};

const leaf = (ctx, x, y, len, angle, color) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, len, len * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = len * 0.07;
  ctx.beginPath();
  ctx.moveTo(-len * 0.8, 0);
  ctx.lineTo(len * 0.8, 0);
  ctx.stroke();
  ctx.restore();
};

// Paper cone for fries: wordmark on a paper ground, red rim, mustard foot.
export function drawCone(ctx, w, h) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  // diagonal soft stripes
  ctx.fillStyle = 'rgba(215,54,43,0.07)';
  for (let x = -h; x < w; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 45, 0);
    ctx.lineTo(x + 45 + h, h);
    ctx.lineTo(x + h, h);
    ctx.fill();
  }
  ctx.fillStyle = C.red;
  ctx.fillRect(0, 0, w, h * 0.12);
  ctx.fillStyle = C.mustard;
  wave(ctx, w, h * 0.74, 12, 130);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.fillStyle = C.red;
  wave(ctx, w, h * 0.74 - 22, 12, 130, 0.5);
  ctx.lineTo(w, h * 0.74 - 8);
  ctx.lineTo(0, h * 0.74 - 8);
  ctx.fill();
  for (const x of [w / 2, 0, w]) wordmark(ctx, x, h * 0.42, h * 0.125);
}

export function drawAyran(ctx, w, h, name) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(1, '#F1EADC');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.red;
  wave(ctx, w, h * 0.74, 14, 170);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.fillStyle = C.herb;
  wave(ctx, w, h * 0.72 - 20, 14, 170, 0.8);
  ctx.lineTo(w, h * 0.72 - 6);
  ctx.lineTo(0, h * 0.72 - 6);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const x of [w / 2, 0, w]) {
    ctx.fillStyle = C.ink;
    fit(ctx, name, x, h * 0.3, h * 0.26, w * 0.24);
    leaf(ctx, x + w * 0.14, h * 0.2, 26, -0.6, '#5BA83A');
    leaf(ctx, x + w * 0.17, h * 0.27, 22, 0.2, '#79C24F');
    wordmark(ctx, x, h * 0.55, h * 0.1);
  }
}

export function drawCan(ctx, w, h, name) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#B22A1E');
  g.addColorStop(1, '#6E1710');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // cream swoosh
  ctx.fillStyle = '#FFF1D6';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.bezierCurveTo(w * 0.25, h * 0.4, w * 0.5, h * 0.82, w, h * 0.5);
  ctx.lineTo(w, h * 0.6);
  ctx.bezierCurveTo(w * 0.5, h * 0.92, w * 0.25, h * 0.52, 0, h * 0.72);
  ctx.fill();
  ctx.fillStyle = C.mustard;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.74);
  ctx.bezierCurveTo(w * 0.25, h * 0.54, w * 0.5, h * 0.94, w, h * 0.62);
  ctx.lineTo(w, h * 0.66);
  ctx.bezierCurveTo(w * 0.5, h * 0.98, w * 0.25, h * 0.58, 0, h * 0.78);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const x of [w / 2, 0, w]) {
    ctx.save();
    ctx.translate(x, h * 0.36);
    ctx.rotate(-0.06);
    ctx.lineJoin = 'round';
    ctx.lineWidth = h * 0.05;
    ctx.strokeStyle = '#4A0E0A';
    ctx.font = font(800, h * 0.3);
    ctx.strokeText(name, 0, 0);
    ctx.fillStyle = '#FFF1D6';
    ctx.fillText(name, 0, 0);
    ctx.restore();
    wordmark(ctx, x, h * 0.14, h * 0.07, { ink: '#FFF1D6', accent: C.mustard });
    ctx.fillStyle = '#FFF1D6';
    ctx.font = font(700, h * 0.055);
    ctx.fillText('0,33 l', x, h * 0.92);
  }
}

export function drawBottleLabel(ctx, w, h, name, kind) {
  const water = kind === 'water';
  const bg = water ? '#8ED3F3' : '#FBD64A';
  const dark = water ? '#17607F' : C.ink;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // waves / bubbles
  ctx.fillStyle = water ? '#FFFFFF' : '#FFF3A6';
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 3; i++) {
    wave(ctx, w, h * (0.78 + i * 0.07), 8, 140, i);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = water ? '#5CB9E4' : C.mustard;
  wave(ctx, w, h * 0.9, 8, 140, 2);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const x of [w / 2, 0, w]) {
    ctx.fillStyle = dark;
    fit(ctx, name, x, h * 0.4, h * 0.3, w * 0.26);
    wordmark(ctx, x, h * 0.13, h * 0.1, { ink: dark, accent: water ? '#FFFFFF' : C.red });
    if (water) {
      // droplet
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(x, h * 0.6);
      ctx.bezierCurveTo(x + 36, h * 0.68, x + 28, h * 0.78, x, h * 0.78);
      ctx.bezierCurveTo(x - 28, h * 0.78, x - 36, h * 0.68, x, h * 0.6);
      ctx.fill();
    } else {
      // lemon
      ctx.save();
      ctx.translate(x, h * 0.69);
      ctx.rotate(-0.25);
      ctx.fillStyle = '#FFE84A';
      ctx.strokeStyle = '#C99A12';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(0, 0, 54, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFE84A';
      ctx.beginPath();
      ctx.ellipse(56, -2, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      leaf(ctx, x + 70, h * 0.62, 22, -0.8, '#5BA83A');
    }
  }
}

// Sticker band on the sauce cup: variant colour stripe and wordmark.
export function drawDipBand(ctx, w, h, color) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h * 0.2);
  ctx.fillRect(0, h * 0.8, w, h * 0.2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const x of [w / 2, 0, w]) wordmark(ctx, x, h / 2, h * 0.38);
}

// Foil lid of the ayran cup (disc uv).
export function drawFoil(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(1, '#E4DED2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.mustard;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.33, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'center';
  wordmark(ctx, w / 2, h / 2, w * 0.12, { ink: '#FFFFFF', accent: C.mustard });
}
