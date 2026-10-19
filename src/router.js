import { useSyncExternalStore } from 'react';

// Hash routing (#/bestellen) so the site works on GitHub Pages and from disk
// without server rewrites.

const subscribe = callback => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};

const getPath = () => window.location.hash.replace(/^#/, '') || '/';

export const useRoute = () => useSyncExternalStore(subscribe, getPath);

export const navigate = path => {
  window.location.hash = path;
};

export const href = path => `#${path}`;
