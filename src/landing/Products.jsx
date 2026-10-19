import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { models, defaultLayers } from '../three/products/index.js';
import { productById } from '../data/menu.js';
import { ANCHORS, ANCHOR_ROT, PLAN } from '../three/store/interior/anchors.js';
import { intMaterials } from '../three/materials/store-interior.js';
import { dfMaterials } from '../three/materials/doener-family.js';
import { openProduct } from '../state/selection.js';

// Menu products placed on the anchors of the interior. Every slot is static;
// hover is a scale-up of the product and a tooltip, click opens the product.

// [anchor name, index, model, menu id to open, extra rotation]
// `model` is the registry key; pizzas take their layers from the menu preset.
const S = (anchor, index, menuId, extra = {}) => ({ anchor, index, menuId, ...extra });

export const SLOTS = [
  // counter
  S('counter', 0, 'doener'),
  S('counter', 1, 'duerum'),
  S('counter', 2, 'box'),
  S('counter', 3, 'teller'),
  S('counter', 4, 'lahmacun'),
  // oven shelf
  S('oven', 0, 'margherita', { baked: true }),
  S('oven', 1, 'salami', { baked: true }),
  S('oven', 2, 'vegetaria', { baked: true }),
  S('oven', 3, 'customPizza', { model: 'pizzaBox', baked: true, active: [], rot: Math.PI }),
  // table: sides, dessert, sauces
  S('table', 0, 'pommes'),
  S('table', 1, 'salat'),
  S('table', 2, 'boerek'),
  S('table', 3, 'baklava'),
  S('table', 4, 'dipGarlic'),
  S('table', 5, 'dipHot'),
  S('table', 6, 'dipHerb'),
  S('table', 7, 'dipCocktail'),
  // second table
  S('table2', 0, 'teller'),
  S('table2', 3, 'cola'),
  // glass display case
  S('display', 0, 'boerek'),
  S('display', 1, 'boerek'),
  S('display', 2, 'boerek'),
  S('display', 3, 'baklava'),
  S('display', 4, 'baklava'),
  S('display', 5, 'baklava'),
  // fridge, bottom to top
  ...['wasser', 'limo', 'wasser', 'ayran', 'ayran', 'cola', 'cola', 'limo', 'cola', 'ayran', 'wasser', 'limo'].map((id, i) => S('fridge', i, id)),
];

const layersFor = ({ menuId, model, active }) => {
  const item = productById[menuId];
  const key = model ?? item.model;
  return active ?? item.preset ?? defaultLayers(key);
};

// Soft round "contact shadow" shared by all products.
let blobTexture;
const blob = () => {
  if (blobTexture) return blobTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, 'rgba(60,34,16,0.55)');
  grad.addColorStop(0.6, 'rgba(60,34,16,0.22)');
  grad.addColorStop(1, 'rgba(60,34,16,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  blobTexture = new THREE.CanvasTexture(c);
  blobTexture.colorSpace = THREE.SRGBColorSpace;
  return blobTexture;
};
const blobMaterial = () => new THREE.MeshBasicMaterial({ map: blob(), transparent: true, depthWrite: false, toneMapped: false });
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });

function Slot({ slot, shadow, ui }) {
  const { anchor, index, menuId } = slot;
  const item = productById[menuId];
  const key = slot.model ?? item.model;
  const Component = models[key].Component;
  const pos = ANCHORS[anchor][index];
  const rot = slot.rot ?? ANCHOR_ROT[anchor]?.[index] ?? 0;

  const root = useRef();
  const spin = useRef();
  const hit = useRef();
  const shade = useRef();
  const active = useMemo(() => layersFor(slot), [slot]);

  // Fit the invisible hit box and the contact shadow to the product once.
  useLayoutEffect(() => {
    const r = root.current;
    const inner = spin.current;
    inner.rotation.y = 0;
    r.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(inner);
    inner.rotation.y = rot;
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    hit.current.position.set(centre.x - pos[0], centre.y - pos[1], centre.z - pos[2]);
    hit.current.scale.set(size.x * 1.05, size.y * 1.05, size.z * 1.05);
    if (shade.current) {
      const d = Math.max(size.x, size.z) * 1.35;
      shade.current.scale.set(d, 1, d);
    }
  }, [pos, rot]);

  const enter = e => {
    if (!ui.interactive()) return;
    e.stopPropagation();
    spin.current.scale.setScalar(1.07);
    document.body.style.cursor = 'pointer';
    ui.hover(menuId);
  };
  const leave = () => {
    spin.current.scale.setScalar(1);
    document.body.style.cursor = '';
    ui.hover(null);
  };
  const click = e => {
    if (!ui.interactive()) return;
    e.stopPropagation();
    openProduct(menuId);
  };

  return (
    <group ref={root} position={pos}>
      {shadow && <mesh ref={shade} geometry={blobGeo} material={shadow} position={[0, 0.03, 0]} renderOrder={1} />}
      <group ref={spin} rotation={[0, rot, 0]}>
        <Component active={active} baked={slot.baked} />
      </group>
      <mesh ref={hit} geometry={boxGeo} material={hitMaterial} onPointerOver={enter} onPointerOut={leave} onClick={click} />
    </group>
  );
}

// Everything on the furniture, rendered once.
export const Products = memo(function Products({ ui }) {
  const shadow = useMemo(() => blobMaterial(), []);
  return (
    <group>
      {SLOTS.map(slot => (
        <Slot key={`${slot.anchor}${slot.index}`} slot={slot} shadow={shadow} ui={ui} />
      ))}
    </group>
  );
});

// The tray at the till: shows what is in the cart (max 6 small products) or
// waits empty and inviting.
const TRAY = { x: 7.5, z: -31.6, w: 5.4, d: 3.8 };
const CART_MAX = 6;
const cols = [-1.65, 0, 1.65];

export function Tray({ lines }) {
  const M = intMaterials;
  const shown = useMemo(
    () =>
      lines
        .map(l => ({ line: l, item: productById[l.productId] }))
        .filter(x => x.item?.model)
        .slice(0, CART_MAX),
    [lines],
  );
  return (
    <group position={[TRAY.x, PLAN.counter.top, TRAY.z]} rotation={[0, 0.12, 0]}>
      <RoundedBox args={[TRAY.w, 0.5, TRAY.d]} radius={0.2} smoothness={4} position={[0, 0.25, 0]} material={M.enamelRed()} />
      <RoundedBox args={[TRAY.w - 0.7, 0.2, TRAY.d - 0.7]} radius={0.08} smoothness={3} position={[0, 0.5, 0]} material={dfMaterials.kraft()} />
      {shown.length === 0 && (
        <RoundedBox args={[1.9, 0.08, 1.9]} radius={0.04} smoothness={2} position={[0.9, 0.64, 0.1]} rotation={[0, 0.5, 0]} material={M.enamelCream()} />
      )}
      {shown.map(({ line, item }, i) => {
        const key = item.model;
        const Component = models[key].Component;
        const row = i < 3 ? 0 : 1;
        const x = cols[i % 3] + (row ? 0.4 : 0);
        const z = row ? 0.85 : -0.8;
        const active = item.preset ?? defaultLayers(key);
        return (
          <group key={line.key} position={[x, 0.58, z]} rotation={[0, (i - 2) * 0.35, 0]} scale={0.5}>
            <Component active={active} baked />
          </group>
        );
      })}
    </group>
  );
}
