// The menu. Names and descriptions come from i18n (`products.<id>`),
// ingredient labels from `ingredients.<id>`. `model` names the 3D product in
// src/three/products (null until the model exists). `configurable` products
// open in the Baukasten, `preset` lists the layers a pizza comes with.

export const categories = ['doener', 'pizza', 'sides', 'sauces', 'desserts', 'drinks'];

export const products = [
  { id: 'doener', category: 'doener', price: 7.5, model: 'doener', configurable: 'doener' },
  { id: 'duerum', category: 'doener', price: 8.0, model: 'duerum', configurable: 'duerum' },
  { id: 'box', category: 'doener', price: 6.5, model: 'box' },
  { id: 'teller', category: 'doener', price: 12.5, model: 'teller' },
  { id: 'lahmacun', category: 'doener', price: 5.5, model: 'lahmacun' },

  { id: 'margherita', category: 'pizza', price: 9.5, model: 'pizza', configurable: 'pizza', preset: ['tomatoSauce', 'cheese', 'basil'] },
  { id: 'salami', category: 'pizza', price: 10.5, model: 'pizza', configurable: 'pizza', preset: ['tomatoSauce', 'cheese', 'salami'] },
  { id: 'schinken', category: 'pizza', price: 10.5, model: 'pizza', configurable: 'pizza', preset: ['tomatoSauce', 'cheese', 'ham'] },
  { id: 'haehnchen', category: 'pizza', price: 11.5, model: 'pizza', configurable: 'pizza', preset: ['tomatoSauce', 'cheese', 'chicken', 'pepper'] },
  { id: 'tonno', category: 'pizza', price: 11.5, model: 'pizza', configurable: 'pizza', preset: ['tomatoSauce', 'cheese', 'tuna', 'redOnion'] },
  { id: 'vegetaria', category: 'pizza', price: 11.0, model: 'pizza', configurable: 'pizza', preset: ['tomatoSauce', 'cheese', 'mushrooms', 'pepper', 'olives'] },
  { id: 'customPizza', category: 'pizza', price: 8.0, model: 'pizza', configurable: 'pizza', preset: ['tomatoSauce', 'cheese'] },

  { id: 'pommes', category: 'sides', price: 3.5, model: 'pommes' },
  { id: 'salat', category: 'sides', price: 6.0, model: 'salat' },
  { id: 'boerek', category: 'sides', price: 4.5, model: 'boerek' },

  { id: 'dipGarlic', category: 'sauces', price: 0.8, model: 'dipGarlic' },
  { id: 'dipHerb', category: 'sauces', price: 0.8, model: 'dipHerb' },
  { id: 'dipHot', category: 'sauces', price: 0.8, model: 'dipHot' },
  { id: 'dipCocktail', category: 'sauces', price: 0.8, model: 'dipCocktail' },

  { id: 'baklava', category: 'desserts', price: 4.0, model: 'baklava' },

  { id: 'ayran', category: 'drinks', price: 2.0, model: 'ayran' },
  { id: 'cola', category: 'drinks', price: 2.8, model: 'cola' },
  { id: 'wasser', category: 'drinks', price: 2.2, model: 'wasser' },
  { id: 'limo', category: 'drinks', price: 2.8, model: 'limo' },
];

export const productById = Object.fromEntries(products.map(p => [p.id, p]));
