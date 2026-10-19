import Doener, { doenerLayers } from './doener/Doener.jsx';
import Pizza, { pizzaLayers } from './pizza/Pizza.jsx';
import Duerum, { duerumLayers } from './doener-family/Duerum.jsx';
import Box, { boxLayers } from './doener-family/Box.jsx';
import Teller, { tellerLayers } from './doener-family/Teller.jsx';

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
  duerum: { id: 'duerum', kind: 'product', layers: duerumLayers, Component: Duerum, view: { position: [0.5, 4.2, 6.4], target: [0, 1.15, 0] } },
  box: { id: 'box', kind: 'product', layers: boxLayers, Component: Box, view: { position: [0.4, 4.0, 5.4], target: [0, 0.7, 0] } },
  teller: { id: 'teller', kind: 'product', layers: tellerLayers, Component: Teller, view: { position: [0, 5.6, 5.9], target: [0, 0.2, 0.1] } },
};

export const defaultLayers = model => (models[model].layers ?? []).filter(l => l.default).map(l => l.id);
