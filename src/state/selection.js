import { useSyncExternalStore } from 'react';

// Which product is "picked up" right now (e.g. clicked in the 3D store).
// The landing calls `openProduct(id)`; the global <ProductPanel> listens.

let current = null;
const listeners = new Set();

export const openProduct = id => {
  current = id;
  listeners.forEach(l => l());
};
export const closeProduct = () => openProduct(null);

const subscribe = l => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSelectedProduct = () => useSyncExternalStore(subscribe, () => current);

// Handy for screenshots / debugging: `window.__openProduct('doener')`.
if (typeof window !== 'undefined') window.__openProduct = openProduct;
