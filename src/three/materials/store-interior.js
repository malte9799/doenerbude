import * as THREE from 'three';
import { once, plain, textured, wet } from './index.js';
import { tex } from '../tex/textures.js';

// Materials of the store interior. Calm and matte so the products stay the
// stars: tiles, oak, brushed steel, warm plaster. Emissive parts (fire,
// heater, bulbs) are unlit basic materials.

const steel = (extra = {}) => textured('intSteel', { rim: '#ffffff', rimStrength: 0.25, metalness: 0.45, sheen: 0, clearcoat: 0.2, clearcoatRoughness: 0.4, ...extra });

export const intMaterials = {
  floor: () => once('intFloor', () => textured('intFloorTile', { rim: '#fff0d6', rimStrength: 0.2, sheen: 0.1, clearcoat: 0.25, clearcoatRoughness: 0.35 })),
  wallTile: () => once('intWallTile', () => textured('intWallTile', { rim: '#eaffdc', rimStrength: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 })),
  plaster: () => once('intPlaster', () => textured('intPlaster', { rim: '#fff2dc', rimStrength: 0.2, sheen: 0.2 })),
  ceiling: () => once('intCeiling', () => textured('intPlaster', { rim: '#fff2dc', rimStrength: 0.15, sheen: 0.1, color: '#fff6ea' })),
  trim: () => once('intTrim', () => plain('#F2B233', '#fff0b8', { roughness: 0.5 })),
  tileRed: () => once('intTileRed', () => textured('intTileRed', { rim: '#ff8a70', rimStrength: 0.3, sheen: 0, clearcoat: 0.5, clearcoatRoughness: 0.2 })),
  tileMustard: () => once('intTileMustard', () => textured('intTileMustard', { rim: '#fff0b0', rimStrength: 0.3, sheen: 0, clearcoat: 0.5, clearcoatRoughness: 0.2 })),
  wood: () => once('intWood', () => textured('intWood', { rim: '#ffe4b8', rimStrength: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.4 })),
  woodDark: () => once('intWoodDark', () => textured('intWood', { rim: '#ffd9a8', rimStrength: 0.25, color: '#b98a60', clearcoat: 0.2, clearcoatRoughness: 0.45 })),
  steel: () => once('intSteel', () => steel()),
  steelWarm: () => once('intSteelWarm', () => steel({ color: '#ffe9d0' })),
  brick: () => once('intBrick', () => textured('intBrick', { rim: '#ffd9a8', rimStrength: 0.3, sheen: 0.2 })),
  spitMeat: () => once('intSpitMeat', () => textured('intSpitMeat', { rim: '#ffb57a', rimStrength: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3 })),
  enamelCream: () => once('intEnamelCream', () => plain('#F7EEDC', '#ffffff', { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 })),
  enamelMint: () => once('intEnamelMint', () => plain('#BFE3CF', '#f0fff6', { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 })),
  enamelRed: () => once('intEnamelRed', () => plain('#D7362B', '#ff9a86', { roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 })),
  enamelMustard: () => once('intEnamelMustard', () => plain('#F2B233', '#fff2b8', { roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 })),
  enamelHerb: () => once('intEnamelHerb', () => plain('#5E9A3A', '#d4ffb0', { roughness: 0.4 })),
  ink: () => once('intInk', () => plain('#2A2623', '#8a7f78', { roughness: 0.55 })),
  rubber: () => once('intRubber', () => plain('#3B3532', '#7a6f68', { roughness: 0.8, sheen: 0.1 })),
  terracotta: () => once('intTerracotta', () => plain('#D98A5C', '#ffcaa0', { roughness: 0.7 })),
  soil: () => once('intSoil', () => plain('#5A3E2B', '#9c7556', { roughness: 0.95 })),
  leaf: () => once('intLeaf', () => plain('#5FA844', '#d8ffb0', { roughness: 0.4, ...wet, clearcoat: 0.3 })),
  leafDark: () => once('intLeafDark', () => plain('#3F8A3A', '#c0f59c', { roughness: 0.45, clearcoat: 0.3 })),
  glass: () =>
    once('intGlass', () =>
      plain('#DDF3F2', '#ffffff', { roughness: 0.05, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    ),
  glassBlue: () =>
    once('intGlassBlue', () =>
      plain('#BFE6F2', '#ffffff', { roughness: 0.05, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    ),
  // Unlit emissives
  fire: () => once('intFire', () => new THREE.MeshBasicMaterial({ map: tex('intFire').map, toneMapped: false })),
  heater: () => once('intHeater', () => new THREE.MeshBasicMaterial({ map: tex('intHeater').map, toneMapped: false })),
  bulb: () => once('intBulb', () => new THREE.MeshBasicMaterial({ color: '#FFE2A8', toneMapped: false })),
  stripLight: () => once('intStripLight', () => new THREE.MeshBasicMaterial({ color: '#FFF3D6', toneMapped: false })),
  marker: color => once(`intMarker${color}`, () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthTest: false, toneMapped: false })),
};
