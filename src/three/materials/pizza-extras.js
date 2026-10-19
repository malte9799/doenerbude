import * as THREE from 'three';
import { fluent, once, plain, textured, wet } from './index.js';

// Materials for the pizza extras (toppings + box). Textures: recipes/pizza-extras.js.

export const pizzaExtras = {
  chicken: () => once('pzChicken', () => textured('pzChicken', { rim: '#ffd9a0', rimStrength: 0.35, clearcoat: 0.25, clearcoatRoughness: 0.4 })),
  tuna: () => once('pzTuna', () => textured('pzTuna', { rim: '#ffd8c4', rimStrength: 0.35, sheen: 0.1, clearcoat: 0.45, clearcoatRoughness: 0.3 })),
  redOnion: () => once('pzRedOnion', () => textured('pzRedOnion', { rim: '#f4b0e6', rimStrength: 0.45, ...wet })),
  corn: () => once('pzCorn', () => textured('pzCorn', { rim: '#fff0a0', rimStrength: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.15 })),
  jalapeno: () => once('pzJalapeno', () => textured('pzJalapeno', { rim: '#d8ff9a', rimStrength: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.15 })),
  rucola: () => once('pzRucola', () => textured('pzRucola', { rim: '#c8ff8a', rimStrength: 0.45, side: THREE.DoubleSide, ...wet, clearcoat: 0.5 })),
  cardboard: () => once('pzCardboard', () => textured('pzCardboard', { rim: '#ffe2b4', rimStrength: 0.25, sheen: 0.15, side: THREE.DoubleSide })),
  // Printed lid: transparent canvas decal, lit like paper.
  print: map =>
    fluent(new THREE.MeshPhysicalMaterial({ map, transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { rim: '#ffffff', rimStrength: 0.1 }),
  // Cheese pull strings for the slice.
  cheesePull: () => once('pzCheesePull', () => plain('#FFD75A', '#fff3b0', { clearcoat: 0.8, clearcoatRoughness: 0.15 })),
};
