import core from './core.js';
import checkout from './checkout.js';
import shop from './shop.js';
import pizzaExtras from './pizza-extras.js';
import storeExterior from './store-exterior.js';
import sides from './sides.js';

// German strings, split per work package. Each package adds one file here
// and one entry to `parts`; parts are deep-merged, so a package may extend
// shared namespaces such as `products` or `ingredients`.
const parts = [core, checkout, shop, pizzaExtras, storeExterior, sides];

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const merge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : v;
  return out;
};

export default parts.reduce(merge, {});
