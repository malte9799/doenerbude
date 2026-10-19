import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MOTION, approach } from '../motion.js';

const easeOutBack = t => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

// One ingredient layer. Removing it hides it completely (not just covered).
// `y` is its resting height. Transitions go through motion.js: currently off,
// so layers appear, disappear and settle instantly. With motion on, adding
// drops the layer in from above and removing lifts it away.
export default function Layer({ active, y = 0, drop = 0.9, children }) {
  const ref = useRef();
  const state = useRef({ p: active ? 1 : 0, y });

  useFrame((_, dt) => {
    const s = state.current;
    const g = ref.current;
    s.p = approach(s.p, active ? 1 : 0, active ? MOTION.rates.layerIn : MOTION.rates.layerOut, dt);
    s.y = approach(s.y, y, MOTION.rates.settle, dt);
    const away = 1 - s.p;
    g.visible = s.p > 0.002;
    g.position.y = s.y + away * away * drop;
    g.scale.setScalar(0.4 + 0.6 * Math.max(0, easeOutBack(s.p)));
  });

  return <group ref={ref}>{children}</group>;
}
