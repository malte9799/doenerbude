import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { intMaterials as M } from '../../materials/store-interior.js';
import { ANCHORS } from './anchors.js';
import Shell from './Shell.jsx';
import Counter from './Counter.jsx';
import Oven from './Oven.jsx';
import Fridge from './Fridge.jsx';
import Tables from './Tables.jsx';
import MenuBoard from './MenuBoard.jsx';

// The shop interior (1 unit = 10 cm; floor y = 0, front facade z = 0, back
// wall z = -40, side walls x = ±25, ceiling y = 30). The front stays open.
//
// Props
//   spin        0..1  target speed of the döner spit (needs motion on)
//   fridgeOpen  0..1  how far the fridge door is open
//   showAnchors bool  tiny soft markers where products will stand

const MARKER = { counter: '#ff5a3c', oven: '#ffb02e', table: '#4cb86a', table2: '#2f9d8a', fridge: '#4aa3ff', display: '#b07cff' };

function AnchorMarkers() {
  return Object.entries(MARKER).flatMap(([name, color]) =>
    ANCHORS[name].map((p, i) => (
      <mesh key={`${name}${i}`} position={[p[0], p[1] + 0.2, p[2]]} material={M.marker(color)} renderOrder={5}>
        <sphereGeometry args={[0.22, 12, 8]} />
      </mesh>
    )),
  );
}

export default function Interior({ spin = 0, fridgeOpen = 0, showAnchors = false }) {
  // The room is deeper than the studio's default far plane.
  const camera = useThree(s => s.camera);
  const controls = useThree(s => s.controls);
  // Review helper: `#/studio?m=storeInterior&cam=1` exposes window.__intCam(pos, target).
  useEffect(() => {
    if (!/[?&]cam=1/.test(location.hash)) return;
    window.__intCam = (p, t) => {
      camera.position.set(...p);
      if (controls) controls.target.set(...t);
      camera.lookAt(...t);
      controls?.update?.();
    };
  }, [camera, controls]);
  useEffect(() => {
    if (camera.far < 300) {
      camera.far = 300;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return (
    <group>
      <Shell />
      <Counter spin={spin} />
      <Oven />
      <Fridge open={fridgeOpen} />
      <Tables />
      <MenuBoard />
      {(showAnchors || /[?&]anchors=1/.test(location.hash)) && <AnchorMarkers />}
    </group>
  );
}
