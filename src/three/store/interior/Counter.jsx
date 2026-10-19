import { intMaterials as M } from '../../materials/store-interior.js';
import { PLAN } from './anchors.js';
import { Blob, Box, BoxAt } from './Parts.jsx';
import Spit from './Spit.jsx';

// The Tresen: red-tiled front with a glass display case on the left, an oak
// top for the döner products, the spit at the back and a little till.

const { x0, x1, z0, z1, top } = PLAN.counter;
const dEnd = PLAN.displayEnd;
const SLAB = [top - 0.9, top];

function Display() {
  const glassY = [1.5, top - 0.9];
  return (
    <group>
      {/* cavity: floor, back, ends, light */}
      <BoxAt x={[x0, dEnd]} y={[0, 1.4]} z={[z0, z1]} r={0.3} m={M.steel()} />
      <BoxAt x={[x0 + 0.3, dEnd - 0.1]} y={[1.4, top - 0.9]} z={[z0 + 4.4, z0 + 4.9]} r={0.1} m={M.enamelCream()} />
      <BoxAt x={[x0, x0 + 0.5]} y={[0.6, top - 0.9]} z={[z0, z1 + 0.2]} r={0.2} m={M.tileRed()} />
      <BoxAt x={[dEnd - 0.4, dEnd + 0.1]} y={[0.6, top - 0.9]} z={[z0, z1 + 0.2]} r={0.2} m={M.tileRed()} />
      {/* shelves */}
      {[2.2, 6.2].map(y => (
        <BoxAt key={y} x={[x0 + 0.4, dEnd - 0.3]} y={[y - 0.3, y]} z={[z0 + 4.6, z1 - 0.3]} r={0.1} m={M.steelWarm()} />
      ))}
      <BoxAt x={[x0 + 0.5, dEnd - 0.5]} y={[top - 1.4, top - 0.9]} z={[z1 - 2, z1 - 0.5]} r={0.1} m={M.stripLight()} />
      <pointLight position={[(x0 + dEnd) / 2, top - 1.8, z1 - 2.5]} color="#fff0d0" intensity={9} distance={9} decay={1.5} />
      {/* glass front with a steel frame */}
      <mesh position={[(x0 + dEnd) / 2, (glassY[0] + glassY[1]) / 2, z1 - 0.15]} material={M.glass()}>
        <planeGeometry args={[dEnd - x0 - 0.8, glassY[1] - glassY[0] - 0.2]} />
      </mesh>
      <BoxAt x={[x0 + 0.2, dEnd + 0.1]} y={[1.3, 1.9]} z={[z1 - 0.5, z1 + 0.2]} r={0.2} m={M.steel()} />
      <BoxAt x={[x0 + 0.2, x0 + 0.7]} y={[1.3, top - 0.8]} z={[z1 - 0.4, z1 + 0.15]} r={0.15} m={M.steel()} />
      <BoxAt x={[dEnd - 0.5, dEnd + 0.1]} y={[1.3, top - 0.8]} z={[z1 - 0.4, z1 + 0.15]} r={0.15} m={M.steel()} />
    </group>
  );
}

function Till({ x, z }) {
  return (
    <group position={[x, top, z]} rotation={[0, 0.25, 0]}>
      <Box s={[3.2, 1.3, 2.8]} p={[0, 0.65, 0]} r={0.35} m={M.enamelCream()} />
      <Box s={[2.4, 1.5, 0.35]} p={[0, 1.9, -0.7]} r={0.12} rot={[-0.28, 0, 0]} m={M.ink()} />
      <Box s={[2.0, 1.1, 0.1]} p={[0, 1.95, -0.52]} r={0.04} rot={[-0.28, 0, 0]} m={M.enamelHerb()} />
      <Box s={[3.0, 0.25, 1.0]} p={[0, 1.2, 0.9]} r={0.1} m={M.enamelRed()} />
    </group>
  );
}

export default function Counter({ spin = 0 }) {
  return (
    <group>
      <Blob x={(x0 + x1) / 2} z={z1 - 3} w={x1 - x0 + 4} d={9} />

      {/* kick plate + red tiled front */}
      <BoxAt x={[x0 + 0.2, x1 - 0.2]} y={[0, 0.8]} z={[z0, z1 - 0.7]} r={0.3} m={M.ink()} />
      <BoxAt x={[dEnd - 0.4, x1]} y={[0.4, top - 0.9]} z={[z0, z1]} r={0.45} m={M.tileRed()} />
      {/* mustard band under the top */}
      <BoxAt x={[dEnd - 0.3, x1 + 0.05]} y={[top - 1.9, top - 1.3]} z={[z1 - 0.1, z1 + 0.25]} r={0.25} m={M.enamelMustard()} />
      <Display />

      {/* oak top with a bit of overhang */}
      <BoxAt x={[x0 - 0.4, x1 + 0.4]} y={SLAB} z={[z0, z1 + 0.5]} r={0.35} m={M.wood()} />

      {/* steel foot rail */}
      <mesh position={[(dEnd + x1) / 2, 1.9, z1 + 0.45]} rotation={[0, 0, Math.PI / 2]} material={M.steel()}>
        <cylinderGeometry args={[0.2, 0.2, x1 - dEnd - 1, 16]} />
      </mesh>

      <Spit spin={spin} />
      <Till x={8} z={-35} />
    </group>
  );
}
