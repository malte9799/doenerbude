import * as THREE from 'three';
import * as recipes from './recipes.js';
import { tex } from '../tex/textures.js';

// The shared material library. Models never create materials of their own –
// they ask for one here, so every product shares one look (style bible §6).

export const TEXTURE_KEYS = Object.keys(recipes);

const cache = new Map();
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

// Soft "Fluent" base: textured PBR + a light sheen that rounds silhouettes off.
function textured(key, { normalScale = 1, ...opts } = {}) {
  const t = tex(key);
  return new THREE.MeshPhysicalMaterial({
    map: t.map,
    normalMap: t.normalMap,
    normalScale: new THREE.Vector2(normalScale, normalScale),
    roughnessMap: t.roughnessMap,
    roughness: 1,
    sheen: 0.25,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color('#fff4e0'),
    ...opts,
  });
}

// Crossfades the colour map from `raw` to `baked` via material.userData.bake.value (0..1).
function bakeBlend(material, bakedKey) {
  const uniforms = { uBake: { value: 0 }, uBakedMap: { value: tex(bakedKey).map } };
  material.userData.bake = uniforms.uBake;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uBake;\nuniform sampler2D uBakedMap;')
      .replace(
        '#include <map_fragment>',
        '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuse * texture2D(uBakedMap, vMapUv).rgb, uBake);',
      );
  };
  material.customProgramCacheKey = () => 'bakeBlend';
  return material;
}

// Triplanar projection for organic shapes without clean UVs (bread): colour,
// roughness and normals are projected along the three object axes and
// blended by the surface normal, so nothing smears on curved sides.
function triplanar(material, scale) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uTriScale = { value: scale };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTriScale;\nvarying vec3 vTriPos;\nvarying vec3 vTriN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTriPos = position * uTriScale;\nvTriN = objectNormal;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vTriPos;
varying vec3 vTriN;
uniform mat3 normalMatrix;
vec3 triW() { vec3 w = pow(abs(normalize(vTriN)), vec3(6.0)); return w / (w.x + w.y + w.z); }
vec4 triSample(sampler2D t) {
  vec3 w = triW();
  return texture2D(t, vTriPos.zy) * w.x + texture2D(t, vTriPos.xz) * w.y + texture2D(t, vTriPos.xy) * w.z;
}`,
      )
      .replace('#include <map_fragment>', 'diffuseColor *= triSample(map);')
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * triSample(roughnessMap).g;')
      .replace(
        '#include <normal_fragment_maps>',
        `{
  vec3 w = triW();
  vec3 n0 = normalize(vTriN);
  vec3 tx = texture2D(normalMap, vTriPos.zy).xyz * 2.0 - 1.0;
  vec3 ty = texture2D(normalMap, vTriPos.xz).xyz * 2.0 - 1.0;
  vec3 tz = texture2D(normalMap, vTriPos.xy).xyz * 2.0 - 1.0;
  tx.xy *= normalScale; ty.xy *= normalScale; tz.xy *= normalScale;
  vec3 nx = vec3(tx.xy + n0.zy, n0.x).zyx;
  vec3 ny = vec3(ty.xy + n0.xz, n0.y).xzy;
  vec3 nz = vec3(tz.xy + n0.xy, n0.z);
  normal = normalize(normalMatrix * normalize(nx * w.x + ny * w.y + nz * w.z));
}`,
      );
  };
  material.customProgramCacheKey = () => 'triplanar';
  return material;
}

const wet = { clearcoat: 0.7, clearcoatRoughness: 0.18 };

export const materials = {
  // Bread
  breadCrust: () => once('breadCrust', () => triplanar(textured('breadCrust', { normalScale: 1, clearcoat: 0.25, clearcoatRoughness: 0.45, sheenColor: new THREE.Color('#ffd9a0') }), 0.42)),
  breadCrumb: () => once('breadCrumb', () => triplanar(textured('breadCrumb', { normalScale: 1, sheen: 0.6, sheenRoughness: 0.8 }), 0.42)),

  // Döner fillings
  doenerMeat: () => once('doenerMeat', () => textured('doenerMeat', { normalScale: 1.2, clearcoat: 0.35, clearcoatRoughness: 0.35 })),
  lettuce: () => once('lettuce', () => textured('lettuce', { side: THREE.DoubleSide, clearcoat: 0.3, clearcoatRoughness: 0.3, sheen: 0.5, sheenColor: new THREE.Color('#f2ffd0') })),
  tomatoSlice: () => once('tomatoSlice', () => textured('tomatoSlice', { ...wet, clearcoat: 0.9 })),
  cucumberSlice: () => once('cucumberSlice', () => textured('cucumberSlice', wet)),
  onion: () => once('onion', () => textured('onion', { clearcoat: 0.6, clearcoatRoughness: 0.2 })),
  redCabbage: () => once('redCabbage', () => textured('redCabbage', { clearcoat: 0.4, clearcoatRoughness: 0.3 })),
  whiteCabbage: () => once('whiteCabbage', () => textured('whiteCabbage', { clearcoat: 0.4, clearcoatRoughness: 0.3 })),
  feta: () => once('feta', () => textured('feta', { normalScale: 1.4, sheen: 0.5 })),
  garlicSauce: () => once('garlicSauce', () => textured('garlicSauce', { clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') })),
  chili: () => once('chili', () => new THREE.MeshPhysicalMaterial({ color: '#c22a17', roughness: 0.5, sheen: 0.3, sheenColor: new THREE.Color('#ff9a70') })),

  // Pizza – base and cheese are per-pizza instances because they animate (bake).
  pizzaBase: () => bakeBlend(textured('pizzaBaseRaw', { normalScale: 1, sheen: 0.4, sheenColor: new THREE.Color('#ffe9c4') }), 'pizzaBaseBaked'),
  // The cheese sheet is displaced by its own height (R of the roughness map)
  // and cut out by the colour alpha.
  cheese: () =>
    bakeBlend(
      textured('cheeseRaw', {
        normalScale: 1,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
        sheen: 0.4,
        sheenColor: new THREE.Color('#fff6d8'),
        alphaTest: 0.5,
        displacementMap: tex('cheeseRaw').roughnessMap,
        displacementScale: 0.075,
      }),
      'cheeseBaked',
    ),
  tomatoSauce: () => once('tomatoSauce', () => textured('tomatoSauce', wet)),
  salami: () => once('salami', () => textured('salami', { clearcoat: 0.5, clearcoatRoughness: 0.25 })),
  olive: () => once('olive', () => textured('olive', { clearcoat: 1, clearcoatRoughness: 0.08 })),
  mushroom: () => once('mushroom', () => textured('mushroom', { sheen: 0.5 })),
  mushroomSkin: () => once('mushroomSkin', () => new THREE.MeshPhysicalMaterial({ color: '#a27a52', roughness: 0.65, sheen: 0.4, sheenColor: new THREE.Color('#f3dfc4') })),
  basil: () => once('basil', () => textured('basil', { side: THREE.DoubleSide, clearcoat: 0.6, clearcoatRoughness: 0.2 })),
  pepper: () => once('pepper', () => textured('pepper', { clearcoat: 1, clearcoatRoughness: 0.1 })),
  ham: () => once('ham', () => textured('ham', { clearcoat: 0.35, clearcoatRoughness: 0.3 })),
};
