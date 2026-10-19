import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const { damp } = THREE.MathUtils;
const easeOutBack = t => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

// One ingredient layer. Adding drops it into place from above, removing lifts
// it off and shrinks it away – then it is hidden, not just covered. `y` is the
// layer's resting height; changes (a layer below was removed) glide smoothly.
export default function Layer({ active, y = 0, drop = 0.9, children }) {
  const ref = useRef();
  const state = useRef({ p: active ? 1 : 0, y });

  useFrame((_, dt) => {
    const s = state.current;
    const g = ref.current;
    s.p = damp(s.p, active ? 1 : 0, active ? 5 : 8, dt);
    if (Math.abs(s.p - (active ? 1 : 0)) < 0.001) s.p = active ? 1 : 0;
    s.y = damp(s.y, y, 7, dt);
    const away = 1 - s.p;
    g.visible = s.p > 0.002;
    g.position.y = s.y + away * away * drop;
    g.scale.setScalar(0.4 + 0.6 * Math.max(0, easeOutBack(s.p)));
  });

  return <group ref={ref}>{children}</group>;
}
