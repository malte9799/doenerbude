// Where the products stand. Units: 1 = 10 cm, floor y = 0, front facade z = 0,
// back wall z = -40, side walls x = ±25. Each slot is the product's origin
// (centre of its standing surface). `ANCHOR_ROT` holds a hand-placed spin
// around Y (radians) per slot so nothing sits in a perfect row.

// Furniture plan: shared by the models and the anchors so they never drift apart.
export const PLAN = {
  counter: { x0: -14, x1: 10, z0: -40, z1: -29, top: 10 },
  displayEnd: -5, // counter x < displayEnd is the glass display case
  spit: { x: -2.5, z: -36, y: 10 },
  oven: { x: 18.4, z: -34, w: 12, d: 11.2, base: 8 },
  ovenShelf: { x0: 12, x1: 24.6, z0: -28.2, z1: -24.2, top: 8.6 },
  fridge: { x0: -24.5, x1: -16.5, z0: -39.8, z1: -33.8, h: 21 },
  tableA: { x: -12, z: -17, w: 13, d: 7, top: 7.6 },
  tableB: { x: 14, z: -14, r: 3.8, top: 7.6 },
};

const C = PLAN.counter;
const T = PLAN.tableA;
const B = PLAN.tableB;
const S = PLAN.ovenShelf;
const F = PLAN.fridge;

// Fridge shelf tops (y) and the three slot columns.
export const FRIDGE_SHELVES = [3.4, 8.1, 12.8, 17.5];
const fridgeCols = [-22.6, -20.5, -18.4];
const fridgeZ = -36.3;

export const ANCHORS = {
  // Döner products on the counter top.
  counter: [-10.6, -7.1, -3.5, 0.1, 3.6, 7.1].map((x, i) => [x, C.top, -31.2 + (i % 2) * 0.35]),
  // Pizzas on the shelf in front of the oven.
  oven: [13.7, 16.8, 19.9, 23].map((x, i) => [x, S.top, -26.2 + (i % 2 ? 0.25 : -0.2)]),
  // Sides, sauces, dessert on table A (two rows of four).
  table: [-1, 1].flatMap(row => [-4.8, -1.6, 1.6, 4.8].map((dx, i) => [T.x + dx + row * 0.2, T.top, T.z + row * 1.6 + (i % 2) * 0.15])),
  // Second table: a plate or two for the sit-down meal.
  table2: [
    [B.x - 1.4, B.top, B.z - 1.2],
    [B.x + 1.5, B.top, B.z - 1.0],
    [B.x - 1.2, B.top, B.z + 1.5],
    [B.x + 1.3, B.top, B.z + 1.4],
  ],
  // Drinks: four glass shelves, three slots each (back row).
  fridge: FRIDGE_SHELVES.flatMap(y => fridgeCols.map((x, i) => [x + (y > 10 ? 0.1 : -0.1) * (i - 1), y, fridgeZ])),
  // Baklava, börek and friends in the glass display case (two shelves).
  display: [2.2, 6.2].flatMap(y => [-12.3, -9.5, -6.7].map(x => [x, y, -33.2])),
};

export const ANCHOR_ROT = {
  counter: [0.18, -0.12, 0.25, -0.2, 0.1, -0.28],
  oven: [0.3, 1.1, -0.6, 2.2],
  table: [0.2, -0.3, 0.4, -0.1, -0.25, 0.35, 0.1, -0.4],
  table2: [0.4, -0.3, 0.2, -0.5],
  fridge: Array.from({ length: 12 }, (_, i) => Math.sin(i * 2.3) * 0.35),
  display: Array.from({ length: 6 }, (_, i) => Math.sin(i * 1.7 + 1) * 0.3),
};

// Suggested camera per station (for the scroll journey); the studio uses `overview`.
export const STATIONS = {
  overview: { position: [0, 14, -2], target: [0, 9, -30] },
  counter: { position: [-2, 15.5, -14], target: [-2, 10.8, -31] },
  oven: { position: [9, 14, -11], target: [18, 9.5, -28] },
  table: { position: [-9, 17, -5], target: [-12, 7.6, -17] },
  fridge: { position: [-8, 12.5, -15], target: [-20, 10, -35] },
};
ANCHORS.stations = STATIONS;
