import { defaultLayers } from '../../three/products/index.js';
import { lookupModel } from '../../components/shop/thumbRenderer.js';

// Which size / extra choices a product offers. Model-backed products take
// their priced layers (price > 0) that are not already part of the product;
// everything else gets a few generic extras per category.

const SAUCES = [
  { id: 'xSauceGarlic', price: 0.5 },
  { id: 'xSauceHerb', price: 0.5 },
  { id: 'xSauceHot', price: 0.5 },
  { id: 'xSauceCocktail', price: 0.5 },
];

const byCategory = {
  doener: [{ id: 'xMeat', price: 2 }, { id: 'xFeta', price: 1 }, ...SAUCES],
  pizza: [SAUCES[0], SAUCES[1]],
  sides: SAUCES,
};

const pizzaSizes = [
  { id: 's26', delta: -1.5 },
  { id: 's30', delta: 0 },
];

// Layers that are on by default for this product (shown in the preview).
export const baseLayers = product => {
  const model = lookupModel(product);
  if (!model) return [];
  return product.preset ?? defaultLayers(model.id);
};

export function optionsFor(product) {
  const model = lookupModel(product);
  const base = baseLayers(product);
  const layerExtras = (model?.layers ?? []).filter(l => l.price > 0 && !base.includes(l.id)).map(l => ({ id: l.id, price: l.price, layer: true }));
  const layerIds = new Set((model?.layers ?? []).map(l => l.id));
  const generic = (byCategory[product.category] ?? []).filter(e => !(e.id === 'xFeta' && layerIds.has('feta')));
  const sizes = product.category === 'pizza' ? pizzaSizes : null;
  return { sizes, defaultSize: sizes ? 's30' : null, extras: [...layerExtras, ...generic] };
}

export const hasChoices = product => {
  const o = optionsFor(product);
  return Boolean(o.sizes) || o.extras.length > 0;
};

export function unitPrice(product, size, extraIds) {
  const o = optionsFor(product);
  const delta = o.sizes?.find(s => s.id === size)?.delta ?? 0;
  const extras = o.extras.filter(e => extraIds.includes(e.id)).reduce((s, e) => s + e.price, 0);
  return Math.round((product.price + delta + extras) * 100) / 100;
}

// Label of an extra: shop.extras for generic ones, ingredient label for model layers.
export const extraLabel = (t, id) => {
  const generic = t(`shop.extras.${id}`);
  return generic !== `shop.extras.${id}` ? generic : t(`ingredients.${id}`);
};

export const optionSummary = (t, options) =>
  [options?.size ? t(`shop.sizes.${options.size}`) : null, ...(options?.extras ?? []).map(id => extraLabel(t, id))].filter(Boolean).join(', ');
