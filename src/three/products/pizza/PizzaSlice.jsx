import { useMemo } from 'react';
import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { pizzaExtras } from '../../materials/pizza-extras.js';
import { blobShape, planarUV, slab, smoothNormals } from '../../geo.js';

// A single slice (1/8 pizza): puffy crust, sauce, cheese with a few melted
// strings dangling off the raised tip. Same textures as the whole pizza.

const TOP = 0.1;
const SPAN = (Math.PI * 2) / 8.5; // slightly less than 1/8 so it reads as a cut slice
const R = 1.5;
const CHEESE = 2.42;
const CENTER = 0.78; // moves the slice's middle to the origin
const TILT = 0.22;

const cache = {};
const memo = (key, make) => (cache[key] ??= make());

const profile = () => {
  const ctrl = [
    [0.001, 0],
    [0.8, 0],
    [1.28, 0.006],
    [1.45, 0.05],
    [1.54, 0.16],
    [1.52, 0.3],
    [1.42, 0.38],
    [1.29, 0.35],
    [1.19, 0.22],
    [1.1, TOP + 0.01],
    [0.6, TOP],
    [0.001, TOP],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.SplineCurve(ctrl).getSpacedPoints(80);
};

// Wedge of the dough: lathe over the angle span plus two flat cut faces.
const wedge = () =>
  memo('wedge', () => {
    const pts = profile();
    const lathe = new THREE.LatheGeometry(pts, 28, -SPAN / 2, SPAN);
    // v remap like the pizza base so the rim texture lands on the crust.
    const outer = pts.reduce((m, p, i) => (p.x > pts[m].x ? i : m), 0);
    const rimStart = pts.findIndex((p, i) => i > outer && p.x < 1.16);
    const uv = lathe.attributes.uv;
    for (let i = 0; i <= 28; i++) {
      for (let j = 0; j < pts.length; j++) {
        const p = pts[j];
        const v = j >= rimStart ? 0.55 * (p.x / pts[rimStart].x) : j >= outer ? 0.55 + 0.3 * ((rimStart - j) / (rimStart - outer)) : 0.85 + 0.15 * (1 - p.x / pts[outer].x);
        uv.setY(i * pts.length + j, v);
      }
    }
    const cap = side => {
      const shape = new THREE.Shape(pts);
      const g = new THREE.ShapeGeometry(shape);
      const a = side * (SPAN / 2);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const r = pos.getX(i);
        const y = pos.getY(i);
        pos.setXYZ(i, r * Math.sin(a), y, r * Math.cos(a));
        g.attributes.uv.setXY(i, 0.5, 0.97);
      }
      g.computeVertexNormals();
      return g;
    };
    const merged = [lathe, cap(1), cap(-1)].map(g => g.toNonIndexed());
    for (const g of merged) g.deleteAttribute('normal');
    const out = mergeAll(merged);
    out.computeVertexNormals();
    return out;
  });

function mergeAll(geos) {
  const n = geos.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

const sector = (r, inset) => {
  const pts = [new THREE.Vector2(0, 0)];
  const a0 = SPAN / 2 - inset;
  for (let i = 0; i <= 24; i++) {
    const a = -a0 + (i / 24) * 2 * a0;
    pts.push(new THREE.Vector2(r * Math.sin(a), -r * Math.cos(a)));
  }
  const s = new THREE.Shape();
  s.setFromPoints(pts);
  return s;
};

const sauce = () => memo('sauce', () => slab(sector(1.18, 0.05), { thickness: 0.05, bevel: 0.02, bevelSegments: 3, uvScale: 0.42 }));

// The cheese sheet of the whole pizza, cut down to this sector.
const cheese = () =>
  memo('cheese', () => {
    const g = new THREE.PlaneGeometry(CHEESE, CHEESE, 240, 240);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const idx = g.index.array;
    const keep = [];
    for (let t = 0; t < idx.length; t += 3) {
      let cx = 0;
      let cz = 0;
      for (let k = 0; k < 3; k++) {
        cx += pos.getX(idx[t + k]) / 3;
        cz += pos.getZ(idx[t + k]) / 3;
      }
      if (cz > 0.02 && Math.abs(Math.atan2(cx, cz)) < SPAN / 2 - 0.045 && Math.hypot(cx, cz) < 1.2) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    g.setIndex(keep);
    return planarUV(g, 1 / CHEESE);
  });

const salamiDisc = () => memo('salami', () => smoothNormals(slab(blobShape({ w: 0.46, h: 0.44, wobble: 0.05, seed: 5 }), { thickness: 0.09, bevel: 0.038, bevelSegments: 4, tessellate: 0.05, uvScale: 1 / 0.46 })));

// A hanging string: sags from the tip to the floor and ends in a drop.
const strand = (x0, x1, z1, sag) =>
  memo(`strand${x0}${x1}`, () => {
    const pts = [
      new THREE.Vector3(x0, 0.0, 0),
      new THREE.Vector3((x0 + x1) / 2, -sag * 0.55, z1 * 0.45),
      new THREE.Vector3(x1, -sag * 0.9, z1 * 0.8),
      new THREE.Vector3(x1, -sag, z1),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.026, 8, false);
  });

export default function PizzaSlice({ baked = true }) {
  const baseMat = useMemo(() => {
    const m = materials.pizzaBase();
    m.side = THREE.DoubleSide;
    m.userData.bake.value = baked ? 1 : 0;
    return m;
  }, [baked]);
  const cheeseMat = useMemo(() => {
    const m = materials.cheese();
    m.userData.bake.value = baked ? 1 : 0;
    return m;
  }, [baked]);
  const pull = pizzaExtras.cheesePull();
  const sauceTop = TOP + 0.05;
  const top = sauceTop + 0.07;

  return (
    // Tip raised, crust on the table; strands hang from the tip to the floor.
    <group position={[0, 0.24, 0]} rotation={[TILT, 0, 0]}>
      <group position={[0, 0, -CENTER]}>
        <mesh geometry={wedge()} material={baseMat} castShadow receiveShadow />
        <mesh geometry={sauce()} material={materials.tomatoSauce()} position={[0, TOP + 0.025, 0]} receiveShadow />
        <mesh geometry={cheese()} material={cheeseMat} position={[0, sauceTop + 0.002, 0]} receiveShadow />
        <mesh geometry={salamiDisc()} material={materials.salami()} position={[0.02, top + 0.03, 0.85]} rotation={[0.04, 0.5, 0.03]} castShadow receiveShadow />
        {/* Strands start at the cut tip and run back, down to the table. */}
        <group position={[0, top + 0.02, 0.06]}>
          <group rotation={[-TILT, 0, 0]} position={[0, 0, 0]}>
            <mesh geometry={strand(-0.08, -0.16, -0.5, 0.62)} material={pull} castShadow />
            <mesh geometry={strand(0.0, 0.02, -0.62, 0.7)} material={pull} castShadow />
            <mesh geometry={strand(0.08, 0.2, -0.46, 0.58)} material={pull} castShadow />
          </group>
        </group>
      </group>
    </group>
  );
}
