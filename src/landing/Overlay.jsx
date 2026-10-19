import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Wordmark from '../brand/Wordmark.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href } from '../router.js';
import { productById } from '../data/menu.js';
import { RAIL, progressOfStation } from './rail.js';

// Product under the pointer, shared between the 3D slots and the tooltip
// without re-rendering the page.
let hovered = null;
const listeners = new Set();
export const setHover = id => {
  if (id === hovered) return;
  hovered = id;
  listeners.forEach(l => l());
};
const useHover = () =>
  useSyncExternalStore(
    l => (listeners.add(l), () => listeners.delete(l)),
    () => hovered,
  );

function Tooltip() {
  const { t, price } = useI18n();
  const id = useHover();
  const ref = useRef();
  useEffect(() => {
    const move = e => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);
  const item = id && productById[id];
  return (
    <div ref={ref} className={`landing__tip ${item ? 'is-on' : ''}`} aria-hidden="true">
      {item && (
        <>
          <strong>{t(`products.${id}.name`)}</strong>
          <span>{price(item.price)}</span>
        </>
      )}
    </div>
  );
}

const scrollToStation = i => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: progressOfStation(i) * max, behavior: 'smooth' });
};

export default function Overlay({ state, count }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0); // station whose copy is shown
  const [near, setNear] = useState(true); // camera at rest at that station?
  const [started, setStarted] = useState(false);

  // Poll the camera's station coordinate; React only updates on changes.
  useEffect(() => {
    let raf;
    const tick = () => {
      const s = state.station;
      const i = Math.round(s);
      const rest = Math.abs(s - i) < 0.2;
      setActive(prev => (prev === i ? prev : i));
      setNear(prev => (prev === rest ? prev : rest));
      setStarted(prev => prev || s > 0.15);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  return (
    <div className="landing__ui">
      <header className="landing__bar">
        <a className="landing__logo" href={href('/')} aria-label="Start">
          <Wordmark />
        </a>
        <nav className="landing__actions">
          <a className="landing__cart" href={href('/warenkorb')}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M3 4h2.2l2.1 10.2a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.76L19.5 8H6.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9.5" cy="19" r="1.4" fill="currentColor" />
              <circle cx="16.5" cy="19" r="1.4" fill="currentColor" />
            </svg>
            <span>{t('nav.cart')}</span>
            {count > 0 && <b className="landing__badge">{count}</b>}
          </a>
          <a className="landing__order" href={href('/bestellen')}>
            {t('nav.orderNow')}
          </a>
        </nav>
      </header>

      <div className="landing__copy">
        {RAIL.map((station, i) => (
          <section key={station.id} className={`landing__card ${active === i && near ? 'is-on' : ''}`} aria-hidden={active !== i}>
            <p className="landing__eyebrow">{t(`landing.stations.${station.id}.eyebrow`)}</p>
            <h2>{t(`landing.stations.${station.id}.title`)}</h2>
            <p>
              {station.id === 'checkout' && !count ? t('landing.emptyTray') : t(`landing.stations.${station.id}.text`)}
            </p>
            {station.id === 'checkout' && (
              <div className="landing__cta">
                <a className="landing__order" href={href('/kasse')}>
                  {t('landing.checkout')}
                </a>
                <a className="landing__ghost" href={href('/bestellen')}>
                  {t('nav.order')}
                </a>
              </div>
            )}
          </section>
        ))}
      </div>

      <nav className="landing__dots" aria-label={t('landing.stationNav')}>
        {RAIL.map((station, i) => (
          <button key={station.id} className={active === i ? 'is-on' : ''} onClick={() => scrollToStation(i)} aria-label={t(`landing.stations.${station.id}.nav`)} aria-current={active === i}>
            <span className="landing__dot-label">{t(`landing.stations.${station.id}.nav`)}</span>
            <i />
          </button>
        ))}
      </nav>

      <p className={`landing__hint ${started ? '' : 'is-on'}`}>
        <span>{t('landing.scroll')}</span>
        <i />
      </p>

      <Tooltip />
    </div>
  );
}
