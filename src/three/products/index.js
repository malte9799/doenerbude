import { createElement } from 'react';
import Doener, { doenerLayers } from './doener/Doener.jsx';
import Pizza, { pizzaLayers } from './pizza/Pizza.jsx';
import PizzaBox from './pizza/PizzaBox.jsx';
import PizzaSlice from './pizza/PizzaSlice.jsx';
import Exterior from '../store/exterior/Exterior.jsx';
import Pommes from './sides/Pommes.jsx';
import Salat from './sides/Salat.jsx';
import Boerek from './sides/Boerek.jsx';
import Baklava from './sides/Baklava.jsx';
import Dip from './sides/Dip.jsx';
import { Ayran, Cola, Wasser, Limo } from './sides/Drinks.jsx';
import Interior from '../store/interior/Interior.jsx';
import Duerum, { duerumLayers } from './doener-family/Duerum.jsx';
import Box, { boxLayers } from './doener-family/Box.jsx';
import Teller, { tellerLayers } from './doener-family/Teller.jsx';
import Lahmacun, { lahmacunLayers } from './doener-family/Lahmacun.jsx';

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
  pommes: { id: 'pommes', kind: 'product', Component: Pommes, view: { position: [0, 2.6, 5.6], target: [0, 0.95, 0] } },
  salat: { id: 'salat', kind: 'product', Component: Salat, view: { position: [0, 4.2, 6.6], target: [0, 0.6, 0] } },
  boerek: { id: 'boerek', kind: 'product', Component: Boerek, view: { position: [0, 5.2, 7.2], target: [0, 0.1, 0.6] } },
  baklava: { id: 'baklava', kind: 'product', Component: Baklava, view: { position: [0, 4.2, 6.2], target: [0, 0.1, 0] } },
  dip: { id: 'dip', kind: 'product', Component: Dip, view: { position: [0, 2.3, 3.8], target: [0, 0.35, 0] } },
  ayran: { id: 'ayran', kind: 'product', Component: Ayran, view: { position: [0, 2.4, 4.8], target: [0, 0.55, 0] } },
  cola: { id: 'cola', kind: 'product', Component: Cola, view: { position: [0, 2.4, 4.8], target: [0, 0.6, 0] } },
  wasser: { id: 'wasser', kind: 'product', Component: Wasser, view: { position: [0, 3.2, 6.4], target: [0, 1.3, 0] } },
  limo: { id: 'limo', kind: 'product', Component: Limo, view: { position: [0, 3.2, 6.4], target: [0, 1.3, 0] } },
  storeInterior: { id: 'storeInterior', kind: 'scene', Component: Interior, view: { position: [8, 16, 48], target: [0, 9, -24] } },
  duerum: { id: 'duerum', kind: 'product', layers: duerumLayers, Component: Duerum, view: { position: [0.5, 4.2, 6.4], target: [0, 1.15, 0] } },
  box: { id: 'box', kind: 'product', layers: boxLayers, Component: Box, view: { position: [0.4, 4.0, 5.4], target: [0, 0.7, 0] } },
  teller: { id: 'teller', kind: 'product', layers: tellerLayers, Component: Teller, view: { position: [0, 5.6, 5.9], target: [0, 0.2, 0.1] } },
  lahmacun: { id: 'lahmacun', kind: 'product', layers: lahmacunLayers, Component: Lahmacun, view: { position: [0.3, 4.4, 5.9], target: [-0.25, 0.4, 0.1] } },
};

// Dip variants as their own entries, so shop thumbnails and menu items can
// point at a specific sauce without extra props.
for (const variant of ['garlic', 'herb', 'hot', 'cocktail']) {
  const id = `dip${variant[0].toUpperCase()}${variant.slice(1)}`;
  models[id] = { ...models.dip, id, Component: props => createElement(models.dip.Component, { ...props, variant }) };
}

export const defaultLayers = model => (models[model].layers ?? []).filter(l => l.default).map(l => l.id);
