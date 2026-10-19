import { intMaterials as M } from '../../materials/store-interior.js';
import { PLAN } from './anchors.js';
import { Blob, Box, Cyl, Rod } from './Parts.jsx';

// Two small tables. Table A (sides & sauces) is a long oak table on splayed
// legs with two chairs; table B is a round bistro table with two stools.
// Everything stands a little crooked, like a real shop.

const A = PLAN.tableA;
const B = PLAN.tableB;

function Chair({ x, z, ry, tone = 0 }) {
  const mat = tone ? M.woodDark() : M.wood();
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <Blob x={0} z={0} w={5} d={5} strength={0.8} />
      <Box s={[3.6, 0.7, 3.6]} p={[0, 4.55, 0]} r={0.3} m={mat} />
      {[
        [-1.35, -1.35],
        [1.35, -1.35],
        [-1.35, 1.35],
        [1.35, 1.35],
      ].map(([lx, lz], i) => (
        <Rod key={i} r={0.3} taper={0.8} y={[0, 4.3]} p={[lx * 1.05, lz * 1.05]} rot={[lz * 0.05, 0, -lx * 0.05]} m={M.steel()} />
      ))}
      {/* backrest: a rounded slat */}
      <Box s={[3.5, 2.5, 0.55]} p={[0, 6.6, -1.6]} r={0.25} rot={[-0.12, 0, 0]} m={mat} />
      <Rod r={0.18} y={[4.8, 6.0]} p={[-1.3, -1.55]} m={M.steel()} />
      <Rod r={0.18} y={[4.8, 6.0]} p={[1.3, -1.55]} m={M.steel()} />
    </group>
  );
}

function Stool({ x, z, ry }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <Blob x={0} z={0} w={4.6} d={4.6} strength={0.8} />
      <Cyl r={1.8} h={0.8} bevel={0.35} p={[0, 4.1, 0]} m={M.enamelRed()} />
      {[0, 1, 2].map(i => (
        <Rod key={i} r={0.26} taper={0.75} y={[0, 4.2]} p={[Math.cos(i * 2.094 + 0.4) * 1.1, Math.sin(i * 2.094 + 0.4) * 1.1]} rot={[Math.sin(i * 2.094 + 0.4) * 0.1, 0, -Math.cos(i * 2.094 + 0.4) * 0.1]} m={M.steel()} />
      ))}
      <Cyl r={1.5} h={0.25} bevel={0.1} p={[0, 1.7, 0]} m={M.steel()} />
    </group>
  );
}

export default function Tables() {
  const top = A.top;
  return (
    <group>
      {/* table A */}
      <group position={[A.x, 0, A.z]} rotation={[0, 0.03, 0]}>
        <Blob x={0} z={0} w={A.w + 4} d={A.d + 4} />
        <Box s={[A.w, 0.9, A.d]} p={[0, top - 0.45, 0]} r={0.4} m={M.wood()} />
        <Box s={[A.w - 1.4, 0.5, A.d - 1.4]} p={[0, top - 1.1, 0]} r={0.2} m={M.steel()} />
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz], i) => (
          <Rod key={i} r={0.42} taper={0.75} y={[0, top - 0.9]} p={[sx * (A.w / 2 - 0.9), sz * (A.d / 2 - 0.7)]} rot={[sz * 0.045, 0, -sx * 0.045]} m={M.steel()} />
        ))}
        {/* low shelf between the legs */}
        <Box s={[A.w - 2.2, 0.3, A.d - 2]} p={[0, 1.8, 0]} r={0.12} m={M.steel()} />
      </group>
      <Chair x={A.x - A.w / 2 - 2.6} z={A.z + 0.4} ry={Math.PI / 2 + 0.12} />
      <Chair x={A.x + A.w / 2 + 2.5} z={A.z - 0.5} ry={-Math.PI / 2 - 0.2} tone={1} />

      {/* table B */}
      <group position={[B.x, 0, B.z]}>
        <Blob x={0} z={0} w={B.r * 2 + 4} d={B.r * 2 + 4} />
        <Cyl r={B.r} h={0.9} bevel={0.4} p={[0, B.top - 0.9, 0]} m={M.wood()} />
        <Rod r={0.5} y={[0.4, B.top - 0.9]} p={[0, 0]} m={M.steel()} />
        <Cyl r={2.3} h={0.5} bevel={0.22} m={M.steel()} />
      </group>
      <Stool x={B.x - 4.6} z={B.z + 2.2} ry={0.4} />
      <Stool x={B.x + 4.4} z={B.z - 2.8} ry={-0.3} />
    </group>
  );
}
