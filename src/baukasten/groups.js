// Which chip group a layer belongs to, per model. Group ids map to
// `baukasten.groups.<id>`; layers not listed land in "other".
const doener = [
  ['meat', ['meatVeal', 'meatChicken']],
  ['veg', ['lettuce', 'tomato', 'cucumber', 'redCabbage', 'whiteCabbage', 'onion']],
  ['extras', ['feta', 'chili']],
  ['sauces', ['garlicSauce']],
];

const pizza = [
  ['base', ['tomatoSauce', 'cheese']],
  ['meatFish', ['salami', 'ham', 'chicken', 'tuna']],
  ['pizzaVeg', ['tomatoSlices', 'mushrooms', 'pepper', 'olives', 'redOnion', 'corn', 'jalapenos']],
  ['herbs', ['basil', 'rucola']],
];

export const groupTables = { doener, duerum: doener, pizza };

export function groupLayers(model, layers) {
  const table = groupTables[model] ?? [];
  const known = new Set();
  const groups = table.map(([id, ids]) => {
    ids.forEach(x => known.add(x));
    return { id, layers: layers.filter(l => ids.includes(l.id)) };
  });
  const rest = layers.filter(l => !known.has(l.id));
  if (rest.length) groups.push({ id: 'other', layers: rest });
  return groups.filter(g => g.layers.length);
}
