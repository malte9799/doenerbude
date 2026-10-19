import * as THREE from 'three';
import BakeWorker from './bake.worker.js?worker&inline';

// Procedural textures are baked off the main thread by a small worker pool.
// Call `loadTextures(keys)` once (behind a loading screen), then read the
// finished sets synchronously with `tex(key)`.
//
// To swap a procedural texture for a painted / AI / Blender one later, put
// pre-made images behind the same key here – nothing else changes.

const sets = new Map();
const pending = new Map();
let pool = null;

function getPool() {
  if (pool) return pool;
  const size = Math.max(2, Math.min(6, (navigator.hardwareConcurrency || 4) - 1));
  const workers = Array.from({ length: size }, () => ({ worker: new BakeWorker(), busy: false }));
  const queue = [];
  const pump = () => {
    for (const slot of workers) {
      if (slot.busy || !queue.length) continue;
      const { key, resolve } = queue.shift();
      slot.busy = true;
      slot.worker.onmessage = ({ data }) => {
        slot.busy = false;
        resolve(data);
        pump();
      };
      slot.worker.postMessage({ key });
    }
  };
  pool = { run: key => new Promise(resolve => (queue.push({ key, resolve }), pump())) };
  return pool;
}

const toTexture = (data, width, height, wrapU, wrapV, srgb) => {
  const tex = new THREE.DataTexture(data, width, height);
  tex.wrapS = wrapU ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.wrapT = wrapV ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

function load(key) {
  if (sets.has(key)) return Promise.resolve(sets.get(key));
  if (!pending.has(key)) {
    pending.set(
      key,
      getPool()
        .run(key)
        .then(({ width, height, wrapU, wrapV, color, normals, rough }) => {
          const set = {
            map: toTexture(color, width, height, wrapU, wrapV, true),
            normalMap: toTexture(normals, width, height, wrapU, wrapV, false),
            roughnessMap: toTexture(rough, width, height, wrapU, wrapV, false),
          };
          sets.set(key, set);
          return set;
        }),
    );
  }
  return pending.get(key);
}

export function loadTextures(keys, onProgress) {
  let done = 0;
  return Promise.all(
    keys.map(key =>
      load(key).then(set => {
        onProgress?.(++done / keys.length);
        return set;
      }),
    ),
  );
}

export function tex(key) {
  const set = sets.get(key);
  if (!set) throw new Error(`Texture "${key}" not loaded – add it to loadTextures().`);
  return set;
}
