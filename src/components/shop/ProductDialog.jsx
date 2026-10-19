import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { useCart } from '../../state/cart.jsx';
import { href } from '../../router.js';
import Modal from './Modal.jsx';
import ProductThumb from './ProductThumb.jsx';
import { IconMinus, IconPlus } from './icons.jsx';
import { baseLayers, extraLabel, optionsFor, unitPrice } from '../../pages/order/options.js';
import { lookupModel } from './thumbRenderer.js';

export default function ProductDialog({ product, onClose }) {
  const { t, price } = useI18n();
  const cart = useCart();
  const opts = useMemo(() => optionsFor(product), [product]);
  const [size, setSize] = useState(opts.defaultSize);
  const [extras, setExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const name = t(`products.${product.id}.name`);
  const unit = unitPrice(product, size, extras);
  const model = lookupModel(product);

  const toggle = id => setExtras(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]));
  // Picked model layers show up in the preview render.
  const layers = model ? [...baseLayers(product), ...extras.filter(id => opts.extras.find(e => e.id === id)?.layer)] : undefined;

  const submit = () => {
    const options = {};
    if (size) options.size = size;
    if (extras.length) options.extras = [...extras].sort();
    cart.add(product.id, unit, options, qty);
    onClose();
  };

  return (
    <Modal labelledBy="dlg-title" onClose={onClose} className="pdlg">
      <div className="pdlg__media">
        <ProductThumb product={product} name={name} layers={layers} />
      </div>
      <div className="pdlg__body">
        <div className="pdlg__scroll">
          <h2 id="dlg-title" className="pdlg__title">
            {name}
          </h2>
          <p className="pdlg__desc">{t(`products.${product.id}.desc`)}</p>
          <p className="pdlg__base">{t('common.from', { price: price(product.price) })}</p>

          {opts.sizes && (
            <fieldset className="pdlg__group">
              <legend>{t('shop.dialog.size')}</legend>
              <div className="pdlg__sizes">
                {opts.sizes.map(s => (
                  <label key={s.id} className={`pdlg__size ${size === s.id ? 'is-on' : ''}`}>
                    <input type="radio" name="size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} />
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
                {t('shop.dialog.extras')} <span>{t('shop.dialog.extrasHint')}</span>
              </legend>
              <div className="pdlg__extras">
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
            <a className="pdlg__builder" href={href(`/baukasten/${product.configurable}?p=${product.id}`)}>
              <strong>{t('shop.dialog.builder')}</strong>
              <span>{t('shop.dialog.builderHint')}</span>
            </a>
          )}
        </div>

        <footer className="pdlg__foot">
          <div className="qty" role="group" aria-label={t('shop.dialog.quantity')}>
            <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t('shop.dialog.decrease')}>
              <IconMinus />
            </button>
            <output aria-live="polite">{qty}</output>
            <button type="button" onClick={() => setQty(q => Math.min(20, q + 1))} aria-label={t('shop.dialog.increase')}>
              <IconPlus />
            </button>
          </div>
          <button type="button" className="shop-btn shop-btn--primary pdlg__add" onClick={submit} data-autofocus>
            {t('shop.dialog.addToCart', { price: price(unit * qty) })}
          </button>
        </footer>
      </div>
    </Modal>
  );
}
