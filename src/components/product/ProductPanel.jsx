import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { closeProduct, useSelectedProduct } from '../../state/selection.js';
import { useI18n } from '../../i18n/index.jsx';
import { useCart } from '../../state/cart.jsx';
import { href } from '../../router.js';
import { products } from '../../data/menu.js';
import { baseLayers, extraLabel, optionsFor, optionSummary, unitPrice } from '../../pages/order/options.js';
import { lookupModel } from '../shop/thumbRenderer.js';
import { ThumbPlaceholder } from '../shop/ProductThumb.jsx';
import { IconClose, IconMinus, IconPlus } from '../shop/icons.jsx';
import '../shop/shop.css';
import './product.css';

const ProductPreview = lazy(() => import('./ProductPreview.jsx'));

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Global product drawer, mounted once in App. Opens when a product is
// selected via openProduct(id) (3D store, anywhere). The `is-open` class is
// the hook for a later slide-in transition.
export default function ProductPanel() {
  const id = useSelectedProduct();
  const product = id ? products.find(p => p.id === id) : null;

  // Freeze the page while the drawer is open – on the landing, scrolling would
  // otherwise keep moving the camera behind it.
  useEffect(() => {
    if (!product) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev;
    };
  }, [product]);

  if (!product) return null;
  return <Drawer key={product.id} product={product} />;
}

function Drawer({ product }) {
  const { t, price } = useI18n();
  const cart = useCart();
  const ref = useRef();
  const opts = useMemo(() => optionsFor(product), [product]);
  const model = lookupModel(product);
  const [size, setSize] = useState(opts.defaultSize);
  const [extras, setExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(null);
  const name = t(`products.${product.id}.name`);
  const unit = unitPrice(product, size, extras);

  const toggle = extra => setExtras(list => (list.includes(extra) ? list.filter(x => x !== extra) : [...list, extra]));
  // Picked model layers show up in the 3D preview.
  const active = useMemo(
    () => (model ? [...baseLayers(product), ...extras.filter(e => opts.extras.find(o => o.id === e)?.layer)] : []),
    [model, product, extras, opts],
  );

  // Focus in, trap Tab, Esc closes, focus returns to the opener.
  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    (node.querySelector('[data-autofocus]') ?? node.querySelector(FOCUSABLE))?.focus();
    const onKey = e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeProduct();
      } else if (e.key === 'Tab') {
        const items = [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  // The swapped footer would drop the focus; move it to the primary action.
  useEffect(() => {
    if (added) ref.current.querySelector('[data-autofocus]')?.focus();
  }, [added]);

  const submit = () => {
    const options = {};
    if (size) options.size = size;
    if (extras.length) options.extras = [...extras].sort();
    cart.add(product.id, unit, options, qty);
    setAdded({ qty, options });
  };

  const summary = added ? optionSummary(t, added.options) : '';

  return createPortal(
    <div className="ppanel is-open" onMouseDown={e => e.target === e.currentTarget && closeProduct()}>
      <aside ref={ref} className="ppanel__drawer" role="dialog" aria-modal="true" aria-labelledby="ppanel-title">
        <button type="button" className="modal__close ppanel__close" onClick={closeProduct} aria-label={t('panel.close')}>
          <IconClose />
        </button>

        <div className="ppanel__scroll">
          <div className="ppanel__media">
            {model ? (
              <Suspense
                fallback={
                  <div className="ppanel__canvas">
                    <span className="thumb__spinner" aria-hidden="true" />
                  </div>
                }
              >
                <ProductPreview
                  model={model}
                  active={active}
                  label={t('panel.preview', { name })}
                  hint={t('panel.dragHint')}
                  failedText={t('panel.previewFailed')}
                />
              </Suspense>
            ) : (
              <ThumbPlaceholder product={product} name={name} />
            )}
          </div>

          <div className="ppanel__body">
            <h2 id="ppanel-title" className="pdlg__title">
              {name}
            </h2>
            <p className="pdlg__desc">{t(`products.${product.id}.desc`)}</p>
            <p className="pdlg__base">{t('panel.from', { price: price(product.price) })}</p>

            {opts.sizes && (
              <fieldset className="pdlg__group">
                <legend>{t('panel.size')}</legend>
                <div className="pdlg__sizes">
                  {opts.sizes.map(s => (
                    <label key={s.id} className={`pdlg__size ${size === s.id ? 'is-on' : ''}`}>
                      <input type="radio" name="ppanel-size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} />
                      <span>{t(`shop.sizes.${s.id}`)}</span>
                      <small>{s.delta === 0 ? price(product.price) : `${s.delta > 0 ? '+' : '−'}${price(Math.abs(s.delta))}`}</small>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {opts.extras.length > 0 && (
              <fieldset className="pdlg__group">
                <legend>
                  {t('panel.extras')} <span>{t('panel.extrasHint')}</span>
                </legend>
                <div className="pdlg__extras ppanel__extras">
                  {opts.extras.map(e => (
                    <label key={e.id} className={`pdlg__extra ${extras.includes(e.id) ? 'is-on' : ''}`}>
                      <input type="checkbox" checked={extras.includes(e.id)} onChange={() => toggle(e.id)} />
                      <span className="pdlg__check" aria-hidden="true" />
                      <span className="pdlg__extra-name">{extraLabel(t, e.id)}</span>
                      <span className="pdlg__extra-price">+{price(e.price)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {product.configurable && (
              <a className="pdlg__builder" href={href(`/baukasten/${product.configurable}?p=${product.id}`)} onClick={closeProduct}>
                <strong>{t('panel.builder')}</strong>
                <span>{t('panel.builderHint')}</span>
              </a>
            )}
          </div>
        </div>

        {added ? (
          <footer className="ppanel__foot ppanel__foot--added" role="status">
            <div className="ppanel__added">
              <strong>{t('panel.added')}</strong>
              <span>{[t('panel.addedLine', { qty: added.qty, name }), summary].filter(Boolean).join(' · ')}</span>
            </div>
            <div className="ppanel__actions">
              <button type="button" className="shop-btn shop-btn--ghost" onClick={closeProduct}>
                {t('panel.keepBrowsing')}
              </button>
              <a className="shop-btn shop-btn--primary" href={href('/warenkorb')} onClick={closeProduct} data-autofocus>
                {t('panel.toCart')}
              </a>
            </div>
          </footer>
        ) : (
          <footer className="ppanel__foot">
            <div className="qty" role="group" aria-label={t('panel.quantity')}>
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t('panel.decrease')}>
                <IconMinus />
              </button>
              <output aria-live="polite">{qty}</output>
              <button type="button" onClick={() => setQty(q => Math.min(20, q + 1))} aria-label={t('panel.increase')}>
                <IconPlus />
              </button>
            </div>
            <button type="button" className="shop-btn shop-btn--primary pdlg__add" onClick={submit} data-autofocus>
              {t('panel.addToCart', { price: price(unit * qty) })}
            </button>
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}
