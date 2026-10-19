import * as THREE from 'three';
import BakeWorker from './bake.worker.js?worker&inline';
import * as recipes from '../materials/recipes.js';
import { bakeArrays } from './bake.js';

// Procedural textures are baked off the main thread by a small worker pool.
// Call `loadTextures(keys)` once (behind a loading screen), then read the
// finished sets synchronously with `tex(key)`.
//
// Where workers are unavailable (strict sandboxes, CSP), baking falls back to
// the main thread, one texture per frame so the loading screen stays alive.
//
// To swap a procedural texture for a painted / AI / Blender one later, put
// pre-made images behind the same key here – nothing else changes.

const sets = new Map();
const pending = new Map();
let pool = null;
let workersBroken = false;

const WORKER_TIMEOUT = 8000;

function getPool() {
  if (pool) return pool;
  const size = Math.max(2, Math.min(6, (navigator.hardwareConcurrency || 4) - 1));
  let workers;
  try {
    workers = Array.from({ length: size }, () => ({ worker: new BakeWorker(), busy: false }));
  } catch {
    workersBroken = true;
    workers = [];
  }
  const queue = [];
  const pump = () => {
    for (const slot of workers) {
      if (slot.busy || !queue.length) continue;
      const { key, resolve, reject } = queue.shift();
      slot.busy = true;
      const timer = setTimeout(() => fail(new Error('worker timeout')), WORKER_TIMEOUT);
      const fail = err => {
        clearTimeout(timer);
        workersBroken = true;
        reject(err);
        while (queue.length) queue.shift().reject(err);
      };
      slot.worker.onerror = fail;
      slot.worker.onmessage = ({ data }) => {
        clearTimeout(timer);
        slot.busy = false;
        resolve(data);
        pump();
      };
      try {
        slot.worker.postMessage({ key });
      } catch (err) {
        fail(err);
      }
    }
  };
  pool = {
    run: key =>
      workersBroken
        ? Promise.reject(new Error('workers unavailable'))
        : new Promise((resolve, reject) => {
            queue.push({ key, resolve, reject });
            pump();
          }),
  };
  return pool;
}

// Main-thread fallback: bakes are serialised and each waits for the next frame.
let mainChain = Promise.resolve();
const bakeOnMainThread = key =>
  (mainChain = mainChain.then(
    () =>
      new Promise(resolve => {
        requestAnimationFrame(() => resolve(bakeArrays(recipes[key])));
      }),
  ));

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
        .catch(() => bakeOnMainThread(key))
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
