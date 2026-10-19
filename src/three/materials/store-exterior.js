import * as THREE from 'three';
import { once, plain, textured, triplanar } from './index.js';
import { tex } from '../tex/textures.js';
import { brand } from '../../brand/brand.js';

// Materials of the shop exterior. Built with the shared helpers; colours that
// belong to the brand are read from brand.js.

const C = brand.colors;

export const exteriorMaterials = {
  plaster: () => once('extPlaster', () => triplanar(textured('extPlaster', { rim: '#fff0d6', rimStrength: 0.25, sheen: 0.2 }), 0.1)),
  tiles: () => once('extTiles', () => triplanar(textured('extTiles', { rim: '#d8f5c0', rimStrength: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.15, normalScale: 0.8 }), 1 / 6)),
  paving: () => once('extPaving', () => triplanar(textured('extPaving', { rim: '#fff4e4', rimStrength: 0.2, sheen: 0.1 }), 1 / 8)),
  asphalt: () => once('extAsphalt', () => triplanar(textured('extAsphalt', { rim: '#9fb0ff', rimStrength: 0.25, sheen: 0.1 }), 0.09)),
  stone: () => once('extStone', () => triplanar(textured('extStone', { rim: '#ffd9b0', rimStrength: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.4 }), 0.08)),
  wood: () => once('extWood', () => triplanar(textured('extWood', { rim: '#ffd9a0', rimStrength: 0.3 }), 0.2)),
  awning: () => once('extAwning', () => textured('extAwning', { rim: '#ffe6d8', rimStrength: 0.3, side: THREE.DoubleSide, normalScale: 0.5 })),
  chalk: () => once('extChalk', () => textured('extChalk', { rim: '#cfe0d8', rimStrength: 0.15, sheen: 0 })),

  // Painted plain colours
  red: () => once('extRed', () => plain(C.red, '#ff9a8c', { roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.35 })),
  paper: () => once('extPaper', () => plain(C.paper, '#ffffff', { roughness: 0.55 })),
  mustard: () => once('extMustard', () => plain(C.mustard, '#fff0b0', { roughness: 0.45, clearcoat: 0.3 })),
  ink: () => once('extInk', () => plain('#2A2725', '#a89888', { roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3 })),
  inkSoft: () => once('extInkSoft', () => plain('#3A3532', '#bba898', { roughness: 0.55 })),
  trim: () => once('extTrim', () => plain('#FFF3DC', '#ffffff', { roughness: 0.5 })),
  roof: () => once('extRoof', () => plain('#4B4642', '#c0b0a0', { roughness: 0.8 })),
  steel: () => once('extSteel', () => plain('#B9C1C8', '#ffffff', { roughness: 0.3, metalness: 0.7, clearcoat: 0.3 })),
  brass: () => once('extBrass', () => plain('#E3B04B', '#fff0b0', { roughness: 0.3, metalness: 0.6 })),
  leaf: () => once('extLeaf', () => plain('#5E9A3A', '#d6ff9a', { roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.3 })),
  leafDark: () => once('extLeafDark', () => plain('#467C2C', '#b8f27e', { roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.3 })),
  terracotta: () => once('extTerracotta', () => plain('#D2683A', '#ffc09a', { roughness: 0.65 })),
  soil: () => once('extSoil', () => plain('#4A3226', '#a08068', { roughness: 0.9 })),

  // Glass: nearly clear with a thin white reflection, bright rim.
  glass: () =>
    once('extGlass', () =>
      plain('#dff4ff', '#ffffff', { roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, side: THREE.DoubleSide }),
    ),

  // Unlit (emissive-looking) surfaces
  glow: () => once('extGlow', () => new THREE.MeshBasicMaterial({ map: tex('extWindowGlow').map, toneMapped: false })),
  glowPool: () =>
    once('extGlowPool', () =>
      new THREE.MeshBasicMaterial({ map: tex('extSoft').map, color: '#ff9a40', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55, toneMapped: false }),
    ),
  shadow: () =>
    once('extShadow', () =>
      new THREE.MeshBasicMaterial({ map: tex('extSoft').map, color: '#1c1410', transparent: true, depthWrite: false, opacity: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    ),
  neonRed: () => once('extNeonRed', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(C.red).multiplyScalar(1.5), toneMapped: false })),
  lampBulb: () => once('extLampBulb', () => new THREE.MeshBasicMaterial({ color: '#fff0c0', toneMapped: false })),
};
