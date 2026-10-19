import { createElement, useLayoutEffect, useRef } from 'react';
import { createRoot, extend, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import StudioStage from '../../three/studio/StudioStage.jsx';
import { models } from '../../three/products/index.js';
import { TEXTURE_KEYS } from '../../three/materials/index.js';
import { loadTextures } from '../../three/tex/textures.js';

// One shared offscreen WebGL renderer for every product thumbnail. Each
// (model, layers, baked) combination is rendered once in the studio light,
// read back as an image data URL and cached in memory.

extend(THREE); // <Canvas> does this implicitly; a bare root needs it

const SIZE = 512;
const SETTLE_FRAMES = 8; // environment map + shadows need a few frames
const PULL_IN = 1.12; // studio views suit a wide canvas; back off for the square

const cache = new Map(); // key -> data URL
const inflight = new Map(); // key -> Promise<string>
let root = null;
let canvas = null;
let chain = Promise.resolve();
let texturesReady = null;

export const lookupModel = product => {
  const m = models[product.model] ?? models[product.id];
  return m && m.kind !== 'scene' ? m : null;
};

export const thumbKey = (modelId, active, baked) => `${modelId}|${[...(active ?? [])].sort().join(',')}|${baked ? 1 : 0}`;
export const cachedThumb = key => cache.get(key) ?? null;

function Job({ model, active, baked, onDone }) {
  const { camera } = useThree();
  const frames = useRef(0);
  const { Component } = model;
  const view = model.view ?? { position: [0, 3, 6], target: [0, 0.5, 0] };

  useLayoutEffect(() => {
    const target = new THREE.Vector3(...view.target);
    camera.position.copy(new THREE.Vector3(...view.position).sub(target).multiplyScalar(PULL_IN).add(target));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, view]);

  useFrame(() => {
    if (++frames.current === SETTLE_FRAMES) onDone();
  });

  return createElement(StudioStage, null, createElement(Component, { active, baked }));
}

function ensureRoot() {
  if (root) return root;
  canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  root = createRoot(canvas);
  root.configure({
    shadows: 'soft',
    dpr: 1,
    frameloop: 'always',
    gl: { antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 0.88 },
    camera: { fov: 30, near: 0.1, far: 50, position: [0, 3, 6] },
    size: { width: SIZE, height: SIZE, top: 0, left: 0 },
  });
  return root;
}

function renderOnce(key, model, active, baked) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('thumbnail timeout')), 20000);
    const done = () => {
      // Read after the frame that just finished; the drawing buffer is preserved.
      requestAnimationFrame(() => {
        clearTimeout(timer);
        try {
          let url = canvas.toDataURL('image/webp', 0.92);
          if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/png');
          resolve(url);
        } catch (err) {
          reject(err);
        }
      });
    };
    try {
      ensureRoot().render(createElement(Job, { key, model, active, baked, onDone: done }));
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

export function getThumb(modelId, active, baked) {
  const key = thumbKey(modelId, active, baked);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (inflight.has(key)) return inflight.get(key);
  const model = models[modelId];
  if (!model) return Promise.reject(new Error(`unknown model ${modelId}`));
  texturesReady ??= loadTextures(TEXTURE_KEYS);
  const job = chain.then(async () => {
    await texturesReady;
    const url = await renderOnce(key, model, active ?? [], baked && model.bakeable);
    cache.set(key, url);
    return url;
  });
  chain = job.catch(() => {});
  inflight.set(key, job);
  job.finally(() => inflight.delete(key)).catch(() => {});
  return job;
}
