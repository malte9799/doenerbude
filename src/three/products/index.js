import Doener, { doenerLayers } from './doener/Doener.jsx';
import Pizza, { pizzaLayers } from './pizza/Pizza.jsx';

// Product registry – the contract every model fulfils (CONCEPT.md §6):
//   { id, layers: [{ id, default, price }], Component({ active, ...props }) }
// Layer labels come from i18n `ingredients.<id>`. A model can later be swapped
// for a GLB-based component with the same props without touching shop code.

export const models = {
  doener: { id: 'doener', layers: doenerLayers, Component: Doener },
  pizza: { id: 'pizza', layers: pizzaLayers, Component: Pizza, bakeable: true },
};

export const defaultLayers = model => models[model].layers.filter(l => l.default).map(l => l.id);
