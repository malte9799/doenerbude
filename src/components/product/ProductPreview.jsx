import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import StudioStage from '../../three/studio/StudioStage.jsx';
import { TEXTURE_KEYS } from '../../three/materials/index.js';
import { loadTextures } from '../../three/tex/textures.js';
import ErrorBoundary from '../ErrorBoundary.jsx';

const PULL_IN = 1.18; // studio views are framed for a wider canvas

// Small live 3D view of one product in the shared studio light, draggable.
export default function ProductPreview({ model, active, label, hint, failedText }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadTextures(TEXTURE_KEYS)
      .then(() => live && setReady(true))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const { Component } = model;
  const view = model.view ?? { position: [0, 3, 6], target: [0, 0.5, 0] };
  const position = useMemo(() => {
    const target = new THREE.Vector3(...view.target);
    return new THREE.Vector3(...view.position).sub(target).multiplyScalar(PULL_IN).add(target).toArray();
  }, [view]);

  if (failed) return <p className="ppanel__preview-msg">{failedText}</p>;
  return (
    <div className="ppanel__canvas" role="img" aria-label={label}>
      {!ready && <span className="thumb__spinner" aria-hidden="true" />}
      {ready && (
        <ErrorBoundary fallback={() => <p className="ppanel__preview-msg">{failedText}</p>}>
          <Canvas
            shadows="soft"
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 0.88 }}
            camera={{ fov: 30, position, near: 0.5, far: 100 }}
          >
            <StudioStage>
              <Component active={active} baked={Boolean(model.bakeable)} />
            </StudioStage>
            <OrbitControls target={view.target} enablePan={false} enableZoom={false} maxPolarAngle={Math.PI * 0.47} makeDefault />
          </Canvas>
        </ErrorBoundary>
      )}
      {ready && <span className="ppanel__hint">{hint}</span>}
    </div>
  );
}
