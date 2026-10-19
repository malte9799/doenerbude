import { useSyncExternalStore } from 'react';

// Delivery / pickup choice and the (demo) address, shared by the header,
// the shop and the cart sidebar. Persisted in localStorage.

const KEY = 'doenerbude.delivery.v1';
const listeners = new Set();
let state = (() => {
  try {
    return { mode: 'delivery', address: '', ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { mode: 'delivery', address: '' };
  }
})();

const set = patch => {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach(l => l());
};
const subscribe = l => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const setMode = mode => set({ mode });
const setAddress = address => set({ address });

export const useDelivery = () => {
  const s = useSyncExternalStore(subscribe, () => state);
  return { ...s, setMode, setAddress };
};
