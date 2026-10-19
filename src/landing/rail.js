import * as THREE from 'three';

// The camera rail of the scroll journey (CONCEPT §3). One entry per station;
// the curves run through them in order. Units: 1 = 10 cm, shop interior at
// z < 0, front facade at z = 0.
//   position / target  camera and look-at point at the station
//   fov                vertical field of view in degrees
export const RAIL = [
  { id: 'outside', position: [-40, 21, 80], target: [0, 11, 0], fov: 34 },
  { id: 'door', position: [0.5, 10.5, 21], target: [0, 10.5, 0], fov: 40 },
  { id: 'overview', position: [0, 14, -3], target: [0, 9, -30], fov: 56 },
  { id: 'counter', position: [-3, 15.5, -15], target: [-3, 10.6, -31], fov: 46 },
  { id: 'oven', position: [9, 14.5, -12], target: [18, 9.5, -27.5], fov: 46 },
  { id: 'table', position: [-9, 18.5, -6.5], target: [-11, 7.6, -17], fov: 46 },
  { id: 'fridge', position: [-20, 12.5, -17], target: [-20.5, 10.5, -36], fov: 46 },
  { id: 'checkout', position: [5, 16, -13], target: [7.5, 10.2, -31.5], fov: 44 },
];

export const LAST = RAIL.length - 1;

const curve = pick => new THREE.CatmullRomCurve3(RAIL.map(s => new THREE.Vector3(...pick(s))), false, 'centripetal');
const posCurve = curve(s => s.position);
const tgtCurve = curve(s => s.target);
const fovCurve = curve(s => [s.fov, 0, 0]);
const _fov = new THREE.Vector3();

const HOLD = 0.17; // share of each segment where the camera rests at the stations
const smooth = x => x * x * x * (x * (x * 6 - 15) + 10);
const clamp01 = x => Math.min(1, Math.max(0, x));

// Scroll progress 0..1 → station coordinate s in 0..LAST with rests at the
// whole numbers.
export function stationAt(progress) {
  const s = clamp01(progress) * LAST;
  const i = Math.min(LAST - 1, Math.floor(s));
  return i + smooth(clamp01((s - i - HOLD) / (1 - 2 * HOLD)));
}

// Station coordinate → camera. Writes into the given (preallocated) vectors,
// returns the fov.
export function sampleRail(s, pos, tgt) {
  const u = s / LAST;
  posCurve.getPoint(u, pos);
  tgtCurve.getPoint(u, tgt);
  return fovCurve.getPoint(u, _fov).x;
}

// Scroll progress that parks the camera exactly at station i.
export const progressOfStation = i => i / LAST;

export const doorOpenAt = s => smooth(clamp01((s - 0.8) / 0.4));
export const fridgeOpenAt = s => smooth(clamp01((s - 5.75) / 0.4));
