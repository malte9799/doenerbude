import { useMemo } from 'react';
import { blobShape, jitter, slab } from '../../geo.js';
import { exteriorMaterials as M } from '../../materials/store-exterior.js';
import { memo, rbox } from './shapes.js';
import { roadDashes, Shadow } from './Props.jsx';

// Diorama ground: rounded terrazzo pedestal, sidewalk, curb and a strip of street.

export const GROUND = { x: 41, sidewalkFront: 16.5, back: -45, curb: 2.2, streetFront: 45 };

export default function Ground() {
  const plinth = useMemo(
    () => memo('extPlinth', () => {
      const g = slab(blobShape({ w: 92, h: 98, p: 8, wobble: 0.008, seed: 5, points: 96 }), { thickness: 6, bevel: 1.8, bevelSegments: 6, uvScale: 0.08 });
      g.translate(0, -4.8, 0);
      return g;
    }),
    [],
  );
  const dashes = useMemo(() => roadDashes(), []);
  const { x, sidewalkFront, back, curb, streetFront } = GROUND;
  const sideD = sidewalkFront - back;
  const streetD = streetFront - (sidewalkFront + curb);

  return (
    <group>
      <mesh geometry={plinth} material={M.stone()} position={[0, 0, 1.5]} />
      {/* sidewalk */}
      <mesh geometry={rbox(x * 2, 1.4, sideD, 0.45)} material={M.paving()} position={[0, -0.7, back + sideD / 2]} />
      {/* curb */}
      <mesh geometry={rbox(x * 2, 1.5, curb, 0.6)} material={M.paving()} position={[0, -0.55, sidewalkFront + curb / 2]} />
      {/* street */}
      <mesh geometry={rbox(x * 2, 1.4, streetD, 0.4)} material={M.asphalt()} position={[0, -1.7, sidewalkFront + curb + streetD / 2]} />
      {dashes.map((d, i) => (
        <mesh key={i} geometry={rbox(5.2 * d.s, 0.3, 0.8, 0.14)} material={M.paper()} position={[d.p[0], -0.6, 33.4 + d.p[2] * 0.3]} rotation={[0, d.r[1] * 0.4, 0]} />
      ))}
      {/* long contact shadow of the building on the sidewalk */}
      <Shadow x={0} z={1.2} w={64} d={7} y={0.03} />
    </group>
  );
}
