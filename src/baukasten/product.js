import { products } from '../data/menu.js';
import { defaultLayers } from '../three/products/index.js';

export const TAB_MODELS = ['doener', 'duerum', 'pizza'];

// Base product for a model: the `?p=` menu item if it belongs to the model,
// else the first configurable item (pizza: the blank "customPizza").
export function resolveProduct(model, id) {
  const forModel = products.filter(p => p.configurable === model);
  const wanted = forModel.find(p => p.id === id);
  const fallback = (model === 'pizza' && forModel.find(p => p.id === 'customPizza')) || forModel[0];
  const product = wanted ?? fallback;
  if (product) return { ...product, preset: product.preset ?? defaultLayers(model) };
  // Registry model without menu item: price 0, defaults as preset.
  return { id: model, price: 0, model, configurable: model, preset: defaultLayers(model) };
}
