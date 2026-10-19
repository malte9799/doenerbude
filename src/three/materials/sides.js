import * as THREE from 'three';
import { fluent, once, plain, textured, wet } from './index.js';
import { brand } from '../../brand/brand.js';
import { drawAyran, drawBottleLabel, drawCan, drawCone, drawDipBand, drawFoil } from '../products/sides/prints.js';

// Materials for sides, sauces, dessert and drinks. Printed packaging is
// drawn on a canvas with the brand font (redrawn once the font is loaded).
// Glass and plastic are cheap fakes: tinted alpha, clearcoat, rim.

function canvasTexture(w, h, draw, { wrap = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) {
    // Front (+Z) sits in the middle of the canvas, the seam at the back.
    t.wrapS = THREE.RepeatWrapping;
    t.offset.x = 0.5;
  }
  const paint = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    draw(ctx, w, h);
    t.needsUpdate = true;
  };
  paint();
  // Redraw when the brand font is really available.
  const fonts = typeof document !== 'undefined' ? document.fonts : null;
  if (fonts?.load) {
    Promise.all([fonts.load(`800 40px ${brand.fonts.display}`), fonts.ready]).then(paint, () => {});
  }
  return t;
}

const print = (key, w, h, draw, opts = {}) =>
  once(key, () => {
    const map = canvasTexture(w, h, draw, opts);
    return fluent(
      new THREE.MeshPhysicalMaterial({ map, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color('#fff4e0'), side: opts.side ?? THREE.FrontSide, ...opts.mat }),
      { rim: opts.rim ?? '#fff1d6', rimStrength: 0.25 },
    );
  });

// Cheap glass / plastic: tinted translucent shell with strong gloss.
const tint = (key, color, opacity, rim) =>
  once(key, () =>
    fluent(
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity, depthWrite: false, side: THREE.FrontSide }),
      { rim, rimStrength: 0.6, rimPower: 2.2 },
    ),
  );

const sauceKey = { garlic: 'sdSauceGarlic', herb: 'sdSauceHerb', hot: 'sdSauceHot', cocktail: 'sdSauceCocktail' };
const sauceRim = { garlic: '#ffffff', herb: '#e8ffd0', hot: '#ff7a5a', cocktail: '#ffc2c8' };
export const dipColors = { garlic: '#F2B233', herb: '#5E9A3A', hot: '#D7362B', cocktail: '#E9707C' };

export const sides = {
  // Food
  fry: () => once('sdFry', () => textured('sdFry', { rim: '#ffe9a0', rimStrength: 0.35, clearcoat: 0.15, clearcoatRoughness: 0.5 })),
  pastry: () => once('sdPastry', () => textured('sdPastry', { rim: '#ffd9a0', rimStrength: 0.35, clearcoat: 0.25, clearcoatRoughness: 0.35 })),
  pastryCut: () => once('sdPastryCut', () => textured('sdPastryCut', { rim: '#fff0c8', rimStrength: 0.3 })),
  baklavaSide: () => once('sdBaklavaSide', () => textured('sdBaklavaSide', { rim: '#ffd58a', rimStrength: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.2 })),
  baklavaTop: () => once('sdBaklavaTop', () => textured('sdBaklavaTop', { rim: '#ffd58a', rimStrength: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 })),
  sauce: variant => once(`sauce-${variant}`, () => textured(sauceKey[variant], { rim: sauceRim[variant], rimStrength: 0.35, sheen: 0, clearcoat: 1, clearcoatRoughness: 0.08 })),
  salt: () => once('sdSalt', () => plain('#ffffff', '#ffffff', { roughness: 0.3, clearcoat: 0.6 })),
  pistachio: () => once('sdPistachio', () => plain('#86BE3F', '#d8ff9c', { roughness: 0.4, clearcoat: 0.3 })),
  pistachioDark: () => once('sdPistachioDark', () => plain('#5C9A2C', '#c8f08a', { roughness: 0.4 })),
  syrup: () => once('sdSyrup', () => plain('#E88A16', '#ffd38a', { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 })),
  olive: () => once('sdOlive', () => plain('#3F2F49', '#a988b8', { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 })),
  oliveGreen: () => once('sdOliveGreen', () => plain('#8A9A2E', '#e8f08a', { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 })),
  herb: () => once('sdHerb', () => plain('#4F9A33', '#c8f08a', { roughness: 0.35, side: THREE.DoubleSide })),
  chiliPod: () => once('sdChiliPod', () => plain('#D5281A', '#ff8a66', { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 })),

  // Tableware
  ceramic: () => once('sdCeramic', () => plain('#FBF6EE', '#ffffff', { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 })),
  ceramicRed: () => once('sdCeramicRed', () => plain(brand.colors.red, '#ff8a76', { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 })),
  ceramicMustard: () => once('sdCeramicMustard', () => plain(brand.colors.mustard, '#ffe09a', { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 })),
  paperPlain: () => once('sdPaperPlain', () => plain(brand.colors.paper, '#ffffff', { roughness: 0.7, side: THREE.DoubleSide })),
  paperRed: () => once('sdPaperRed', () => plain(brand.colors.red, '#ff8a76', { roughness: 0.6, side: THREE.DoubleSide })),
  metal: () => once('sdMetal', () => plain('#D9D5CC', '#ffffff', { roughness: 0.3, metalness: 0.45, clearcoat: 0.6 })),
  capBlue: () => once('sdCapBlue', () => plain('#2F8FD0', '#9fdcff', { roughness: 0.3, clearcoat: 0.8 })),
  capRed: () => once('sdCapRed', () => plain(brand.colors.red, '#ff8a76', { roughness: 0.3, metalness: 0.3, clearcoat: 0.8 })),
  cupClear: () => tint('sdCupClear', '#ffffff', 0.38, '#ffffff'),
  water: () => tint('sdWater', '#7CCBEE', 0.62, '#d8f4ff'),
  bottleClear: () => tint('sdBottleClear', '#E8F6FF', 0.14, '#ffffff'),
  lemonade: () => tint('sdLemonade', '#F3E25A', 0.62, '#fff7a0'),
  glassYellow: () => tint('sdGlassYellow', '#FFF4B0', 0.3, '#ffffff'),

  // Printed packaging
  cone: () => print('sdPrintCone', 1024, 440, drawCone, { mat: { clearcoat: 0.1 } }),
  ayranCup: name => print(`sdPrintAyran-${name}`, 1024, 400, (c, w, h) => drawAyran(c, w, h, name), { mat: { clearcoat: 0.5, clearcoatRoughness: 0.2 } }),
  can: name => print(`sdPrintCan-${name}`, 1024, 504, (c, w, h) => drawCan(c, w, h, name), { rim: '#ff9a80', mat: { roughness: 0.28, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 } }),
  label: (kind, name) => print(`sdPrintLabel-${kind}-${name}`, 1024, 360, (c, w, h) => drawBottleLabel(c, w, h, name, kind), { mat: { clearcoat: 0.6, clearcoatRoughness: 0.2 } }),
  dipBand: variant => print(`sdPrintDip-${variant}`, 1024, 120, (c, w, h) => drawDipBand(c, w, h, dipColors[variant]), { mat: { clearcoat: 0.5 } }),
  foil: () => print('sdPrintFoil', 512, 512, drawFoil, { wrap: false, mat: { roughness: 0.3, metalness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.15 } }),
};

export { wet };
