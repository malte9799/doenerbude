import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useI18n } from '../i18n/index.jsx';
import { href } from '../router.js';
import Wordmark from '../brand/Wordmark.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import StudioStage from '../three/studio/StudioStage.jsx';
import { Diagnostics, diagnosticErrors } from '../three/studio/Diagnostics.jsx';
import { models, defaultLayers } from '../three/products/index.js';
import { TEXTURE_KEYS } from '../three/materials/index.js';
import { loadTextures } from '../three/tex/textures.js';
import './studio.css';

// Internal review page: every model in the shared studio light, with its
// layers toggleable. Also the place the marketing renders will come from.

const VIEWS = {
  doener: { position: [0.5, 3.6, 5.9], target: [0, 0.6, 0.05] },
  pizza: { position: [0, 3.9, 4.9], target: [0, 0.1, 0.15] },
};

export default function Studio() {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(() => new URLSearchParams(location.hash.split('?')[1]).get('m') || 'doener');
  const [active, setActive] = useState(() => ({ doener: defaultLayers('doener'), pizza: defaultLayers('pizza') }));
  const [baked, setBaked] = useState(false);
  const [turntable, setTurntable] = useState(false);
  const diag = useRef();

  useEffect(() => {
    const started = performance.now();
    loadTextures(TEXTURE_KEYS, setProgress)
      .then(() => {
        console.info(`[studio] textures baked in ${Math.round(performance.now() - started)} ms`);
        setReady(true);
      })
      .catch(err => {
        diagnosticErrors.push(String(err?.message || err));
        setError(err);
      });
  }, []);

  const { Component, layers, bakeable } = models[model];
  const toggle = id =>
    setActive(a => ({ ...a, [model]: a[model].includes(id) ? a[model].filter(x => x !== id) : [...a[model], id] }));
  const view = VIEWS[model];

  return (
    <div className="studio">
      <div className="studio__stage">
        {ready && !error && (
          <ErrorBoundary fallback={err => <p className="studio__error">{String(err?.message || err)}</p>}>
          <Canvas
            key={model}
            shadows="soft"
            dpr={[1, 2]}
            gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 0.88, preserveDrawingBuffer: true }}
            camera={{ fov: 30, position: view.position, near: 0.1, far: 50 }}
          >
            <StudioStage>
              <Component active={active[model]} baked={baked} />
            </StudioStage>
            <Diagnostics target={diag} />
            <OrbitControls target={view.target} enablePan={false} minDistance={2.5} maxDistance={9} maxPolarAngle={Math.PI * 0.47} autoRotate={turntable} autoRotateSpeed={1.2} makeDefault />
          </Canvas>
          </ErrorBoundary>
        )}
        {error && <p className="studio__error">{String(error?.message || error)}</p>}
        <p className="studio__diag" ref={diag}>
          {ready ? 'Canvas startet …' : `Texturen ${Math.round(progress * 100)} %`}
        </p>
        {!ready && !error && (
          <div className="studio__loading">
            <Wordmark className="studio__loading-logo" />
            <div className="studio__bar">
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
        )}
      </div>

      <aside className="studio__panel">
        <header>
          <a href={href('/')} className="studio__home">
            <Wordmark />
          </a>
          <h1>{t('studio.title')}</h1>
          <p>{t('studio.subtitle')}</p>
        </header>

        <section>
          <h2>{t('studio.product')}</h2>
          <div className="seg">
            {Object.keys(models).map(id => (
              <button key={id} className={id === model ? 'is-on' : ''} onClick={() => setModel(id)}>
                {t(`products.${id}.name`)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>{t('studio.ingredients')}</h2>
          <div className="chips">
            {layers.map(l => (
              <button key={l.id} className={`chip ${active[model].includes(l.id) ? 'is-on' : ''}`} onClick={() => toggle(l.id)}>
                {t(`ingredients.${l.id}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="studio__toggles">
          {bakeable && (
            <label>
              <input type="checkbox" checked={baked} onChange={e => setBaked(e.target.checked)} /> {t('studio.baked')}
            </label>
          )}
          <label>
            <input type="checkbox" checked={turntable} onChange={e => setTurntable(e.target.checked)} /> {t('studio.turntable')}
          </label>
        </section>
      </aside>
    </div>
  );
}
