import Doener, { doenerLayers } from './doener/Doener.jsx';
import Pizza, { pizzaLayers } from './pizza/Pizza.jsx';
import PizzaBox from './pizza/PizzaBox.jsx';
import PizzaSlice from './pizza/PizzaSlice.jsx';
import Exterior from '../store/exterior/Exterior.jsx';

// Model registry – the contract every model fulfils (CONCEPT.md §6):
//   {
//     id, kind: 'product' | 'scene',
//     layers: [{ id, default, price }]   (optional; labels from i18n `ingredients.<id>`)
//     Component({ active, ...props }),
//     view: { position, target },        (studio camera)
//     bakeable?: true,
//   }
// A model can later be swapped for a GLB-based component with the same props
// without touching shop code. Packages add their entries below, one line each.

export const models = {
  doener: { id: 'doener', kind: 'product', layers: doenerLayers, Component: Doener, view: { position: [0.5, 3.6, 5.9], target: [0, 0.6, 0.05] } },
  pizza: { id: 'pizza', kind: 'product', layers: pizzaLayers, Component: Pizza, bakeable: true, view: { position: [0, 3.9, 4.9], target: [0, 0.1, 0.15] } },
  pizzaBox: { id: 'pizzaBox', kind: 'product', layers: pizzaLayers, Component: PizzaBox, view: { position: [0, 6, 10.5], target: [0, 1.5, -0.4] } },
  pizzaSlice: { id: 'pizzaSlice', kind: 'product', Component: PizzaSlice, bakeable: true, view: { position: [0, 3.0, 4.2], target: [0, 0.2, -0.2] } },
  storeExterior: { id: 'storeExterior', kind: 'scene', Component: Exterior, view: { position: [-75, 62, 170], target: [0, 8, 2] } },
};

export const defaultLayers = model => (models[model].layers ?? []).filter(l => l.default).map(l => l.id);
