import { exteriorMaterials as M } from '../../materials/store-exterior.js';
import { STORE } from '../layout.js';
import Awning from './Awning.jsx';
import Door from './Door.jsx';
import Facade, { WINDOWS } from './Facade.jsx';
import Ground from './Ground.jsx';
import { BistroSet, ExhaustPipe, MenuStand, PlantPot, StreetLamp, WallLamp } from './Props.jsx';
import Sign from './Sign.jsx';

// The shop seen from outside, evening mood. Coordinates follow STORE
// (1 unit = 10 cm, ground y = 0, facade plane z = 0, interior at z < 0).
//
// Props
//   doorOpen  0..1   door swing (driven through motion.js)
//   glow      true   paint a warm interior behind the windows; pass false
//                    when the real interior is rendered behind the facade
//   roof      true   cornice, parapet and roof; hide for a cut-away

export { EXHAUST_TOP } from './Props.jsx';

export default function Exterior({ doorOpen = 0, glow = true, roof = true }) {
  const { height, door } = STORE;
  return (
    <group>
      <Ground />
      <Facade roof={roof} />
      <Door doorOpen={doorOpen} />
      <Awning />
      <Sign />

      {glow && (
        <group>
          {WINDOWS.map((w, i) => (
            <mesh key={i} material={M.glow()} position={[w.x + w.w / 2, w.y + w.h / 2, -1.25]}>
              <planeGeometry args={[w.w + 1, w.h + 1]} />
            </mesh>
          ))}
          <mesh material={M.glow()} position={[door.x, door.height / 2, -2.4]}>
            <planeGeometry args={[door.width + 1, door.height + 1]} />
          </mesh>
        </group>
      )}

      {/* warm light spilling from the windows onto the sidewalk */}
      {WINDOWS.map((w, i) => (
        <mesh key={i} material={M.glowPool()} position={[w.x + w.w / 2, 0.05, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w.w + 9, 15]} />
        </mesh>
      ))}
      <mesh material={M.glowPool()} position={[door.x, 0.06, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
      </mesh>
      {glow && (
        <>
          <pointLight position={[-14.5, 11, 6]} color="#ffa24a" intensity={22} distance={30} decay={2} />
          <pointLight position={[14.5, 11, 6]} color="#ffa24a" intensity={22} distance={30} decay={2} />
        </>
      )}

      {/* props */}
      <MenuStand position={[15.5, 0, 12.8]} rotation={-0.32} />
      <BistroSet position={[-31, 0, 9.5]} rotation={0.5} />
      <PlantPot position={[8.2, 0, 3.8]} scale={1.15} seed={3} />
      <PlantPot position={[-37, 0, 4]} scale={1.25} seed={5} tree />
      <WallLamp position={[23.6, 16.4, 0.5]} />
      <StreetLamp position={[33.5, 0, 14.2]} />
      {roof && <ExhaustPipe position={[15.6, height + 1.9, -26]} />}
    </group>
  );
}
