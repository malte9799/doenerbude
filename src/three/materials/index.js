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

// ─────────────────────────── shader patches ──────────────────────────────
// Several patches can stack on one material (fluent + triplanar + bake).

function addPatch(material, key, fn) {
  const patches = (material.userData.patches ??= []);
  patches.push({ key, fn });
  material.onBeforeCompile = shader => patches.forEach(p => p.fn(shader));
  material.customProgramCacheKey = () => patches.map(p => p.key).join('|');
  return material;
}

// The Fluent-emoji look: a soft top-to-bottom gradient (lit, warm top;
// slightly deeper underside) and a coloured rim glow that makes food read
// as plump and a little translucent.
const TOP = new THREE.Color(1.07, 1.06, 1.04);
const BOTTOM = new THREE.Color(0.84, 0.78, 0.76);
function fluent(material, { rim = '#ffffff', rimStrength = 0.3, rimPower = 3 } = {}) {
  const uniforms = {
    uRim: { value: new THREE.Color(rim).multiplyScalar(rimStrength * 0.55) },
    uRimPow: { value: rimPower },
    uTop: { value: TOP },
    uBottom: { value: BOTTOM },
  };
  return addPatch(material, 'fluent', shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRim;\nuniform float uRimPow;\nuniform vec3 uTop;\nuniform vec3 uBottom;')
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
{
  vec3 V = normalize(vViewPosition);
  float facing = clamp(dot(normal, V), 0.0, 1.0);
  float up = dot(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)) * 0.5 + 0.5;
  gl_FragColor.rgb *= mix(uBottom, uTop, smoothstep(0.0, 1.0, up));
  gl_FragColor.rgb += uRim * pow(1.0 - facing, uRimPow);
}`,
      );
  });
}

// Triplanar projection for organic shapes without clean UVs (bread): colour,
// roughness and normals are projected along the three object axes and
// blended by the surface normal, so nothing smears on curved sides.
function triplanar(material, scale) {
  return addPatch(material, 'triplanar', shader => {
    shader.uniforms.uTriScale = { value: scale };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTriScale;\nvarying vec3 vTriPos;\nvarying vec3 vTriN;\nvarying vec3 vTriX;\nvarying vec3 vTriY;\nvarying vec3 vTriZ;')
      .replace(
        '#include <begin_vertex>',
        // Object → view basis for the normal, passed down so the fragment
        // shader never has to redeclare normalMatrix (some compilers refuse).
        '#include <begin_vertex>\nvTriPos = position * uTriScale;\nvTriN = objectNormal;\nvTriX = normalMatrix * vec3(1.0, 0.0, 0.0);\nvTriY = normalMatrix * vec3(0.0, 1.0, 0.0);\nvTriZ = normalMatrix * vec3(0.0, 0.0, 1.0);',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vTriPos;
varying vec3 vTriN;
varying vec3 vTriX;
varying vec3 vTriY;
varying vec3 vTriZ;
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
  vec3 objN = normalize(nx * w.x + ny * w.y + nz * w.z);
  normal = normalize(objN.x * vTriX + objN.y * vTriY + objN.z * vTriZ);
}`,
      );
  });
}

// Crossfades the colour map from `raw` to `baked` via material.userData.bake.value (0..1).
function bakeBlend(material, bakedKey) {
  const uniforms = { uBake: { value: 0 }, uBakedMap: { value: tex(bakedKey).map } };
  material.userData.bake = uniforms.uBake;
  return addPatch(material, 'bake', shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uBake;\nuniform sampler2D uBakedMap;')
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuse * texture2D(uBakedMap, vMapUv).rgb, uBake);');
  });
}

// ───────────────────────────── factories ─────────────────────────────────

// Textured PBR + soft sheen + the fluent patch.
function textured(key, { normalScale = 1, rim, rimStrength, ...opts } = {}) {
  const t = tex(key);
  const material = new THREE.MeshPhysicalMaterial({
    map: t.map,
    normalMap: t.normalMap,
    normalScale: new THREE.Vector2(normalScale, normalScale),
    roughnessMap: t.roughnessMap,
    roughness: 1,
    sheen: 0.35,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(rim ?? '#fff4e0'),
    ...opts,
  });
  return fluent(material, { rim, rimStrength });
}

const plain = (color, rim, opts = {}) =>
  fluent(new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color(rim), ...opts }), { rim });

const wet = { clearcoat: 0.8, clearcoatRoughness: 0.12 };

export const materials = {
  // Bread
  breadCrust: () => once('breadCrust', () => triplanar(textured('breadCrust', { rim: '#ffd59a', clearcoat: 0.3, clearcoatRoughness: 0.35 }), 0.42)),
  breadCrumb: () => once('breadCrumb', () => triplanar(textured('breadCrumb', { rim: '#fff3d8', sheen: 0.6 }), 0.42)),

  // Döner fillings
  doenerMeat: () => once('doenerMeat', () => textured('doenerMeat', { rim: '#ffb57a', rimStrength: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.3 })),
  lettuce: () => once('lettuce', () => textured('lettuce', { rim: '#eaff9c', rimStrength: 0.5, side: THREE.DoubleSide, ...wet, clearcoat: 0.4 })),
  tomatoSlice: () => once('tomatoSlice', () => textured('tomatoSlice', { rim: '#ff6e50', rimStrength: 0.3, sheen: 0, clearcoat: 0.15, clearcoatRoughness: 0.5 })),
  cucumberSlice: () => once('cucumberSlice', () => textured('cucumberSlice', { rim: '#e8ffb4', rimStrength: 0.45, ...wet })),
  onion: () => once('onion', () => textured('onion', { rim: '#f8cdef', ...wet })),
  redCabbage: () => once('redCabbage', () => textured('redCabbage', { rim: '#e9a0da', rimStrength: 0.45, ...wet, clearcoat: 0.5 })),
  whiteCabbage: () => once('whiteCabbage', () => textured('whiteCabbage', { rim: '#faffe0', rimStrength: 0.4, ...wet, clearcoat: 0.5 })),
  feta: () => once('feta', () => textured('feta', { rim: '#ffffff', rimStrength: 0.3 })),
  garlicSauce: () => once('garlicSauce', () => textured('garlicSauce', { rim: '#ffffff', rimStrength: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 })),
  chili: () => once('chili', () => plain('#e0331f', '#ff8a66', wet)),

  // Pizza – base and cheese are per-pizza instances because they animate (bake).
  pizzaBase: () => bakeBlend(textured('pizzaBaseRaw', { rim: '#ffd496', clearcoat: 0.2, clearcoatRoughness: 0.4 }), 'pizzaBaseBaked'),
  // The cheese sheet is displaced by its own height (R of the roughness map)
  // and cut out by the colour alpha.
  cheese: () =>
    bakeBlend(
      textured('cheeseRaw', {
        rim: '#fff1a6',
        rimStrength: 0.4,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        alphaTest: 0.5,
        displacementMap: tex('cheeseRaw').roughnessMap,
        displacementScale: 0.1,
      }),
      'cheeseBaked',
    ),
  tomatoSauce: () => once('tomatoSauce', () => textured('tomatoSauce', { rim: '#ff4a2a', rimStrength: 0.2, sheen: 0, clearcoat: 0.15, clearcoatRoughness: 0.5 })),
  salami: () => once('salami', () => textured('salami', { rim: '#ff6a60', rimStrength: 0.25, sheen: 0.1, clearcoat: 0.15, clearcoatRoughness: 0.5 })),
  olive: () => once('olive', () => textured('olive', { rim: '#a988b8', rimStrength: 0.5, clearcoat: 1, clearcoatRoughness: 0.05 })),
  mushroom: () => once('mushroom', () => textured('mushroom', { rim: '#fff2dc' })),
  mushroomSkin: () => once('mushroomSkin', () => plain('#b98c5e', '#f0cfa4')),
  basil: () => once('basil', () => textured('basil', { rim: '#b8f27e', rimStrength: 0.45, side: THREE.DoubleSide, ...wet, clearcoat: 0.6 })),
  pepper: () => once('pepper', () => textured('pepper', { rim: '#ff9478', rimStrength: 0.45, clearcoat: 1, clearcoatRoughness: 0.06 })),
  ham: () => once('ham', () => textured('ham', { rim: '#ffd6d6', rimStrength: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.25 })),
};
