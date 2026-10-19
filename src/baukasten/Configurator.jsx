import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Loader from '../components/Loader.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import StudioStage from '../three/studio/StudioStage.jsx';
import { IconMinus, IconPlus, IconCheck } from '../components/shop/icons.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useCart } from '../state/cart.jsx';
import { href } from '../router.js';
import { models } from '../three/products/index.js';
import '../components/shop/shop.css';
import { groupLayers } from './groups.js';
import { TAB_MODELS } from './product.js';

const round = n => Math.round(n * 100) / 100;

export default function Configurator({ model, product, ready, progress, error }) {
  const { t, price } = useI18n();
  const cart = useCart();
  const def = models[model];
  const layers = def.layers ?? [];
  const preset = product.preset;
  const [active, setActive] = useState(preset);
  const [baked, setBaked] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(null);

  const toggle = id => {
    setAdded(null);
    setActive(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));
  };
  const label = id => t(`ingredients.${id}`);
  const ordered = layers.filter(l => active.includes(l.id)).map(l => l.id);
  const extra = layers.filter(l => active.includes(l.id) && !preset.includes(l.id));
  const removed = layers.filter(l => preset.includes(l.id) && !active.includes(l.id));
  const unit = round(product.price + extra.reduce((s, l) => s + l.price, 0));
  const groups = useMemo(() => groupLayers(model, layers), [model, layers]);
  const name = t(`products.${product.id}.name`);
  const isPreset = removed.length === 0 && extra.length === 0;

  const summary = [removed.length && t('baukasten.without', { items: removed.map(l => label(l.id)).join(', ') }), extra.length && t('baukasten.with', { items: extra.map(l => label(l.id)).join(' · ') })]
    .filter(Boolean)
    .join(' · ');

  const addToCart = () => {
    cart.add(product.id, unit, { layers: ordered }, qty);
    setAdded({ qty, name });
  };
  const reset = () => {
    setActive(preset);
    setBaked(false);
    setAdded(null);
  };

  const base = def.view ?? { position: [0, 3, 6], target: [0, 0.5, 0] };
  // The stage is portrait-ish next to the studio frame: pull back a little.
  const view = { target: base.target, position: base.position.map((v, i) => base.target[i] + (v - base.target[i]) * 1.15) };
  const Model = def.Component;

  return (
    <div className="bk">
      <section className="bk__stage" aria-label={t('baukasten.stage')}>
        {ready && !error ? (
          <ErrorBoundary fallback={err => <p className="bk__error">{String(err?.message || err)}</p>}>
            <Canvas
              shadows="soft"
              dpr={[1, 2]}
              gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 0.88, preserveDrawingBuffer: true }}
              camera={{ fov: 30, position: view.position, near: 0.5, far: 600 }}
            >
              <StudioStage>
                <Model active={active} baked={baked} />
              </StudioStage>
              <OrbitControls target={view.target} enablePan={false} minDistance={3} maxDistance={14} minPolarAngle={Math.PI * 0.1} maxPolarAngle={Math.PI * 0.47} makeDefault />
            </Canvas>
          </ErrorBoundary>
        ) : error ? (
          <p className="bk__error">{String(error?.message || error)}</p>
        ) : (
          <div className="bk__loading">
            <Loader progress={progress} />
          </div>
        )}
        {ready && <p className="bk__hint">{t('baukasten.hint')}</p>}
      </section>

      <aside className="bk__side">
        <div className="bk__scroll">
          <a className="bk__back" href={href('/bestellen')}>
            ← {t('baukasten.back')}
          </a>

          <nav className="bk__tabs" aria-label={t('baukasten.tabsLabel')}>
            {TAB_MODELS.map(m => (
              <a key={m} href={href(`/baukasten/${m}`)} className={m === model ? 'is-on' : ''} aria-current={m === model ? 'page' : undefined}>
                {t(`baukasten.tabs.${m}`)}
              </a>
            ))}
          </nav>

          <h1 className="bk__title">{name}</h1>
          <p className="bk__desc">{t(`products.${product.id}.desc`)}</p>
          <p className="bk__base">{t('baukasten.from', { price: price(product.price) })}</p>

          <div className="bk__head">
            <h2>{t('baukasten.ingredients')}</h2>
            <button type="button" className="bk__reset" onClick={reset} disabled={isPreset && !baked}>
              {t('baukasten.reset')}
            </button>
          </div>

          {groups.map(g => (
            <fieldset key={g.id} className="bk__group">
              <legend>{t(`baukasten.groups.${g.id}`)}</legend>
              <div className="bk__chips">
                {g.layers.map(l => {
                  const on = active.includes(l.id);
                  const paid = l.price > 0 && !preset.includes(l.id);
                  return (
                    <button key={l.id} type="button" className={`bk__chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggle(l.id)}>
                      <span className="bk__check" aria-hidden="true">
                        {on && <IconCheck width={12} height={12} />}
                      </span>
                      <span className="bk__chip-name">{label(l.id)}</span>
                      {paid && <small>{t('baukasten.plus', { price: price(l.price) })}</small>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {def.bakeable && (
            <label className={`bk__bake ${baked ? 'is-on' : ''}`}>
              <input type="checkbox" checked={baked} onChange={e => setBaked(e.target.checked)} />
              <span className="bk__switch" aria-hidden="true" />
              {t('baukasten.baked')}
            </label>
          )}
        </div>

        <footer className="bk__buy">
          {added ? (
            <div className="bk__done" role="status">
              <p>
                <span className="bk__done-icon">
                  <IconCheck width={16} height={16} />
                </span>
                {t('baukasten.added', added)}
              </p>
              <div className="bk__done-actions">
                <a className="shop-btn shop-btn--primary" href={href('/warenkorb')}>
                  {t('baukasten.toCart')}
                </a>
                <button type="button" className="shop-btn shop-btn--ghost" onClick={reset}>
                  {t('baukasten.another')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="bk__summary">{summary || t('baukasten.unchanged')}</p>
              <div className="bk__row">
                <div className="bk__qty" role="group" aria-label={t('baukasten.quantity')}>
                  <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label={t('baukasten.less')} disabled={qty <= 1}>
                    <IconMinus width={16} height={16} />
                  </button>
                  <output aria-live="polite">{qty}</output>
                  <button type="button" onClick={() => setQty(q => Math.min(20, q + 1))} aria-label={t('baukasten.more')}>
                    <IconPlus width={16} height={16} />
                  </button>
                </div>
                <button type="button" className="shop-btn shop-btn--primary bk__add" onClick={addToCart}>
                  {t('baukasten.add', { price: price(unit * qty) })}
                </button>
              </div>
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}
