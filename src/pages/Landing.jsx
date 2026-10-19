import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { navigate } from '../router.js';
import Loader from '../components/Loader.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { Diagnostics, diagnosticErrors, installShaderDiagnostics } from '../three/studio/Diagnostics.jsx';
import { TEXTURE_KEYS } from '../three/materials/index.js';
import { loadTextures } from '../three/tex/textures.js';
import { useCart } from '../state/cart.jsx';
import { useSelectedProduct } from '../state/selection.js';
import SceneContent from '../landing/Scene.jsx';
import Overlay, { setHover } from '../landing/Overlay.jsx';
import { LAST } from '../landing/rail.js';
import '../landing/landing.css';

// The 3D landing: a tall scroll area drives a camera rail through the shop
// (src/landing/rail.js); the canvas stays fixed behind the HTML overlay.

const Scene = memo(SceneContent);
const SCROLL_VH = 1100; // total page height in viewport heights

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

export default function Landing() {
  const [webgl] = useState(hasWebGL);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { lines, count } = useCart();
  const selected = useSelectedProduct();
  const diag = useRef();
  const showDiag = /[?&]diag/.test(location.hash);

  // Shared with the canvas without re-rendering React: scroll progress,
  // pointer, the current station coordinate.
  const state = useRef({ progress: 0, mouse: { x: 0, y: 0 }, station: 0 }).current;
  const panelOpen = useRef(false);
  panelOpen.current = selected != null;
  const ui = useMemo(() => ({ interactive: () => state.station > 1.8 && !panelOpen.current, hover: setHover }), [state]);

  useEffect(() => {
    if (!webgl) navigate('/bestellen');
  }, [webgl]);

  useEffect(() => {
    if (!webgl) return;
    loadTextures(TEXTURE_KEYS, setProgress)
      .then(() => setReady(true))
      .catch(err => {
        diagnosticErrors.push(String(err?.message || err));
        setFailed(true);
      });
  }, [webgl]);

  useEffect(() => {
    if (!ready) return undefined;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      state.progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onMove = e => {
      state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('mousemove', onMove);
      document.body.style.cursor = '';
    };
  }, [ready, state]);

  // The page scrolls from the top whenever the landing opens.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!webgl) return null;
  if (failed) {
    return (
      <main className="landing landing--error">
        <p>{diagnosticErrors.at(-1)}</p>
      </main>
    );
  }
  if (!ready) return <Loader progress={progress} />;

  return (
    <main className="landing" style={{ '--landing-height': `${SCROLL_VH}vh` }}>
      <div className="landing__canvas">
        <ErrorBoundary fallback={err => <p className="landing__error">{String(err?.message || err)}</p>}>
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 0.9 }}
            camera={{ fov: 34, near: 0.3, far: 1200, position: [-40, 21, 80] }}
            onCreated={({ gl }) => installShaderDiagnostics(gl)}
          >
            <Scene state={state} lines={lines} ui={ui} />
            {showDiag && <Diagnostics target={diag} />}
          </Canvas>
        </ErrorBoundary>
      </div>
      <div className="landing__scroll" aria-hidden="true" />
      <Overlay state={state} count={count} last={LAST} />
      {showDiag && <p className="landing__diag" ref={diag} />}
    </main>
  );
}
